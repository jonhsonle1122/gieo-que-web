import { NextResponse } from "next/server";

// Cấu hình CÔNG KHAI cho trình duyệt (trang tra cứu dùng để mở kênh Supabase
// Realtime). Chỉ gồm URL + anon key — hai giá trị vốn đã là NEXT_PUBLIC_*,
// không có khóa bí mật nào ở đây.
export async function GET() {
  return NextResponse.json({
    ok: true,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  });
}
