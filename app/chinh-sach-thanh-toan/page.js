import Link from "next/link";
import { SITE_NAME, PACKAGES, formatVND } from "@/lib/config";

export const metadata = {
  title: "Chính sách thanh toán",
  description: `Cách thanh toán VietQR, thời hạn trả bài và chính sách hoàn tiền của dịch vụ luận sâu tại ${SITE_NAME}.`,
};

export default function ThanhToanPage() {
  return (
    <div>
      <section className="hero">
        <div className="han-bg">付</div>
        <h1>Chính sách thanh toán</h1>
      </section>
      <div className="card">
        <h2>1. Hình thức thanh toán</h2>
        <p>
          Dịch vụ luận sâu thanh toán bằng chuyển khoản ngân hàng qua mã VietQR hiển thị sau khi tạo đơn. Bạn
          cần chuyển đúng số tiền của gói đã chọn và giữ nguyên <b>nội dung chuyển khoản là mã đơn</b> (ví dụ
          GQ-AB3K9Q) để đơn được đối soát.
        </p>
        <h2>2. Giá gói hiện tại</h2>
        <ul>
          {PACKAGES.map((p) => (
            <li key={p.id}>
              {p.name}: <b>{formatVND(p.price)}</b> — {p.eta.toLowerCase()}.
            </li>
          ))}
        </ul>
        <p className="mut">Giá có thể thay đổi theo thời gian; giá áp dụng là giá hiển thị trên đơn tại thời điểm bạn tạo đơn.</p>
        <h2>3. Xác nhận và thời hạn trả bài</h2>
        <p>
          Sau khi nhận được chuyển khoản khớp mã đơn, trạng thái đơn chuyển sang “Đã thanh toán” rồi “Đang
          luận”. Thời hạn trả bài tính từ lúc xác nhận thanh toán: gói tiêu chuẩn trong 24 giờ, gói ưu tiên
          trong 6 giờ. Bài luận đọc tại <Link href="/tra-cuu">trang Tra cứu đơn</Link> khi trạng thái là “Đã gửi
          bài luận”.
        </p>
        <h2>4. Hoàn tiền</h2>
        <p>
          Hoàn 100% nếu đơn đã thanh toán nhưng không được trả bài quá thời hạn của gói mà không có thỏa thuận
          khác. Hoàn 100% nếu bạn hủy đơn trước khi đơn chuyển sang trạng thái “Đang luận”. Đơn đã trả bài thì
          không hoàn tiền, trừ trường hợp bài luận bị lỗi kỹ thuật không đọc được — khi đó bạn được luận lại
          miễn phí hoặc hoàn tiền theo lựa chọn của bạn.
        </p>
        <h2>5. Sai sót khi chuyển khoản</h2>
        <p>
          Nếu chuyển nhầm số tiền hoặc sai nội dung, hãy liên hệ qua trang <Link href="/lien-he">Liên hệ</Link>{" "}
          kèm mã đơn, số tiền và thời gian chuyển khoản để được hỗ trợ đối soát thủ công.
        </p>
      </div>
    </div>
  );
}
