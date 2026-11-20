// Realtime cho trang tra cứu — CHỈ chạy phía server (service-role key).
//
// Cơ chế: Supabase Realtime Broadcast trên kênh riêng theo đơn. Topic suy ra
// từ mã đơn + sha256(thông tin liên hệ) rút gọn — người lạ không đoán được
// kênh của đơn người khác. Tín hiệu CHỈ báo "đơn có cập nhật" kèm trạng thái
// mới, KHÔNG chứa nội dung bài luận; trang khách nhận tín hiệu rồi gọi lại
// API tra cứu như cũ để lấy dữ liệu chuẩn (bài chỉ phát khi status = da_gui).
//
// Mọi lần phát đều bọc try/catch: Realtime lỗi hoặc chưa cấu hình thì bỏ qua
// lặng lẽ, KHÔNG bao giờ làm hỏng thao tác chính.
import { createHash } from "crypto";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function orderChannelTopic(code, contact) {
  const hash = createHash("sha256")
    .update(String(contact || "").trim())
    .digest("hex")
    .slice(0, 16);
  return `order-${String(code || "").trim().toUpperCase()}-${hash}`;
}

export async function broadcastOrderUpdate({ code, contact, status }) {
  if (!URL || !SERVICE || !code) return false;
  try {
    const res = await fetch(`${URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE,
        Authorization: `Bearer ${SERVICE}`,
      },
      body: JSON.stringify({
        messages: [
          {
            topic: orderChannelTopic(code, contact),
            event: "order-updated",
            payload: { status: status || null, at: new Date().toISOString() },
            private: false,
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error("[realtime] broadcast thất bại:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[realtime] broadcast thất bại:", e && e.message);
    return false;
  }
}
