import { SITE_NAME } from "@/lib/config";

export const metadata = {
  title: "Điều khoản sử dụng",
  description: `Điều khoản sử dụng dịch vụ gieo quẻ và luận sâu tại ${SITE_NAME}.`,
};

export default function DieuKhoanPage() {
  return (
    <div>
      <section className="hero">
        <div className="han-bg">款</div>
        <h1>Điều khoản sử dụng</h1>
      </section>
      <div className="card">
        <h2>1. Bản chất dịch vụ</h2>
        <p>
          {SITE_NAME} cung cấp công cụ gieo quẻ Kinh Dịch (Lục Hào, Mai Hoa) và dịch vụ luận giải theo câu hỏi
          riêng. Toàn bộ nội dung — gồm quẻ, luận cơ bản và luận sâu — chỉ mang tính tham khảo, chiêm nghiệm và
          giải trí theo truyền thống văn hóa phương Đông. Đây không phải lời tiên tri, cam kết hay tư vấn chuyên
          môn dưới bất kỳ hình thức nào.
        </p>
        <h2>2. Trách nhiệm của người dùng</h2>
        <p>
          Mọi quyết định trong đời sống — sức khỏe, tài chính, pháp lý, hôn nhân, công việc — là của chính bạn.
          Đừng dùng kết quả gieo quẻ thay cho bác sĩ, luật sư, cố vấn tài chính hay người có chuyên môn. Khi gặp
          vấn đề nghiêm trọng, hãy tìm đến chuyên gia phù hợp.
        </p>
        <h2>3. Dịch vụ luận sâu</h2>
        <p>
          Yêu cầu luận sâu được xử lý theo thứ tự hàng đợi; thời gian trả bài dự kiến hiển thị tại trang Luận
          sâu và thay đổi theo độ dài hàng đợi. Luận sâu không thu phí — khoản tùy hỷ (nếu có) hoàn toàn tự
          nguyện và chỉ diễn ra sau khi bạn đã nhận bài. Bạn có trách nhiệm điền đúng thông tin liên hệ; bài
          luận được tra cứu bằng mã yêu cầu kèm thông tin liên hệ đó. Chi tiết xem tại Chính sách tùy hỷ.
        </p>
        <h2>4. Nội dung và sở hữu trí tuệ</h2>
        <p>
          Cổ văn Kinh Dịch thuộc phạm vi công cộng. Phần tượng giải, văn bản luận và giao diện của trang là tài
          sản của {SITE_NAME}; bạn có thể chia sẻ bài luận của chính mình, nhưng không sao chép hàng loạt nội
          dung trang cho mục đích thương mại khi chưa được đồng ý.
        </p>
        <h2>5. Thay đổi điều khoản</h2>
        <p>
          Điều khoản có thể được cập nhật theo thời gian; bản mới nhất luôn đăng tại trang này và áp dụng cho
          các đơn đặt sau thời điểm cập nhật.
        </p>
      </div>
    </div>
  );
}
