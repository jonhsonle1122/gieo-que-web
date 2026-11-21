import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import {
  TUY_HY_PACKAGE,
  QUEUE_MAX_PENDING,
  QUEUE_DAILY_RATE,
  CONTACT_MAX_PENDING,
  CONTACT_MAX_DONE_30D,
  CONTACT_DUP_DAYS,
} from "@/lib/config";
import { LINH_VUC } from "@/lib/luan";
import { notifyNewOrder } from "@/lib/orderNotify";
import { logOrderEvent } from "@/lib/orderEvents";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // bỏ ký tự dễ nhầm (I, L, O, 0, 1)
function makeCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return "GQ-" + s;
}

// ETA trung thực từ độ dài hàng đợi thật (thiết kế mục 2.3): số yêu cầu
// đang chờ (kèm yêu cầu sắp gửi) chia cho nhịp xử lý ước tính mỗi ngày.
function etaDaysFor(pendingCount) {
  return Math.max(1, Math.ceil((pendingCount + 1) / QUEUE_DAILY_RATE));
}

async function countPending(sb) {
  const { count, error } = await sb
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "cho_luan");
  if (error) return null;
  return count || 0;
}

// Trang luận sâu hỏi trước: hệ thống đã cấu hình chưa + hàng đợi hiện tại
// (để hiện số yêu cầu đang chờ và ETA, hoặc tự đóng form khi đã đầy).
export async function GET() {
  const base = { configured: supabaseConfigured() };
  if (!base.configured) return NextResponse.json({ ...base, queue: null });
  try {
    const pending = await countPending(supabaseAdmin());
    if (pending === null) return NextResponse.json({ ...base, queue: null });
    return NextResponse.json({
      ...base,
      queue: {
        pending,
        etaDays: etaDaysFor(pending),
        closed: pending >= QUEUE_MAX_PENDING,
      },
    });
  } catch {
    return NextResponse.json({ ...base, queue: null });
  }
}

// Kiểm tra giới hạn chống lạm dụng theo liên hệ + toàn hệ thống (thiết kế
// mục 2.3). Trả về thông báo lỗi rõ ràng cho khách, hoặc null nếu được
// gửi. Lỗi truy vấn ở bước này thì BỎ QUA lặng lẽ (không chặn nhầm khách
// thật vì sự cố phụ) — giới hạn là lớp bảo vệ mềm, không phải cổng chính.
async function checkLimits(sb, { contact, question }) {
  try {
    // Toàn hệ thống: hàng đợi đầy thì không nhận thêm.
    const pending = await countPending(sb);
    if (pending !== null && pending >= QUEUE_MAX_PENDING) {
      return "Hiện hàng đợi luận sâu đã đầy nên chúng tôi tạm ngừng nhận yêu cầu mới để giữ chất lượng. Mời bạn quay lại sau ít hôm.";
    }
    // Mỗi liên hệ: tối đa 1 yêu cầu đang chờ (chờ luận / đang luận).
    const { data: waiting } = await sb
      .from("orders")
      .select("id")
      .eq("contact", contact)
      .eq("package", TUY_HY_PACKAGE)
      .in("status", ["cho_luan", "dang_luan"])
      .limit(CONTACT_MAX_PENDING);
    if (waiting && waiting.length >= CONTACT_MAX_PENDING) {
      return "Bạn đang có một yêu cầu luận sâu chưa có bài. Hãy chờ nhận bài của yêu cầu đó rồi hãy gửi yêu cầu mới — mỗi người chỉ nên có một yêu cầu đang chờ tại một thời điểm.";
    }
    // Mỗi liên hệ: tối đa 3 yêu cầu đã hoàn tất trong 30 ngày.
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const { count: doneCount } = await sb
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("contact", contact)
      .eq("package", TUY_HY_PACKAGE)
      .eq("status", "da_gui")
      .gte("created_at", since30);
    if (doneCount !== null && doneCount !== undefined && doneCount >= CONTACT_MAX_DONE_30D) {
      return `Bạn đã nhận ${CONTACT_MAX_DONE_30D} bài luận sâu trong 30 ngày gần nhất — tạm thời chúng tôi chưa nhận thêm yêu cầu từ liên hệ này để dành phần cho người khác. Mời bạn quay lại sau.`;
    }
    // Trùng câu hỏi y hệt từ cùng liên hệ trong 7 ngày: hướng về bài đã có.
    const sinceDup = new Date(Date.now() - CONTACT_DUP_DAYS * 86400000).toISOString();
    const { data: dup } = await sb
      .from("orders")
      .select("id, code")
      .eq("contact", contact)
      .eq("package", TUY_HY_PACKAGE)
      .eq("question", question)
      .gte("created_at", sinceDup)
      .limit(1);
    if (dup && dup.length > 0) {
      return `Bạn đã gửi đúng câu hỏi này gần đây (mã yêu cầu ${dup[0].code}). Một việc chỉ nên luận một lần trong thời gian ngắn — hãy xem lại bài luận của yêu cầu đó ở trang Tra cứu.`;
    }
  } catch (err) {
    console.error("[orders] Kiểm tra giới hạn thất bại (đã bỏ qua):", err);
  }
  return null;
}

export async function POST(req) {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: "Hệ thống nhận yêu cầu chưa được cấu hình Supabase." },
      { status: 503 }
    );
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  const name = String(body.name || "").trim().slice(0, 100);
  const contact = String(body.contact || "").trim().slice(0, 120);
  const question = String(body.question || "").trim().slice(0, 1000);
  const topic = String(body.topic || "");
  if (!name || !contact || !question) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng điền đủ họ tên, thông tin liên hệ và câu hỏi." },
      { status: 400 }
    );
  }
  if (!Object.prototype.hasOwnProperty.call(LINH_VUC, topic)) {
    return NextResponse.json({ ok: false, error: "Lĩnh vực không hợp lệ." }, { status: 400 });
  }
  const castJson =
    body.cast_json && typeof body.cast_json === "object" ? body.cast_json : null;
  // Yêu cầu luận sâu bắt buộc gắn với một quẻ đã gieo (chốt 2026-11-20 sau
  // đơn GQ-T9G6Z9 vào mà không có quẻ): không có ảnh chụp quẻ hợp lệ thì
  // từ chối, tránh yêu cầu mà không có gì để luận.
  if (!castJson || !castJson.result || !castJson.result.que_chu) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Yêu cầu luận sâu cần gắn với một quẻ đã gieo. Vui lòng gieo quẻ trước rồi quay lại gửi yêu cầu.",
      },
      { status: 400 }
    );
  }

  const sb = supabaseAdmin();

  const limitError = await checkLimits(sb, { contact, question });
  if (limitError) {
    return NextResponse.json({ ok: false, error: limitError }, { status: 409 });
  }

  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    // Trạng thái khởi tạo của mô hình tùy hỷ là cho_luan. Nếu DB chưa chạy
    // migration 2026-11-21 (CHECK constraint chưa có cho_luan — lỗi
    // 23514) thì lùi về trạng thái cũ cho_thanh_toan để luồng nhận yêu
    // cầu không gãy; admin vẫn xử lý được như đơn thường.
    const statuses = ["cho_luan", "cho_thanh_toan"];
    let data = null;
    let error = null;
    for (const status of statuses) {
      const r = await sb
        .from("orders")
        .insert({
          code,
          name,
          contact,
          question,
          topic,
          package: TUY_HY_PACKAGE,
          price: 0,
          status,
          cast_json: castJson,
        })
        .select("id, code, price, package, status, created_at")
        .single();
      data = r.data;
      error = r.error;
      if (!error && data) break;
      if (!error || error.code !== "23514") break; // chỉ lùi khi bị CHECK trạng thái chặn
    }
    if (!error && data) {
      // Ghi vết tạo yêu cầu (actor Hệ thống) — bỏ qua lặng lẽ nếu bảng sự
      // kiện chưa được tạo (chưa chạy migration 2026-11-20).
      await logOrderEvent(sb, {
        orderId: data.id,
        actorType: "system",
        actorLabel: "Hệ thống",
        action: "created",
        detail: { code: data.code, package: data.package, model: "tuy_hy" },
      });
      // Báo yêu cầu mới qua email (Resend) — hàm này không bao giờ ném
      // lỗi, mail hỏng/thiếu khóa cũng không ảnh hưởng việc gửi yêu cầu.
      await notifyNewOrder({ ...data, name, contact, question, topic });
      const pending = await countPending(sb);
      return NextResponse.json({
        ok: true,
        order: data,
        queue: pending === null ? null : { pending, etaDays: etaDaysFor(pending) },
      });
    }
    lastError = error;
    if (!error || error.code !== "23505") break; // 23505 = trùng mã, thử mã khác
  }
  return NextResponse.json(
    { ok: false, error: "Không gửi được yêu cầu lúc này, vui lòng thử lại. " + (lastError ? lastError.message : "") },
    { status: 500 }
  );
}
