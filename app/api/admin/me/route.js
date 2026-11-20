import { NextResponse } from "next/server";
import { supabaseConfigured, getAuthedAdmin } from "@/lib/supabaseServer";

// Thông tin tài khoản quản trị đang đăng nhập (email + vai) — giao diện
// admin dùng để hiện vai của chính mình và ẩn/hiện các khu vực theo vai.
// Quyền thật vẫn do từng route API kiểm tra phía server.
export async function GET(req) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, configured: false, error: "Chưa cấu hình Supabase." }, { status: 503 });
  }
  const admin = await getAuthedAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Chưa đăng nhập hoặc tài khoản không có quyền quản trị." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true, email: admin.email, userId: admin.userId, role: admin.role });
}
