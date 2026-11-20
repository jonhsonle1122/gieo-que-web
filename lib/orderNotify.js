// Gửi email báo đơn mới qua Resend — CHỈ chạy phía server.
// Nguyên tắc an toàn: hàm này KHÔNG BAO GIỜ ném lỗi ra ngoài. Thiếu
// RESEND_API_KEY (vd chạy local) hoặc Resend lỗi → bỏ qua lặng lẽ
// (chỉ console.error phía server), việc tạo đơn của khách không bị ảnh hưởng.
import { PACKAGES, formatVND } from "@/lib/config";
import { LINH_VUC } from "@/lib/luan";

const ADMIN_URL = "https://gieo-que-web-deploy.vercel.app/admin";
const DEFAULT_NOTIFY_EMAIL = "jonhsonle1122@gmail.com";

export async function notifyNewOrder(order) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return; // chưa cấu hình → không gửi, không lỗi
    const to = process.env.ORDER_NOTIFY_EMAIL || DEFAULT_NOTIFY_EMAIL;

    const pkg = PACKAGES.find((p) => p.id === order.package);
    const pkgLabel = pkg
      ? `${pkg.name} — ${formatVND(pkg.price)}`
      : `${order.package} — ${formatVND(order.price)}`;
    const topicLabel = LINH_VUC[order.topic]?.nhan || order.topic;
    const placedAt = order.created_at
      ? new Date(order.created_at).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          hour12: false,
        })
      : "";

    const text = [
      `Mã đơn: ${order.code}`,
      `Khách: ${order.name}`,
      `Liên hệ: ${order.contact}`,
      `Gói: ${pkgLabel}`,
      `Lĩnh vực: ${topicLabel}`,
      `Câu hỏi: ${order.question}`,
      placedAt ? `Thời gian đặt: ${placedAt}` : null,
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
