// Cấu hình tập trung của site — giá, gói luận sâu, trạng thái đơn.
// Đổi giá/chữ hiển thị tại đây, toàn site tự cập nhật.

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Gieo Quẻ Kinh Dịch";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";
export const SITE_DESCRIPTION =
  "Gieo quẻ Kinh Dịch online theo phép Lục Hào gieo 3 xu và Mai Hoa theo giờ — an quẻ đầy đủ Lục Thân, Lục Thú, Trường Sinh, phục thần; tra cứu 64 quẻ và đặt luận sâu theo câu hỏi riêng.";

// Giá luận sâu (VND) — cấu hình tại một chỗ duy nhất.
export const PRICES = {
  standard: 79000,
  priority: 99000,
};

export const PACKAGES = [
  {
    id: "standard",
    name: "Luận sâu tiêu chuẩn",
    price: PRICES.standard,
    eta: "Trả bài trong 24 giờ",
    points: [
      "Luận riêng theo đúng câu hỏi và quẻ đã gieo",
      "Phân tích Dụng thần, vượng suy, hào động, phục thần",
      "Kết luận + việc nên làm / nên tránh",
    ],
  },
  {
    id: "priority",
    name: "Luận sâu ưu tiên + ứng kỳ",
    price: PRICES.priority,
    eta: "Ưu tiên trả bài trong 6 giờ",
    points: [
      "Toàn bộ nội dung gói tiêu chuẩn",
      "Ứng kỳ chi tiết: mốc thời gian việc có khả năng ứng nghiệm",
      "Ưu tiên xếp hàng luận trước, xét thêm quẻ biến / quẻ hỗ",
    ],
  },
];

export const ORDER_STATUSES = {
  cho_thanh_toan: "Chờ thanh toán",
  da_thanh_toan: "Đã thanh toán",
  dang_luan: "Đang luận",
  da_gui: "Đã gửi bài luận",
};

export function formatVND(n) {
  return Number(n).toLocaleString("vi-VN") + "đ";
}
