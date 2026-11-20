// Điểm, nhãn, xếp hạng và pipeline chấm ngày dùng chung — tính năng chọn
// ngày (spec mục 3, 6). Cùng một pipeline cho bảng tháng phía server và
// công cụ tùy chọn phía client: cùng đầu vào → cùng kết quả tuyệt đối.

import { lapQueNgay } from "./daycast.js";
import { danhGiaNgay } from "./daychecklists.js";
import { DATA } from "./engine.js";

// 12 khung giờ địa chi: số chi (Tý = 1 … Hợi = 12) + nhãn giờ đồng hồ.
export const KHUNG_GIO = DATA.branches.map((chi, i) => {
  const start = (23 + i * 2) % 24;
  const end = (start + 2) % 24;
  const fmt = (h) => String(h).padStart(2, "0") + ":00";
  return { num: i + 1, chi, khung: `${fmt(start)}–${fmt(end)}` };
});
export const GIO_MAC_DINH = 5; // giờ Thìn 07:00–09:00
export const gioByNum = (num) => KHUNG_GIO.find((g) => g.num === num) || KHUNG_GIO[GIO_MAC_DINH - 1];

export const CAC_CHI = DATA.branches;

// Nhãn định tính (spec mục 6 — ngưỡng hiển thị của sản phẩm, không phải
// luật sách). Ghi đè cứng: phạm quẻ cấm cưới (KH-H1) → "Nên tránh".
export function nhanNgay(diem, camCung) {
  if (camCung) return "Nên tránh";
  if (diem >= 4) return "Được chấm cao";
  if (diem >= 2) return "Khá tốt";
  if (diem >= -1) return "Trung bình";
  return "Nên tránh";
}

export function diemText(diem) {
  return (diem > 0 ? "+" : diem < 0 ? "−" : "") + Math.abs(diem);
}

// Chấm một ngày dương lịch cho một việc.
// date: Date (giờ địa phương, chỉ phần ngày được dùng); gioNum: số chi giờ;
// toaSon: một địa chi hoặc null.
export function chamNgay(date, viec, gioNum = GIO_MAC_DINH, toaSon = null) {
  const result = lapQueNgay(date, gioNum);
  const ctx = {
    dayStem: result.day_stem,
    dayBranch: result.day_branch,
    monthBranch: result.month_branch,
    toaSon: toaSon || null,
  };
  const gia = danhGiaNgay(result, viec, ctx);
  return {
    date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    solar: result.solar,
    lunar: result.lunar,
    day_stem: result.day_stem,
    day_branch: result.day_branch,
    month_branch: result.month_branch,
    gio_num: gioNum,
    toa_son: toaSon || null,
    result,
    gia,
    nhan: nhanNgay(gia.diem, gia.cam_cung),
  };
}

// Chấm một khoảng ngày liên tiếp (tối đa 60 ngày theo spec).
export function chamKhoang(fromDate, soNgay, viec, gioNum = GIO_MAC_DINH, toaSon = null) {
  const out = [];
  const n = Math.max(1, Math.min(60, soNgay | 0));
  for (let i = 0; i < n; i++) {
    const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + i);
    out.push(chamNgay(d, viec, gioNum, toaSon));
  }
  return out;
}

// Thứ tự xếp hạng (spec mục 6): điểm giảm dần → ít mục xấu phạm hơn trước
// → ngày sớm hơn trước.
export function xepHang(entries) {
  return [...entries].sort(
    (a, b) => b.gia.diem - a.gia.diem || a.gia.xau_pham - b.gia.xau_pham || a.date - b.date
  );
}

const THU = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
export const thuCua = (date) => THU[date.getDay()];
export const ngayText = (date) =>
  `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
export const ngaySlug = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Lý do ngắn cho bảng xếp hạng (spec mục 8.1): tối đa 3; nếu có mục xấu
// phạm, lý do xấu đầu tiên đứng trước các lý do tốt.
export function lyDoNgan(gia) {
  const out = [];
  const pham = gia.items.find((i) => i.trang_thai === "pham");
  if (pham && pham.ly_do) out.push({ loai: "pham", text: pham.ly_do });
  for (const i of gia.items) {
    if (out.length >= 3) break;
    if (i.trang_thai === "dat" && i.ly_do) out.push({ loai: "dat", text: i.ly_do });
  }
  return out.slice(0, 3);
}

// Dòng công khai giờ đang dùng để chấm (spec mục 8.2 — nguyên văn khi giờ
// mặc định; đổi tên giờ khi khách đã chọn giờ khác).
export function dongGio(gioNum) {
  const g = gioByNum(gioNum);
  if (gioNum === GIO_MAC_DINH)
    return "Điểm các ngày được tính theo giờ Thìn (07:00–09:00). Nếu bạn dự định làm việc vào giờ khác, hãy chọn lại giờ — đổi giờ là quẻ ngày thay đổi, điểm có thể khác hẳn.";
  return `Điểm các ngày đang tính theo giờ ${g.chi} (${g.khung}) do bạn chọn.`;
}

// Disclaimer bắt buộc (spec mục 8.3 — nguyên văn).
export const DISCLAIMER =
  "Kết quả chỉ mang tính tham khảo theo phương pháp chọn ngày bằng quẻ Lục Hào (trường phái Thực Chiến Điểm Khiếu): chấm theo quẻ của từng ngày, không dùng thần sát theo lịch, không xét tuổi hay ngày sinh của bạn, và không phải lời bảo đảm cho kết quả của công việc.";
