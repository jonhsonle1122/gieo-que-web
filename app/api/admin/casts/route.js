import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured, getAuthedAdmin } from "@/lib/supabaseServer";

// Danh sách lượt gieo gần đây (Khối 3 — GĐ2) — dữ liệu nghiên cứu nhu cầu,
// CHỈ tồn tại sau đăng nhập admin. Bắt buộc token admin như mọi route admin.
// Phân quyền (GĐ3): cả 3 vai owner/reader/viewer đều xem được.
export async function GET(req) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, configured: false, error: "Chưa cấu hình Supabase." }, { status: 503 });
  }
  const admin = await getAuthedAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập hoặc email không có quyền admin." }, { status: 403 });
  }
  const limitParam = parseInt(new URL(req.url).searchParams.get("limit") || "50", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(100, Math.max(1, limitParam)) : 50;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("casts")
    .select("id, question, topic, method, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, casts: data || [] });
}
