import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured, getAuthedAdmin, hasRole } from "@/lib/supabaseServer";
import { logOrderEvent, fetchOrderEvents } from "@/lib/orderEvents";
import { broadcastOrderUpdate } from "@/lib/orderRealtime";
import { ORDER_STATUSES } from "@/lib/config";

// API quản trị đơn luận sâu — bắt buộc: Supabase đã cấu hình + Bearer token
// của tài khoản quản trị (phân giải vai trong lib/supabaseServer.js).
// Ma trận quyền (GĐ3): GET — mọi vai (owner/reader/viewer);
// PATCH — chỉ owner + reader (viewer chỉ xem, server chặn hẳn, không dựa
// vào việc ẩn nút ở giao diện).
//
// GĐ1 (2026-11-20): thêm cột nháp (draft_requested_at, draft_reading) và
// nhật ký order_events. Mọi thao tác với cột/bảng mới đều có đường dự phòng:
// nếu migration 2026-11-20 chưa chạy, admin cũ vẫn hoạt động bình thường.
async function guard(req) {
  if (!supabaseConfigured()) {
    return { error: NextResponse.json({ ok: false, configured: false, error: "Chưa cấu hình Supabase." }, { status: 503 }) };
  }
  const admin = await getAuthedAdmin(req);
  if (!admin) {
    return { error: NextResponse.json({ ok: false, error: "Chưa đăng nhập hoặc email không có quyền admin." }, { status: 403 }) };
  }
  return { admin };
}

const BASE_COLS =
  "id, code, name, contact, question, topic, package, price, status, cast_json, reading, created_at, updated_at, delivered_at";
const FULL_COLS = BASE_COLS + ", draft_requested_at, draft_reading";
// Mô hình tùy hỷ (2026-11-21): thêm 2 cột ghi nhận tùy hỷ (migration
// 2026-11-21). Chưa chạy migration thì tự lùi từng tầng như GĐ1.
const ALL_COLS = FULL_COLS + ", tuy_hy_amount, tuy_hy_noted_at";
const NEW_COLS = ["draft_requested_at", "draft_reading", "tuy_hy_amount", "tuy_hy_noted_at"];

// Đọc một đơn; cột mới chưa có (chưa migration) thì tự lùi về tầng dưới.
async function selectOrder(sb, id) {
  let r = await sb.from("orders").select(ALL_COLS).eq("id", id).single();
  if (r.error) r = await sb.from("orders").select(FULL_COLS).eq("id", id).single();
  if (r.error) r = await sb.from("orders").select(BASE_COLS).eq("id", id).single();
  return r;
}

export async function GET(req) {
  const g = await guard(req);
  if (g.error) return g.error;
  const status = new URL(req.url).searchParams.get("status");
  const sb = supabaseAdmin();
  const build = (cols) => {
    let q = sb.from("orders").select(cols).order("created_at", { ascending: false }).limit(200);
    if (status && Object.prototype.hasOwnProperty.call(ORDER_STATUSES, status)) {
      q = q.eq("status", status);
    }
    return q;
  };
  let { data, error } = await build(ALL_COLS);
  if (error) ({ data, error } = await build(FULL_COLS));
  if (error) ({ data, error } = await build(BASE_COLS));
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const eventsMap = await fetchOrderEvents(sb, data.map((o) => o.id));
  const orders = data.map((o) => ({ ...o, events: eventsMap.get(o.id) || [] }));
  return NextResponse.json({ ok: true, orders });
}

export async function PATCH(req) {
  const g = await guard(req);
  if (g.error) return g.error;
  const admin = g.admin;
  // Vai "Chỉ xem" (viewer) không được sửa đơn — chốt chặn phía server.
  if (!hasRole(admin, "owner", "reader")) {
    return NextResponse.json(
      { ok: false, error: "Vai Chỉ xem không được thay đổi đơn. Cần vai Luận viên hoặc Chủ." },
      { status: 403 }
    );
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ ok: false, error: "Thiếu id đơn." }, { status: 400 });

  const sb = supabaseAdmin();
  const cur = await selectOrder(sb, id);
  if (cur.error || !cur.data) {
    return NextResponse.json({ ok: false, error: "Không tìm thấy đơn." }, { status: 404 });
  }
  const current = cur.data;
  const now = new Date().toISOString();
  const patch = { updated_at: now };
  const events = []; // { action, detail }
  const actor = { orderId: id, actorType: "user", actorLabel: admin.email, actorUserId: admin.userId || null };

  // Yêu cầu Muse soạn nháp: vào hàng chờ (xóa nháp cũ nếu yêu cầu soạn lại),
  // đang chờ (cho_luan ở mô hình tùy hỷ, da_thanh_toan ở mô hình cũ) thì
  // chuyển sang dang_luan.
  if (body.draft_request === true) {
    patch.draft_requested_at = now;
    patch.draft_reading = null;
    if (current.status === "da_thanh_toan" || current.status === "cho_luan") patch.status = "dang_luan";
    events.push({ action: "draft_requested", detail: { re_request: Boolean(current.draft_reading) } });
  }

  // Duyệt nháp: chép draft_reading -> reading chính thức, xóa hàng chờ.
  if (body.approve_draft === true) {
    if (!current.draft_reading) {
      return NextResponse.json({ ok: false, error: "Đơn chưa có bài nháp để duyệt." }, { status: 400 });
    }
    patch.reading = String(current.draft_reading).slice(0, 50000);
    patch.draft_requested_at = null;
    events.push({ action: "reading_attached", detail: { from_draft: true } });
  }

  if (body.status !== undefined) {
    if (!Object.prototype.hasOwnProperty.call(ORDER_STATUSES, body.status)) {
      return NextResponse.json({ ok: false, error: "Trạng thái không hợp lệ." }, { status: 400 });
    }
    patch.status = body.status;
    if (body.status === "da_gui") patch.delivered_at = now;
    if (body.status !== current.status && !(body.draft_request === true && body.status === current.status)) {
      const detail = { from_status: current.status, to_status: body.status };
      if (body.status === "da_thanh_toan") events.push({ action: "paid_marked", detail });
      else if (body.status === "da_gui") events.push({ action: "delivered", detail });
      else if (body.status === "da_tu_choi") events.push({ action: "rejected", detail });
      else events.push({ action: "status_changed", detail });
    }
  }
  // draft_request tự chuyển da_thanh_toan -> dang_luan: ghi thêm sự kiện đổi trạng thái.
  if (body.draft_request === true && patch.status && patch.status !== current.status && body.status === undefined) {
    events.push({
      action: "status_changed",
      detail: { from_status: current.status, to_status: patch.status, via: "draft_request" },
    });
  }

  if (body.reading !== undefined) {
    patch.reading = String(body.reading).slice(0, 50000);
    if (body.approve_draft !== true) events.push({ action: "reading_attached", detail: null });
  }

  // "Đã báo khách" (Khối 2 — GĐ2): admin đã tự gửi mẫu tin Zalo cho khách.
  // Chỉ ghi nhật ký, không đổi trạng thái hay nội dung đơn.
  if (body.customer_notified === true) {
    events.push({ action: "customer_notified", detail: { via: "zalo" } });
  }

  // Ghi nhận tùy hỷ (mô hình v2 — D5): chủ trang đối chiếu tiền về trong
  // app ngân hàng rồi nhập số tiền vào đơn. Đây là số liệu nội bộ để đo
  // mô hình, KHÔNG phải công nợ: không đổi trạng thái, không ảnh hưởng
  // quyền lợi của khách. tuy_hy_amount = null nghĩa là xóa ghi nhận.
  if (body.tuy_hy_amount !== undefined) {
    const amt =
      body.tuy_hy_amount === null
        ? null
        : Math.max(0, Math.floor(Number(body.tuy_hy_amount) || 0));
    patch.tuy_hy_amount = amt;
    patch.tuy_hy_noted_at = amt ? now : null;
    events.push({ action: "tuy_hy_noted", detail: { amount: amt } });
  }

  // Cập nhật — nếu lỗi vì cột mới chưa tồn tại (chưa migration) thì bỏ các
  // cột mới và thử lại, để thao tác cũ (trạng thái/bài luận) không bị gãy.
  let { data, error } = await sb.from("orders").update(patch).eq("id", id).select().single();
  if (error && NEW_COLS.some((c) => c in patch)) {
    const slim = { ...patch };
    for (const c of NEW_COLS) delete slim[c];
    ({ data, error } = await sb.from("orders").update(slim).eq("id", id).select().single());
    if (!error) {
      for (const ev of events) {
        await logOrderEvent(sb, { ...actor, action: ev.action, detail: ev.detail });
      }
      await broadcastOrderUpdate({ code: data.code, contact: data.contact, status: data.status });
      return NextResponse.json({
        ok: true,
        order: data,
        warning: "Đã cập nhật phần cơ bản. Một số cột mới chưa có trong cơ sở dữ liệu — cần chạy các migration còn thiếu trong Supabase SQL Editor (hàng chờ nháp: 2026-11-20, mô hình tùy hỷ: 2026-11-21) để bật đầy đủ tính năng.",
      });
    }
  }
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  for (const ev of events) {
    await logOrderEvent(sb, { ...actor, action: ev.action, detail: ev.detail });
  }
  // Phát tín hiệu realtime cho trang tra cứu của khách (nếu đang mở): chỉ là
  // thông báo "đơn có cập nhật", trang sẽ tự tra cứu lại. Lỗi phát bỏ qua.
  await broadcastOrderUpdate({ code: data.code, contact: data.contact, status: data.status });
  const eventsMap = await fetchOrderEvents(sb, [id]);
  return NextResponse.json({ ok: true, order: { ...data, events: eventsMap.get(id) || [] } });
}
