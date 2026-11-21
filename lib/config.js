// Cấu hình tập trung của site — trạng thái đơn, mô hình tùy hỷ, mẫu tin.
// Đổi chữ/hằng số tại đây, toàn site tự cập nhật.
//
// MÔ HÌNH V2 — TÙY HỶ (chốt 2026-11-21, bản thiết kế
// thiet-ke-mo-hinh-web-gieo-que-v2.md): luận sâu KHÔNG còn bán theo gói.
// Khách gửi yêu cầu miễn phí → hàng đợi cho_luan → dang_luan → da_gui →
// sau khi đọc bài mới hiện lời mời tùy hỷ tự nguyện (VietQR số tiền mở).
// PRICES/PACKAGES bên dưới CHỈ còn để hiển thị dữ liệu đơn cũ thời mô
// hình giá (lịch sử), không còn dùng ở bất kỳ luồng công khai nào.

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Gieo Quẻ Kinh Dịch";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";
export const SITE_DESCRIPTION =
  "Gieo quẻ Kinh Dịch online theo phép Lục Hào gieo 3 xu và Mai Hoa theo giờ — an quẻ đầy đủ Lục Thân, Lục Thú, Trường Sinh, phục thần; tra cứu 64 quẻ và gửi yêu cầu luận sâu theo câu hỏi riêng (không thu phí, nhận tùy hỷ).";

// ── Dữ liệu lịch sử mô hình giá cũ — KHÔNG dùng cho luồng mới ──────────
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

// ── Mô hình tùy hỷ ──────────────────────────────────────────────────────
// Giá trị cột `package` của yêu cầu luận sâu mô hình mới.
export const TUY_HY_PACKAGE = "tuy_hy";

// Hàng đợi (thiết kế mục 2.3): số yêu cầu cho_luan tối đa hệ thống nhận
// cùng lúc — vượt ngưỡng thì form tự đóng. Nhịp xử lý ước tính (bài/ngày)
// để suy ETA hiển thị từ độ dài hàng đợi thật.
export const QUEUE_MAX_PENDING = 10;
export const QUEUE_DAILY_RATE = 2;
// Giới hạn theo liên hệ (thiết kế mục 2.3): 1 yêu cầu đang chờ tại một
// thời điểm; tối đa 3 yêu cầu đã hoàn tất trong 30 ngày; câu hỏi trùng y
// hệt trong 7 ngày thì từ chối nhẹ nhàng.
export const CONTACT_MAX_PENDING = 1;
export const CONTACT_MAX_DONE_30D = 3;
export const CONTACT_DUP_DAYS = 7;
// Ngưỡng "treo" của hàng đợi mới (quyết định D4): yêu cầu cho_luan quá
// số ngày này chưa xử lý thì admin gắn nhãn treo.
export const QUEUE_STUCK_DAYS = 7;

// Đoạn chữ ở trang luận sâu — giải thích mô hình tùy hỷ (thiết kế mục
// 2.2a, NGUYÊN VĂN đã chốt; **...** là in đậm khi hiển thị). Nguyên tắc
// giữ chữ: không con số, không neo giá trá hình, không gợi tội lỗi.
export const TUY_HY_PAGE_TITLE = "Luận sâu theo yêu cầu — không thu phí, nhận tùy hỷ";
export const TUY_HY_PAGE_PARAS = [
  "Bạn gieo quẻ, gửi câu hỏi, chúng tôi luận riêng theo đúng quẻ và câu hỏi của bạn rồi gửi bài qua trang tra cứu. Phần luận này **không có giá** — chúng tôi không bán câu trả lời về việc riêng của bạn.",
  "Sau khi đọc bài, nếu thấy bài luận giúp ích cho mình, bạn có thể gửi một khoản **tùy hỷ** (tùy tâm, tùy khả năng) để ủng hộ việc duy trì trang web và công việc luận quẻ. **Không gửi cũng hoàn toàn được** — bài luận của bạn vẫn đầy đủ như nhau, và những lần gửi yêu cầu sau của bạn cũng không bị ảnh hưởng gì.",
  "Mỗi ngày chúng tôi chỉ nhận một số lượng yêu cầu nhất định để giữ chất lượng. Nếu hàng đợi đầy, trang này sẽ báo rõ và mời bạn quay lại sau.",
];

// Lời mời tùy hỷ — hiện đúng một lần ở cuối bài, SAU khi khách đã nhận
// bài (thiết kế mục 2.2b, NGUYÊN VĂN đã chốt). Tuyệt đối không hiện ở
// bước gửi yêu cầu.
export const TUY_HY_INVITE_PARAS = [
  "Cảm ơn bạn đã đọc bài luận.",
  "Bài luận này được gửi đến bạn mà không thu phí. Nếu bài luận giúp bạn rõ hơn về việc của mình và bạn muốn ủng hộ để trang web tiếp tục được duy trì, bạn có thể gửi tùy hỷ qua mã QR bên dưới — số tiền do bạn tự quyết định theo khả năng của mình.",
  "Nếu lúc này bạn không gửi được, xin cứ yên tâm: **0 đồng cũng là hoàn toàn bình thường**, không cần áy náy. Chỉ cần bài luận có ích cho bạn là đủ.",
];

// Câu trả lời mẫu khi yêu cầu bị từ chối vì thuộc vùng cấm (thiết kế mục
// 2.4 — bản dùng chung, không điền nhóm vấn đề cụ thể).
export const REFUSAL_TEXT =
  "Câu hỏi này nằm ngoài phạm vi chúng tôi có thể luận. Nếu đây là việc gấp hoặc liên quan sức khỏe/an toàn, bạn nên tìm tới bác sĩ / cơ quan chức năng / người có chuyên môn để được hỗ trợ trực tiếp. Cảm ơn bạn đã tin tưởng.";

export const ORDER_STATUSES = {
  cho_luan: "Chờ luận",
  dang_luan: "Đang luận",
  da_gui: "Đã gửi bài luận",
  da_tu_choi: "Đã từ chối",
  // Trạng thái mô hình giá cũ — giữ nhãn để đọc dữ liệu lịch sử.
  cho_thanh_toan: "Chờ thanh toán",
  da_thanh_toan: "Đã thanh toán",
};

// Địa chỉ site công khai (dùng trong tin nhắn gửi khách). NEXT_PUBLIC_SITE_URL
// chưa đặt thì dùng domain production hiện tại.
export const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://gieo-que-web-deploy.vercel.app"
).replace(/\/+$/, "");
export const LOOKUP_URL = PUBLIC_SITE_URL + "/tra-cuu";

// ── Hằng số mô hình cũ — CHỈ còn phục vụ hiển thị đơn lịch sử ──────────
// Hạn giao bài của đơn cũ tính từ lúc khách TẠO ĐƠN (orders.created_at):
// gói thường 24 giờ, gói ưu tiên 6 giờ. Đơn cũ chờ thanh toán quá ngưỡng
// này (giờ) thì admin gắn nhãn "treo".
export const ETA_HOURS = { standard: 24, priority: 6 };
export const STUCK_HOURS = 48;

// Mẫu tin nhắn Zalo báo khách nhận bài (Khối 2 — GĐ2). Sửa chữ tại đây.
// Đã rà theo mô hình tùy hỷ (thiết kế mục 3.4): mẫu không nhắc thanh
// toán nên giữ nguyên. Biến mẫu: {name} tên khách, {code} mã đơn,
// {link} link tra cứu.
export const ZALO_MESSAGE_TEMPLATE =
  "Chào {name}, bài luận sâu cho đơn {code} của bạn đã sẵn sàng. " +
  "Bạn xem bài tại {link} — nhập mã đơn {code} và số điện thoại/email đã dùng khi đặt đơn là xem được. " +
  "Cảm ơn bạn đã tin tưởng Gieo Quẻ Kinh Dịch!";

export function zaloNotifyMessage(order) {
  return ZALO_MESSAGE_TEMPLATE.replaceAll("{name}", order.name || "bạn")
    .replaceAll("{code}", order.code || "")
    .replaceAll("{link}", LOOKUP_URL);
}

export function formatVND(n) {
  return Number(n).toLocaleString("vi-VN") + "đ";
}
