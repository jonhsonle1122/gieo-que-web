import Link from "next/link";
import DayRankTool from "@/components/DayRankTool";
import { CAC_VIEC } from "@/lib/daychecklists";
import { SITE_NAME } from "@/lib/config";

export const metadata = {
  title: "Chọn ngày tốt bằng quẻ Lục Hào — khai trương, xây nhà, kết hôn",
  description:
    "Chọn ngày tốt theo phương pháp Nhật khóa trạch cát của Lục Hào Thực Chiến Điểm Khiếu: mỗi ngày ứng viên được khởi một quẻ Mai Hoa riêng và chấm bằng checklist Lục Hào — không dùng thần sát theo lịch, không cần tuổi hay ngày sinh.",
};

export default function ChonNgayPage() {
  return (
    <div>
      <section className="hero">
        <div className="han-bg">擇</div>
        <h1>Chọn Ngày Tốt Bằng Quẻ Lục Hào</h1>
        <p className="lead">
          Mỗi ngày ứng viên được khởi một quẻ riêng bằng số học thời gian của chính ngày đó, an quẻ Lục Hào
          đầy đủ rồi chấm bằng bộ tiêu chí riêng của từng việc — theo phương pháp Nhật khóa trạch cát
          (Lục Hào Thực Chiến Điểm Khiếu).
        </p>
      </section>

      <section className="section">
        <div className="note-grid">
          <div className="note-block">
            <h3>Chấm bằng quẻ của từng ngày</h3>
            <p>
              Không tra lịch thần sát, không Hoàng đạo/Hắc đạo, không sao tốt xấu: ngày nào quẻ của chính
              ngày đó cát thì ngày đó được chấm cao.
            </p>
          </div>
          <div className="note-block">
            <h3>Không cần tuổi hay ngày sinh</h3>
            <p>
              Phương pháp này không xét tuổi, Bát tự của chủ sự — hào Thế trong quẻ ngày đại diện cho chủ,
              hào Ứng đại diện cho việc và đối tác.
            </p>
          </div>
          <div className="note-block">
            <h3>Minh bạch từng điểm</h3>
            <p>
              Mỗi ngày đều mở xem được quẻ đầy đủ và từng mục tiêu chí đạt/phạm/bỏ qua — bạn tự đối chiếu
              được vì sao ngày được chấm như vậy.
            </p>
          </div>
          <div className="note-block">
            <h3>Giờ làm việc đổi thì quẻ đổi</h3>
            <p>
              Quẻ ngày khởi theo giờ dự định làm việc. Bảng sẵn tính theo giờ Thìn (07:00–09:00); nếu bạn
              định làm giờ khác, hãy dùng công cụ bên dưới và chọn lại giờ.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="serif">Chọn theo việc</h2>
        <div className="note-grid">
          {CAC_VIEC.map((v) => (
            <div className="note-block" key={v.slug}>
              <h3>{v.tenSEO}</h3>
              <p>{v.gioiThieu}</p>
              <p>
                <Link className="btn small" href={`/chon-ngay/${v.slug}`}>
                  Xem ngày tốt {v.ten.toLowerCase()}
                </Link>
              </p>
            </div>
          ))}
        </div>
        <p className="mut">
          Tạo táng — sắp có · Chuyển nhà — sắp có
        </p>
      </section>

      <section className="section">
        <DayRankTool />
      </section>

      <section className="section">
        <div className="notice">
          <b>Cách đọc kết quả:</b> điểm ngày = số mục tốt đạt trừ số mục xấu phạm theo checklist của việc.
          Ngày chỉ là quẻ của ngày — nếu muốn chọn theo đúng hoàn cảnh riêng của việc mình, hãy{" "}
          <Link href="/luan-sau">đặt luận sâu tại {SITE_NAME}</Link> để được luận riêng.
        </div>
      </section>
    </div>
  );
}
