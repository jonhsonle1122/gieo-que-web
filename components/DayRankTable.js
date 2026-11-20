import Link from "next/link";
import { diemText, lyDoNgan, ngaySlug, ngayText, thuCua } from "@/lib/dayrank";

// Chip nhãn theo mức (spec mục 6).
export function nhanClass(nhan) {
  if (nhan === "Được chấm cao") return "tag nhan-cao";
  if (nhan === "Khá tốt") return "tag nhan-kha";
  if (nhan === "Nên tránh") return "tag nhan-tranh";
  return "tag nhan-tb";
}

// Bảng xếp hạng ngày (spec mục 8.1) — dùng chung cho trang đích (server)
// và công cụ tùy chọn (client). entries: kết quả chamNgay đã xepHang.
export default function DayRankTable({ entries, viec }) {
  return (
    <div className="table-scroll">
      <table className="anque">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Âm lịch</th>
            <th>Can chi ngày</th>
            <th>Điểm</th>
            <th>Nhãn</th>
            <th>Lý do nổi bật</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const qs = `?gio=${e.gio_num}${e.toa_son ? `&son=${encodeURIComponent(e.toa_son)}` : ""}`;
            return (
              <tr key={e.date.toISOString()}>
                <td>
                  <b>{ngayText(e.date)}</b>
                  <div className="mut small">{thuCua(e.date)}</div>
                </td>
                <td>
                  {e.lunar.day}/{e.lunar.month}
                  {e.lunar.leap ? " (nhuận)" : ""}
                </td>
                <td>
                  {e.day_stem} {e.day_branch}
                </td>
                <td>
                  <b>{diemText(e.gia.diem)}</b>
                  <div className="mut small">
                    ({e.gia.tot_dat} tốt · {e.gia.xau_pham} xấu)
                  </div>
                </td>
                <td>
                  <span className={nhanClass(e.nhan)} style={{ marginLeft: 0 }}>
                    {e.nhan}
                  </span>
                </td>
                <td>
                  {lyDoNgan(e.gia).map((r, i) => (
                    <div key={i} className={r.loai === "pham" ? "lydo-pham" : undefined}>
                      {r.loai === "pham" ? "⚠ " : "✓ "}
                      {r.text}
                    </div>
                  ))}
                </td>
                <td>
                  <Link href={`/chon-ngay/${viec}/${ngaySlug(e.date)}${qs}`}>Xem quẻ ngày</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
