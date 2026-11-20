import Link from "next/link";
import CastTool from "@/components/CastTool";
import HexFigure from "@/components/HexFigure";
import { HEXAGRAMS } from "@/lib/hexagrams";
import { PACKAGES, formatVND, SITE_NAME } from "@/lib/config";

const FAQS = [
  {
    q: "Gieo quẻ ở đây khác gì các trang gieo quẻ tự động?",
    a: "Trang này an quẻ theo đúng phép Lục Hào cổ điển: nạp giáp đủ 6 hào, Lục Thân, Lục Thú theo Can ngày, Thế/Ứng, hào động, Tuần Không, vòng Trường Sinh và phục thần — thay vì chỉ rút ngẫu nhiên một quẻ rồi hiện lời giải sẵn. Phần luận cơ bản miễn phí cũng chấm theo khung tín hiệu của sách Lục Hào, không phải văn mẫu chung chung.",
  },
  {
    q: "Nên đặt câu hỏi thế nào để quẻ rõ?",
    a: "Một quẻ chỉ hỏi một việc, trong một khoảng thời gian gần (thường trong 3 tháng), và hỏi về điều bạn thật sự đang phân vân — ví dụ “Công việc sắp tới của tôi thế nào?” thay vì hỏi chung chung về cả đời. Tránh hỏi lại đúng một câu trong thời gian ngắn.",
  },
  {
    q: "Luận sâu khác luận cơ bản miễn phí ở điểm nào?",
    a: "Luận cơ bản là tầng máy chấm tín hiệu theo khung cố định. Luận sâu là bài luận riêng cho đúng câu hỏi của bạn: xét Dụng thần theo lĩnh vực, vượng suy theo Nhật Nguyệt, quan hệ giữa các hào động, phục thần và quẻ biến, rồi chốt kết luận cùng việc nên làm/nên tránh (gói ưu tiên có thêm ứng kỳ chi tiết). Bài luận được soạn và duyệt bởi người luận trước khi gửi.",
  },
  {
    q: "Thanh toán và nhận bài luận sâu thế nào?",
    a: "Đặt đơn tại trang Luận sâu, bạn nhận mã đơn và mã VietQR để chuyển khoản đúng số tiền với nội dung là mã đơn. Sau khi xác nhận thanh toán, bài luận được gửi qua trang Tra cứu đơn (nhập mã đơn + thông tin liên hệ) trong thời hạn của gói đã chọn.",
  },
  {
    q: "Kết quả gieo quẻ có chắc chắn đúng không?",
    a: "Không. Kinh Dịch là công cụ chiêm nghiệm để nhìn sự việc từ một góc khác và tự cân nhắc quyết định. Mọi nội dung trên trang chỉ mang tính tham khảo, giải trí — không thay thế tư vấn y tế, pháp lý, tài chính hay bất kỳ quyết định quan trọng nào trong đời sống.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="hero">
        <div className="han-bg">易</div>
        <h1>Gieo Quẻ Kinh Dịch Online</h1>
        <p className="lead">
          Lục Hào gieo 3 xu và Mai Hoa theo giờ — an quẻ đầy đủ như sách cổ, luận cơ bản miễn phí ngay tại chỗ,
          luận sâu riêng theo câu hỏi của bạn.
        </p>
      </section>

      <CastTool />

      <section className="section">
        <div className="notice">
          <b>Chọn ngày tốt bằng quẻ Lục Hào:</b> khai trương, xây nhà hay cưới hỏi — mỗi ngày ứng viên
          được khởi một quẻ riêng và chấm bằng checklist của từng việc, không dùng thần sát theo lịch,
          không cần tuổi hay ngày sinh. <Link href="/chon-ngay">Xem bảng chấm ngày →</Link>
        </div>
      </section>

      <section className="section">
        <h2 className="serif">Vì sao gieo quẻ tại {SITE_NAME}?</h2>
        <div className="note-grid">
          <div className="note-block">
            <h3>An quẻ đúng phép Lục Hào</h3>
            <p>
              Nạp giáp, Lục Thân, Lục Thú, Thế–Ứng, Tuần Không, vòng Trường Sinh theo Nhật thần/Nguyệt kiến và
              phục thần — đủ các lớp mà một quẻ Lục Hào chuẩn cần có, hiển thị minh bạch để bạn tự đối chiếu.
            </p>
          </div>
          <div className="note-block">
            <h3>Hai cách gieo cổ truyền</h3>
            <p>
              Gieo 3 xu đủ 6 hào cho câu hỏi quan trọng, hoặc Mai Hoa theo giờ động tâm khi cần một quẻ nhanh.
              Can Chi ngày và chi tháng theo tiết khí được tự động tính theo thời điểm bạn gieo.
            </p>
          </div>
          <div className="note-block">
            <h3>Luận cơ bản miễn phí, luận sâu có người duyệt</h3>
            <p>
              Mọi quẻ đều có luận cơ bản tức thì. Khi cần đi sâu vào đúng hoàn cảnh của mình, bài luận sâu được
              soạn theo khung hai phái Lục Hào và duyệt lại trước khi gửi — không phải văn mẫu tự động.
            </p>
          </div>
          <div className="note-block">
            <h3>Thư viện 64 quẻ đầy đủ</h3>
            <p>
              Cổ văn Thoán từ, Hào từ, Đại tượng cùng phần tượng giải viết riêng cho đủ 64 quẻ — tra cứu có tìm
              kiếm, đọc trước để hiểu quẻ của mình sâu hơn.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="serif">64 quẻ Kinh Dịch</h2>
        <p className="mut">Chạm vào một quẻ để xem cổ văn và tượng giải đầy đủ — hoặc xem <Link href="/64-que">toàn bộ 64 quẻ có tìm kiếm</Link>.</p>
        <div className="grid64">
          {HEXAGRAMS.map((h) => (
            <Link key={h.number} href={`/que/${h.slug}`}>
              <div className="gnum">Quẻ {h.number}</div>
              <div className="gname">{h.name}</div>
              <HexFigure bits={h.bits} mini />
              <div className="gy">{h.info.y_chinh}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" id="bang-gia">
        <h2 className="serif">Luận sâu theo câu hỏi của bạn</h2>
        <p className="mut">
          Gieo quẻ và luận cơ bản luôn miễn phí. Luận sâu là dịch vụ trả phí cho một câu hỏi cụ thể —
          đặt đơn, chuyển khoản VietQR, nhận bài tại trang tra cứu.
        </p>
        <div className="price-grid">
          {PACKAGES.map((p) => (
            <div className="card price-card" key={p.id} style={{ margin: 0 }}>
              <h3>{p.name}</h3>
              <div className="price">{formatVND(p.price)}</div>
              <div className="mut small">{p.eta}</div>
              <ul>
                {p.points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
              <Link className="btn block" href="/luan-sau">Đặt luận sâu</Link>
            </div>
          ))}
        </div>
        <p className="mut small">
          Quy trình: gieo quẻ (hoặc mô tả câu hỏi) → điền đơn → chuyển khoản đúng mã đơn → tra cứu bài luận tại{" "}
          <Link href="/tra-cuu">/tra-cuu</Link> khi trạng thái chuyển thành “Đã gửi bài luận”.
        </p>
      </section>

      <section className="section">
        <h2 className="serif">Câu hỏi thường gặp</h2>
        {FAQS.map((f, i) => (
          <details className="faq" key={i}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
        <div className="notice">
          <b>Lưu ý trung thực:</b> gieo quẻ Kinh Dịch tại đây là để tham khảo và chiêm nghiệm. Kết quả không
          phải lời tiên tri chắc chắn và không thay thế tư vấn y tế, pháp lý, tài chính hay quyết định quan
          trọng của chính bạn.
        </div>
      </section>
    </div>
  );
}
