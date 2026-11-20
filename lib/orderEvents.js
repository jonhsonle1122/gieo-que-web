// Ghi nhật ký thao tác theo đơn (bảng order_events) — CHỈ chạy phía server.
// Mọi lần ghi đều bọc try/catch: bảng chưa được tạo (chưa chạy migration
// 2026-11-20) hoặc lỗi mạng thì bỏ qua lặng lẽ, KHÔNG bao giờ làm hỏng
// thao tác chính của admin/khách.
export async function logOrderEvent(sb, { orderId, actorType, actorLabel, actorUserId = null, action, detail = null }) {
  if (!sb || !orderId || !action) return;
  try {
    const { error } = await sb.from("order_events").insert({
      order_id: orderId,
      actor_type: actorType,
      actor_label: actorLabel,
      actor_user_id: actorUserId,
      action,
      detail,
    });
    if (error) console.error("[order_events] ghi sự kiện thất bại:", error.message);
  } catch (e) {
    console.error("[order_events] ghi sự kiện thất bại:", e && e.message);
  }
}

// Đọc timeline sự kiện của một danh sách đơn. Trả về Map order_id -> [events]
// (mới nhất xếp cuối theo thời gian tăng dần để hiển thị timeline xuôi).
// Bảng chưa có thì trả Map rỗng.
export async function fetchOrderEvents(sb, orderIds) {
  const map = new Map();
  if (!sb || !orderIds || orderIds.length === 0) return map;
  try {
    const { data, error } = await sb
      .from("order_events")
      .select("order_id, actor_type, actor_label, action, detail, created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: true })
      .limit(2000);
    if (error || !data) return map;
    for (const ev of data) {
      if (!map.has(ev.order_id)) map.set(ev.order_id, []);
      map.get(ev.order_id).push(ev);
    }
  } catch {
    // bảng chưa tồn tại — bỏ qua
  }
  return map;
}
