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
        <p className="lead">Cần hỗ trợ về yêu cầu luận sâu, tùy hỷ hoặc góp ý cho trang — hãy nhắn cho chúng tôi.</p>
      </section>
      <div className="card">
        <h2>Kênh liên hệ</h2>
        <ul>
          <li>
            <b>Zalo:</b>{" "}
            <a href="https://zalo.me/0918498439" target="_blank" rel="noreferrer">
              0918 498 439
            </a>{" "}
            — kênh phản hồi nhanh nhất.
          </li>
          <li>
            <b>Email:</b>{" "}
            <a href="mailto:nguyencongthanh0397@gmail.com">nguyencongthanh0397@gmail.com</a>
          </li>
          <li>
            <b>Facebook:</b>{" "}
            <a href="https://www.facebook.com/profile.php?id=61596798305942" target="_blank" rel="noreferrer">
              Page Gieo Quẻ - Luận Quẻ Kinh Dịch
            </a>{" "}
            — nhắn tin qua Page hoặc theo dõi bài đăng mỗi ngày.
          </li>
        </ul>
        <p>
          Khi liên hệ về một đơn cụ thể, hãy chuẩn bị sẵn <b>mã đơn</b> (dạng GQ-XXXXXX) và thông tin liên hệ
          đã dùng khi đặt để được hỗ trợ nhanh hơn.
        </p>
        <h2>Các việc thường gặp</h2>
        <ul>
          <li>
            <b>Chưa thấy bài luận:</b> kiểm tra trạng thái tại <Link href="/tra-cuu">trang Tra cứu</Link> —
            bài luận được soạn theo thứ tự hàng đợi, thời gian dự kiến hiển thị ngay tại trang Luận sâu khi
            bạn gửi yêu cầu.
          </li>
          <li>
            <b>Muốn gửi tùy hỷ mà không thấy mã QR:</b> mã QR tùy hỷ chỉ hiện ở cuối bài luận, sau khi bài
            đã được giao tại trang Tra cứu. Nếu bài đã giao mà vẫn không thấy, liên hệ kèm mã yêu cầu.
          </li>
          <li>
            <b>Điền sai thông tin liên hệ:</b> liên hệ kèm mã yêu cầu để được sửa trước khi bài luận được gửi.
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
