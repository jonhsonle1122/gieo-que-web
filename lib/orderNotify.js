// Gửi email báo yêu cầu luận sâu mới qua Resend — CHỈ chạy phía server.
// Nguyên tắc an toàn: hàm này KHÔNG BAO GIỜ ném lỗi ra ngoài. Thiếu
// RESEND_API_KEY (vd chạy local) hoặc Resend lỗi → bỏ qua lặng lẽ
// (chỉ console.error phía server), việc tạo đơn của khách không bị ảnh hưởng.
// Mô hình tùy hỷ (2026-11-21): email không còn dòng gói/giá — chỉ còn
// thông tin yêu cầu luận sâu.
import { LINH_VUC } from "@/lib/luan";

const ADMIN_URL = "https://gieo-que-web-deploy.vercel.app/admin";
const DEFAULT_NOTIFY_EMAIL = "jonhsonle1122@gmail.com";

export async function notifyNewOrder(order) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return; // chưa cấu hình → không gửi, không lỗi
    const to = process.env.ORDER_NOTIFY_EMAIL || DEFAULT_NOTIFY_EMAIL;

    const topicLabel = LINH_VUC[order.topic]?.nhan || order.topic;
    const placedAt = order.created_at
      ? new Date(order.created_at).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          hour12: false,
        })
      : "";

    const text = [
      `Mã yêu cầu: ${order.code}`,
      `Khách: ${order.name}`,
      `Liên hệ: ${order.contact}`,
      `Loại: Yêu cầu luận sâu (mô hình tùy hỷ — không thu phí trước)`,
      `Lĩnh vực: ${topicLabel}`,
      `Câu hỏi: ${order.question}`,
      placedAt ? `Thời gian gửi yêu cầu: ${placedAt}` : null,
      `Xử lý tại: ${ADMIN_URL}`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Cloudflare của Resend từng chặn client mặc định (lỗi 1010) —
        // dùng User-Agent dạng trình duyệt cho chắc.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        from: "Gieo Que Kinh Dich <onboarding@resend.dev>",
        to: [to],
        subject: `[Gieo Quẻ] Đơn mới ${order.code}`,
        text,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[orderNotify] Resend trả ${res.status}: ${detail.slice(0, 300)}`);
    }
  } catch (err) {
    console.error("[orderNotify] Gửi mail báo đơn thất bại (đã bỏ qua):", err);
  }
}
