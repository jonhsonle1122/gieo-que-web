import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";

// Ghi log mỗi quẻ đã gieo (trang chủ gọi fire-and-forget để đo nhu cầu).
// Chưa cấu hình Supabase thì bỏ qua lặng lẽ — gieo quẻ vẫn chạy bình thường.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !body.cast_json) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: true, stored: false });
  }
  try {
    const sb = supabaseAdmin();
    const { error } = await sb.from("casts").insert({
      cast_json: body.cast_json,
      question: typeof body.question === "string" ? body.question.slice(0, 500) : null,
      topic: typeof body.topic === "string" ? body.topic.slice(0, 50) : null,
      method: typeof body.method === "string" ? body.method.slice(0, 20) : null,
    });
    if (error) return NextResponse.json({ ok: true, stored: false });
    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({ ok: true, stored: false });
  }
}
