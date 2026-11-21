import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { orderChannelTopic } from "@/lib/orderRealtime";
import { TUY_HY_PACKAGE } from "@/lib/config";

// VietQR SỐ TIỀN MỞ cho khối tùy hỷ (mô hình v2): không điền sẵn amount —
// khách tự nhập số tiền trong app ngân hàng. Nội dung chuyển khoản giữ
// mã yêu cầu để chủ trang đối chiếu khi ghi nhận tùy hỷ bằng tay (như
// cách đối soát cũ). Chưa cấu hình ngân hàng thì trả null, trang ẩn QR.
function tuyHyQrUrl(code) {
  const bank = process.env.BANK_ID;
  const acc = process.env.BANK_ACCOUNT;
  if (!bank || !acc) return null;
  return `https://img.vietqr.io/image/${encodeURIComponent(bank)}-${encodeURIComponent(acc)}-compact2.png?addInfo=${encodeURIComponent(code)}`;
}

// Tra cứu đơn bằng mã đơn + thông tin liên hệ đã dùng khi đặt.
export async function POST(req) {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: "Hệ thống tra cứu chưa được cấu hình Supabase." },
      { status: 503 }
    );
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  const code = String(body.code || "").trim().toUpperCase().slice(0, 20);
  const contact = String(body.contact || "").trim().slice(0, 120);
  if (!code || !contact) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng nhập mã đơn và thông tin liên hệ." },
      { status: 400 }
    );
  }
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("orders")
    .select("code, name, contact, question, topic, package, price, status, reading, created_at, delivered_at")
    .eq("code", code)
    .eq("contact", contact)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ ok: false, error: "Lỗi tra cứu, vui lòng thử lại." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Không tìm thấy đơn khớp mã đơn và thông tin liên hệ này." },
      { status: 404 }
    );
  }
  const delivered = data.status === "da_gui";
  // Khối tùy hỷ chỉ hiện cho đơn mô hình mới SAU khi bài đã giao (thiết
  // kế mục 2.1/3.4). Không trả bất kỳ dữ liệu tiền nào của khách.
  const showTuyHy = delivered && data.package === TUY_HY_PACKAGE;
  return NextResponse.json({
    ok: true,
    order: {
      code: data.code,
      name: data.name,
      question: data.question,
      topic: data.topic,
      package: data.package,
      price: data.price,
      status: data.status,
      created_at: data.created_at,
      delivered_at: data.delivered_at,
      reading: delivered ? data.reading : null,
      show_tuy_hy: showTuyHy,
      tuy_hy_qr: showTuyHy ? tuyHyQrUrl(data.code) : null,
      tuy_hy_bank_holder: showTuyHy ? process.env.BANK_HOLDER || null : null,
      // Kênh Realtime riêng của đơn (suy ra từ mã đơn + liên hệ đã xác thực ở
      // trên) — trang tra cứu đăng ký nghe kênh này để tự cập nhật. Kênh chỉ
      // mang tín hiệu "có cập nhật", không mang nội dung bài.
      channel: orderChannelTopic(data.code, data.contact),
    },
  });
}
