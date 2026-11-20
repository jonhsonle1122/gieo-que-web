// Cầu nối an quẻ cho quẻ ngày — tính năng chọn ngày (chế độ Điểm Khiếu [TCK]).
//
// lapQueMaiHoa (lib/engine.js) chỉ trả quẻ thuần + hào động, chưa có an quẻ
// Lục Hào, trong khi checklist chọn ngày cần bảng an quẻ đầy đủ (nạp giáp,
// Thế–Ứng, Lục Thân, Lục Thú, phục/phi thần, Tuần Không, Trường Sinh tại
// Nhật/Nguyệt). Module này lắp an quẻ bằng ĐÚNG các hàm export sẵn của
// engine và ĐÚNG trình tự lapQueLucHao đang làm — không viết lại luật an quẻ,
// không sửa các file engine (bản port cơ học).
//
// Cổng parity bắt buộc: scripts/test-daycast.mjs — an quẻ của cầu nối phải
// khớp từng trường với lapQueLucHao trên xu tổng hợp tương đương.

import { lapQueMaiHoa, anQue, anPhucThan, tuanKhong, truongSinhStage } from "./engine.js";
import { solar2lunar, dayCanChi, yearCanChi } from "./amlich.js";
import { monthBranchFromDate } from "./tietkhi.js";

// Lắp an quẻ Lục Hào lên một kết quả Mai Hoa thô (mh) trong ngữ cảnh ngày
// cho trước. Trả object cùng khuôn lapQueLucHao (thay coin_sums bằng khối
// maihoa) để dùng lại được components/CastResult.js.
export function lapQueNgayTuMaiHoa(mh, dayStem, dayBranch, monthBranch) {
  const chuAn = anQue(mh.que_chu, dayStem);
  anPhucThan(chuAn); // phục/phi thần chỉ an cho quẻ chủ (như lapQueLucHao)
  // Lục Thân quẻ biến tính theo cung QUẺ CHỦ (như lapQueLucHao)
  const out = {
    hao_dong: [mh.hao_dong],
    day_stem: dayStem === undefined ? null : dayStem,
    day_branch: dayBranch === undefined ? null : dayBranch,
    month_branch: monthBranch === undefined ? null : monthBranch,
    que_chu: { ...mh.que_chu, an_que: chuAn },
    que_bien: { ...mh.que_bien, an_que: anQue(mh.que_bien, dayStem, chuAn.palace_element) },
    que_ho: mh.que_ho,
    maihoa: {
      the_quai: mh.the_quai,
      dung_quai: mh.dung_quai,
      the_dung_relation: mh.the_dung_relation,
    },
  };
  if (dayStem && dayBranch) {
    const khong = tuanKhong(dayStem, dayBranch);
    out.tuan_khong = khong;
    for (const sect of ["que_chu", "que_bien"])
      for (const ln of out[sect].an_que.lines) ln.khong = khong.includes(ln.chi);
  }
  // Vòng Trường Sinh tại Nhật thần / Nguyệt kiến (như lapQueLucHao)
  for (const sect of ["que_chu", "que_bien"])
    for (const ln of out[sect].an_que.lines) {
      ln.ts_ngay = dayBranch ? truongSinhStage(ln.element, dayBranch) : null;
      ln.ts_thang = monthBranch ? truongSinhStage(ln.element, monthBranch) : null;
    }
  return out;
}

// Lập quẻ ngày từ các số của phép Mai Hoa + can chi ngày và chi tháng kiến
// cho trước. Dùng cho bộ ca mẫu kiểm chứng (đầu vào đúng số sách in).
export function lapQueNgayTuSo(yearBranchNum, lunarMonth, lunarDay, hourBranchNum, dayStem, dayBranch, monthBranch) {
  const mh = lapQueMaiHoa(yearBranchNum, lunarMonth, lunarDay, hourBranchNum);
  return lapQueNgayTuMaiHoa(mh, dayStem, dayBranch, monthBranch);
}

// Lập quẻ ngày từ một ngày dương lịch + số chi giờ đã chọn:
// tự tính âm lịch, can chi ngày (Nhật thần) và Nguyệt kiến theo tiết khí
// (lấy tại 12:00 của ngày để tránh sát biên tiết khí trong ngày).
export function lapQueNgay(date, hourBranchNum) {
  const dd = date.getDate(), mm = date.getMonth() + 1, yyyy = date.getFullYear();
  const lu = solar2lunar(dd, mm, yyyy);
  const yc = yearCanChi(lu.year);
  const dc = dayCanChi(dd, mm, yyyy);
  const monthBranch = monthBranchFromDate(new Date(yyyy, mm - 1, dd, 12));
  const r = lapQueNgayTuSo(yc.branchNum, lu.month, lu.day, hourBranchNum, dc.stem, dc.branch, monthBranch);
  r.lunar = lu;
  r.solar = { day: dd, month: mm, year: yyyy };
  r.hour_branch_num = hourBranchNum;
  return r;
}
