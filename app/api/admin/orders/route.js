import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured, getAuthedAdmin } from "@/lib/supabaseServer";
import { ORDER_STATUSES } from "@/lib/config";

// API quản trị đơn luận sâu — bắt buộc: Supabase đã cấu hình + Bearer token
// của tài khoản Supabase Auth có email nằm trong ADMIN_EMAILS.
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

export async function GET(req) {
  const g = await guard(req);
  if (g.error) return g.error;
  const status = new URL(req.url).searchParams.get("status");
  const sb = supabaseAdmin();
  let q = sb
    .from("orders")
    .select("id, code, name, contact, question, topic, package, price, status, cast_json, reading, created_at, updated_at, delivered_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status && Object.prototype.hasOwnProperty.call(ORDER_STATUSES, status)) {
    q = q.eq("status", status);
  }
  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, orders: data });
}

export async function PATCH(req) {
  const g = await guard(req);
  if (g.error) return g.error;
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ ok: false, error: "Thiếu id đơn." }, { status: 400 });
  const patch = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) {
    if (!Object.prototype.hasOwnProperty.call(ORDER_STATUSES, body.status)) {
      return NextResponse.json({ ok: false, error: "Trạng thái không hợp lệ." }, { status: 400 });
    }
    patch.status = body.status;
    if (body.status === "da_gui") patch.delivered_at = new Date().toISOString();
  }
  if (body.reading !== undefined) patch.reading = String(body.reading).slice(0, 50000);
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("orders").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, order: data });
}
