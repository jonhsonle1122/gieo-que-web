import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

export const metadata = {
  title: "Chính sách tùy hỷ",
  description: `Luận sâu tại ${SITE_NAME} không thu phí — chính sách tùy hỷ tự nguyện sau khi nhận bài và các khoản thanh toán (nếu có) trong tương lai.`,
};

export default function ThanhToanPage() {
  return (
    <div>
      <section className="hero">
        <div className="han-bg">付</div>
        <h1>Chính sách tùy hỷ</h1>
      </section>
      <div className="card">
        <h2>1. Luận sâu không thu phí</h2>
        <p>
          Dịch vụ luận sâu tại {SITE_NAME} <b>không có giá và không thu phí</b>. Bạn gieo quẻ, gửi yêu cầu,
          chúng tôi luận riêng theo quẻ và câu hỏi của bạn rồi gửi bài qua{" "}
          <Link href="/tra-cuu">trang Tra cứu</Link>. Không có bước thanh toán trước, không cần chuyển khoản
          để yêu cầu được xử lý — mọi yêu cầu đều vào cùng một hàng đợi theo thứ tự gửi.
        </p>
        <h2>2. Tùy hỷ là tự nguyện</h2>
        <p>
          Sau khi đã đọc bài luận, nếu thấy bài luận giúp ích cho mình, bạn có thể gửi một khoản{" "}
          <b>tùy hỷ</b> (tùy tâm, tùy khả năng) qua mã VietQR hiện ở cuối bài tại trang Tra cứu — mã QR
          không điền sẵn số tiền, bạn tự quyết định số tiền trong app ngân hàng. Không gửi cũng hoàn toàn
          được: bài luận của bạn vẫn đầy đủ như nhau và những lần gửi yêu cầu sau không bị ảnh hưởng gì.
        </p>
        <p>
          Khoản tùy hỷ là đóng góp ủng hộ việc duy trì trang web, <b>không phải thanh toán mua dịch vụ</b>:
          chúng tôi không ghi công nợ, không nhắc, không đối chiếu với bất kỳ quyền lợi nào của bạn.
        </p>
        <h2>3. Chuyển nhầm khoản tùy hỷ</h2>
        <p>
          Nếu bạn chuyển nhầm số tiền hoặc nhầm nội dung khi gửi tùy hỷ, hãy liên hệ qua trang{" "}
          <Link href="/lien-he">Liên hệ</Link> kèm mã yêu cầu, số tiền và thời gian chuyển khoản để được hỗ
          trợ xử lý.
        </p>
        <h2>4. Sản phẩm trả phí trong tương lai (nếu có)</h2>
        <p>
          Hiện tại trang không bán bất kỳ gói luận sâu nào. Về sau, nếu có sản phẩm trả phí (ví dụ công cụ
          phần mềm hoặc sách), giá sẽ được niêm yết công khai ngay tại trang của sản phẩm đó và chính sách
          này sẽ được cập nhật tương ứng. Phần luận quẻ cho từng cá nhân vẫn giữ nguyên tắc không bán như
          mục 1.
        </p>
      </div>
    </div>
  );
}
