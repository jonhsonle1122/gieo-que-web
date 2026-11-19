import HexFigure from "./HexFigure";
import { HEX_BY_NUMBER } from "@/lib/hexagrams";

// Bảng an quẻ đầy đủ của quẻ chủ: nạp giáp, hành, Trường Sinh ngày·tháng,
// Lục Thân, Lục Thú, Thế/Ứng, hào động, Tuần Không, phục thần (nếu có).
export function AnQueTable({ aq, dongList = [] }) {
  const rows = [...aq.lines].reverse();
  return (
    <div className="table-scroll">
      <table className="anque">
        <thead>
          <tr>
            <th>Hào</th>
            <th>Nạp giáp</th>
            <th>Hành</th>
            <th>Trường Sinh (ngày · tháng)</th>
            <th>Lục Thân</th>
            <th>Lục Thú</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.hao} className={dongList.includes(l.hao) ? "dong" : ""}>
              <td>
                Hào {l.hao} · {l.bit ? "Dương" : "Âm"}
                {l.the ? <span className="tag the">Thế</span> : null}
                {l.ung ? <span className="tag ung">Ứng</span> : null}
              </td>
              <td>
                {l.can} {l.chi}
              </td>
              <td>{l.element}</td>
              <td>
                {l.ts_ngay || l.ts_chi || ""}
                {l.ts_thang ? " · tháng " + l.ts_thang : ""}
              </td>
              <td>
                {l.luc_than}
                {l.phuc_than ? (
                  <div className="phuc-note">
                    Phục thần: {l.phuc_than.luc_than} {l.phuc_than.can} {l.phuc_than.chi} ({l.phuc_than.element})
                  </div>
                ) : null}
              </td>
              <td>{l.luc_thu || ""}</td>
              <td>
                {dongList.includes(l.hao) ? <span className="tag dong">Động</span> : null}
                {l.khong ? <span className="tag khong">Tuần Không</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HexMeaning({ number }) {
  const h = HEX_BY_NUMBER[number];
  if (!h || !h.info) return null;
  const inf = h.info;
  return (
    <div>
      <p>
        <b>Từ khóa tượng:</b> {inf.tu_khoa}
      </p>
      <p>
        <b>Thoán từ:</b> {inf.thoan_vi}
      </p>
      <p>
        <b>Ý chính:</b> {inf.y_chinh}
      </p>
      <p>
        <b>Ý nghĩa:</b> {inf.y_nghia}
      </p>
      <p>
        <b>Thời vận:</b> {inf.thoi_van}
      </p>
      <p>
        <b>Điểm cần lưu ý:</b> {inf.luu_y}
      </p>
    </div>
  );
}

export function MiniHexCard({ title, hex }) {
  return (
    <div className="card">
      <div className="mut small">{title}</div>
      <div className="big-title" style={{ fontSize: "1.1rem" }}>
        Quẻ {hex.number} · {hex.name}
      </div>
      <HexFigure bits={hex.bits} mini />
      <div className="mut small">
        Thượng {hex.upper} · Hạ {hex.lower}
      </div>
    </div>
  );
}

// Khối kết quả Lục Hào hoàn chỉnh (dùng ở trang chủ sau khi gieo).
export default function CastResult({ result, luan, luanErr, meta, onOrder }) {
  const r = result;
  const aq = r.que_chu.an_que;
  const dongTxt = r.hao_dong.length
    ? `Hào động: ${r.hao_dong.join(", ")} — điểm đang chuyển của sự việc; quẻ biến cho xu hướng đi tới.`
    : "Không có hào động — quẻ tĩnh, đọc thẳng quẻ chủ.";
  return (
    <div>
      <div className="card">
        <div className="mut small">
          {meta.topicLabel}
          {meta.question ? " · " + meta.question : ""} · Ngày {r.day_stem} {r.day_branch}
          {r.month_branch ? " · Tháng " + r.month_branch + " (theo tiết khí)" : ""}
          {r.tuan_khong ? " · Tuần Không: " + r.tuan_khong.join(", ") : ""}
        </div>
        <div className="big-title">
          Quẻ {r.que_chu.number} · {r.que_chu.name}
        </div>
        <HexFigure bits={r.que_chu.bits} dongList={r.hao_dong} />
        <div className="mut small center">
          Cung {aq.palace} ({aq.palace_element}) · {aq.loai} · Thế hào {aq.the} · Ứng hào {aq.ung}
        </div>
        <AnQueTable aq={aq} dongList={r.hao_dong} />
        <p>
          <b>Đọc quẻ cơ bản:</b> Hào Thế tại hào {aq.the} đại diện cho người hỏi, hào Ứng tại hào {aq.ung} đại
          diện cho việc/người được hỏi. {dongTxt}
        </p>
        <HexMeaning number={r.que_chu.number} />
        {luanErr ? (
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 12 }}>
            <div className="big-title" style={{ fontSize: "1.15rem" }}>
              Luận cơ bản
            </div>
            <p className="mut">Chưa luận được ở tầng cơ bản: {luanErr}</p>
          </div>
        ) : luan ? (
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 12 }}>
            <div className="big-title" style={{ fontSize: "1.15rem" }}>
              Luận cơ bản · {luan.nhan_linh_vuc}
            </div>
            <p className="mut">
              Kết luận tầng cơ bản: <b>{luan.ket_luan}</b> · Điểm tổng hợp: {luan.diem.tong}
            </p>
            {luan.van_ban.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {luan.ghi_chu && luan.ghi_chu.length ? (
              <p className="mut small">{luan.ghi_chu.join(" ")}</p>
            ) : null}
          </div>
        ) : null}
        <p className="center" style={{ marginTop: 18 }}>
          <button className="btn" onClick={onOrder}>
            Đặt luận sâu cho quẻ này — từ 79.000đ
          </button>
        </p>
      </div>
      <div className="mini-cards">
        <MiniHexCard title="Quẻ biến" hex={r.que_bien} />
        <MiniHexCard title="Quẻ hỗ" hex={r.que_ho} />
      </div>
    </div>
  );
}
