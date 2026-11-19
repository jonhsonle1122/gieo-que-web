import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { PACKAGES } from "@/lib/config";
import { LINH_VUC } from "@/lib/luan";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // bỏ ký tự dễ nhầm (I, L, O, 0, 1)
function makeCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return "GQ-" + s;
}

function vietqrUrl(price, code) {
  const bank = process.env.BANK_ID;
  const acc = process.env.BANK_ACCOUNT;
  if (!bank || !acc) return null;
  return `https://img.vietqr.io/image/${encodeURIComponent(bank)}-${encodeURIComponent(acc)}-compact2.png?amount=${price}&addInfo=${encodeURIComponent(code)}`;
}

// Trang đặt đơn hỏi trước xem hệ thống đã cấu hình chưa.
export async function GET() {
  return NextResponse.json({
    configured: supabaseConfigured(),
    bankConfigured: Boolean(process.env.BANK_ID && process.env.BANK_ACCOUNT),
    bankHolder: process.env.BANK_HOLDER || null,
    bankId: process.env.BANK_ID || null,
    bankAccount: process.env.BANK_ACCOUNT || null,
  });
}

export async function POST(req) {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: "Hệ thống đặt đơn chưa được cấu hình Supabase." },
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
  const pkg = PACKAGES.find((p) => p.id === body.package) || PACKAGES[0];
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

  const sb = supabaseAdmin();
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    const { data, error } = await sb
      .from("orders")
      .insert({
        code,
        name,
        contact,
        question,
        topic,
        package: pkg.id,
        price: pkg.price,
        status: "cho_thanh_toan",
        cast_json: castJson,
      })
      .select("code, price, package, status, created_at")
      .single();
    if (!error && data) {
      return NextResponse.json({
        ok: true,
        order: data,
        vietqrUrl: vietqrUrl(data.price, data.code),
        bankHolder: process.env.BANK_HOLDER || null,
        bankId: process.env.BANK_ID || null,
        bankAccount: process.env.BANK_ACCOUNT || null,
      });
    }
    lastError = error;
    if (!error || error.code !== "23505") break; // 23505 = trùng mã đơn, thử mã khác
  }
  return NextResponse.json(
    { ok: false, error: "Không tạo được đơn lúc này, vui lòng thử lại. " + (lastError ? lastError.message : "") },
    { status: 500 }
  );
}
