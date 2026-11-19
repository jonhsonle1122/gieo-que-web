import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

export const metadata = {
  title: "Liên hệ",
  description: `Các kênh liên hệ và hỗ trợ đơn luận sâu của ${SITE_NAME}.`,
};

export default function LienHePage() {
  return (
    <div>
      <section className="hero">
        <div className="han-bg">聯</div>
        <h1>Liên hệ</h1>
        <p className="lead">Cần hỗ trợ về đơn luận sâu, thanh toán hoặc góp ý cho trang — hãy nhắn cho chúng tôi.</p>
      </section>
      <div className="card">
        <h2>Kênh liên hệ</h2>
        <p>
          Zalo / Email hỗ trợ sẽ được cập nhật tại đây. Trong lúc chờ kênh chính thức, cách nhanh nhất để xử lý
          việc liên quan đến một đơn cụ thể là chuẩn bị sẵn <b>mã đơn</b> (dạng GQ-XXXXXX) và thông tin liên hệ
          đã dùng khi đặt.
        </p>
        <h2>Các việc thường gặp</h2>
        <ul>
          <li>
            <b>Chưa thấy bài luận:</b> kiểm tra trạng thái tại <Link href="/tra-cuu">trang Tra cứu đơn</Link> —
            thời hạn trả bài tính từ lúc xác nhận thanh toán (24 giờ gói tiêu chuẩn, 6 giờ gói ưu tiên).
          </li>
          <li>
            <b>Đã chuyển khoản nhưng đơn vẫn “Chờ thanh toán”:</b> đối soát có thể cần thêm thời gian; nếu quá
            12 giờ, liên hệ kèm mã đơn và biên lai chuyển khoản.
          </li>
          <li>
            <b>Điền sai thông tin liên hệ:</b> liên hệ kèm mã đơn để được sửa trước khi bài luận được gửi.
          </li>
          <li>
            <b>Góp ý về nội dung quẻ:</b> mỗi trang quẻ trong mục <Link href="/64-que">64 quẻ</Link> đều có đủ cổ
            văn và tượng giải để bạn đối chiếu.
          </li>
        </ul>
        <p className="mut">
          Lưu ý: chúng tôi không nhận luận các câu hỏi thay cho quyết định y tế khẩn cấp, pháp lý đang tranh
          chấp hay đầu tư tài chính — những việc đó cần chuyên gia trực tiếp.
        </p>
      </div>
    </div>
  );
}
