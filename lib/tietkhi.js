// Tiết khí -> chi tháng — port ESM nguyên văn từ gieo-que-engine/demo/tietkhi.js.
// Chi tháng theo TIẾT KHÍ cho engine Lục Hào (thay cách xấp xỉ theo tháng âm).
// Tháng Dần bắt đầu tại Lập Xuân, Mão tại Kinh Trập, Thìn tại Thanh Minh,
// Tị tại Lập Hạ, Ngọ tại Mang Chủng, Mùi tại Tiểu Thử, Thân tại Lập Thu,
// Dậu tại Bạch Lộ, Tuất tại Hàn Lộ, Hợi tại Lập Đông, Tý tại Đại Tuyết,
// Sửu tại Tiểu Hàn. Mốc ranh giới = thời điểm kinh độ biểu kiến của Mặt Trời
// đạt 315°, 345°, 15°, ..., 285° (tính theo giờ Việt Nam UTC+7).
//
// Thuật toán: kinh độ biểu kiến của Mặt Trời theo Jean Meeus,
// "Astronomical Algorithms", thuật toán độ chính xác thấp (Appendix III /
// chương 25): kinh độ trung bình + phương trình tâm (3 số hạng) + hiệu chỉnh
// chương động & quang sai. Công thức gốc có sai số kinh độ hệ thống tới
// ~0.009 độ (~14 phút, lớn nhất vào mùa xuân — do cắt ngắn các số hạng nhiễu
// loạn), nên module cộng thêm một hiệu chỉnh hài hòa theo kinh độ trung bình
// dị thường M của Mặt Trời, khớp bình phương tối thiểu trên 28 mốc tiết khí
// đã công bố 2025-2026 (tinhmenhdo.netlify.app giờ Việt Nam; Đài Thiên văn
// Hồng Kông giờ Bắc Kinh quy đổi). Sau hiệu chỉnh, độ lệch thời điểm tiết
// trên các mốc kiểm chứng còn <= ~3.5 phút (xem test_tietkhi.js).
// Thời điểm tiết được tìm bằng chia đôi trên hàm kinh độ theo JD (giờ TT),
// sau đó trừ Delta T để về UTC và đổi sang giờ Việt Nam.
//
// GIỚI HẠN: nếu thời điểm gieo nằm trong ±30 phút quanh ranh giới một tiết,
// chi tháng có thể nhạy với sai số thuật toán (độ lệch còn lại trên các mốc
// kiểm chứng 2025-2026 là <= ~3.5 phút, nhưng ranh giới tiết là một thời
// điểm duy nhất nên vùng ±30 phút quanh nó vẫn là vùng cần thận trọng);
// ngoài vùng đó kết quả ổn định.
const TK_TZ = 7; // giờ Việt Nam
const TK_RAD = Math.PI / 180;

// 12 "tiết" mở đầu tháng theo thứ tự trong năm dương lịch.
// roughM/roughD: ngày xấp xỉ trong năm (điểm neo để giải nghiệm ±2 ngày).
const SOLAR_TERMS = [
  { name: "Tiểu Hàn",  longitude: 285, branch: "Sửu",  roughM: 1,  roughD: 6 },
  { name: "Lập Xuân",  longitude: 315, branch: "Dần",  roughM: 2,  roughD: 4 },
  { name: "Kinh Trập", longitude: 345, branch: "Mão",  roughM: 3,  roughD: 6 },
  { name: "Thanh Minh", longitude: 15, branch: "Thìn", roughM: 4,  roughD: 5 },
  { name: "Lập Hạ",    longitude: 45,  branch: "Tị",   roughM: 5,  roughD: 6 },
  { name: "Mang Chủng", longitude: 75, branch: "Ngọ",  roughM: 6,  roughD: 6 },
  { name: "Tiểu Thử",  longitude: 105, branch: "Mùi",  roughM: 7,  roughD: 7 },
  { name: "Lập Thu",   longitude: 135, branch: "Thân", roughM: 8,  roughD: 8 },
  { name: "Bạch Lộ",   longitude: 165, branch: "Dậu",  roughM: 9,  roughD: 8 },
  { name: "Hàn Lộ",    longitude: 195, branch: "Tuất", roughM: 10, roughD: 8 },
  { name: "Lập Đông",  longitude: 225, branch: "Hợi",  roughM: 11, roughD: 7 },
  { name: "Đại Tuyết", longitude: 255, branch: "Tý",   roughM: 12, roughD: 7 },
];

function tkNorm360(x){ x = x % 360; return x < 0 ? x + 360 : x; }
function tkWrap180(x){ x = tkNorm360(x); return x >= 180 ? x - 360 : x; }

// Julian Day (giờ TT) từ ngày giờ UTC — dùng công thức lịch giống amlich.js.
function tkJdFromDate(dd, mm, yy) {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a, m = mm + 12 * a - 3;
  return dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
       - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// Delta T (TT - UT) xấp xỉ cho 2000-2050, đa thức Espenak, đơn vị giây.
function tkDeltaTSeconds(year) {
  const t = year - 2000;
  return 62.92 + 0.32217 * t + 0.005589 * t * t;
}

// Kinh độ biểu kiến của Mặt Trời (độ, 0..360) tại Julian Day giờ TT.
function sunApparentLongitude(jdTT) {
  const T = (jdTT - 2451545.0) / 36525;
  const L0 = 280.46646 + T * (36000.76983 + 0.0003032 * T);
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const Mr = tkNorm360(M) * TK_RAD;
  const C = (1.914602 - T * (0.004817 + 0.000014 * T)) * Math.sin(Mr)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
          + 0.000289 * Math.sin(3 * Mr);
  const trueLong = L0 + C;
  const omega = (125.04 - 1934.136 * T) * TK_RAD;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega);
  // Hiệu chỉnh hài hòa thực nghiệm theo M (hệ số khớp từ lịch công bố
  // 2025-2026, xem đầu file): trừ phần sai số hệ thống của công thức gốc.
  const corr = 0.003200 + 0.003811 * Math.sin(Mr) - 0.000353 * Math.cos(Mr)
             - 0.001083 * Math.sin(2 * Mr) - 0.000126 * Math.cos(2 * Mr);
  return tkNorm360(lambda - corr);
}

// Thời điểm (epoch ms, UTC) kinh độ biểu kiến đạt targetDeg, neo quanh
// ngày roughD/roughM/year theo giờ Việt Nam.
function solarTermTimeMs(year, term) {
  // Neo: 12:00 giờ Việt Nam của ngày xấp xỉ -> JD giờ TT gần đúng.
  const jdNoonUTC = tkJdFromDate(term.roughD, term.roughM, year) - 0.5 + (12 - TK_TZ) / 24;
  let lo = jdNoonUTC - 2, hi = jdNoonUTC + 2; // cửa sổ ±2 ngày (JD, TT xấp xỉ)
  const f = jd => tkWrap180(sunApparentLongitude(jd) - term.longitude);
  let flo = f(lo);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2, fm = f(mid);
    if ((flo < 0 && fm < 0) || (flo >= 0 && fm >= 0)) { lo = mid; flo = fm; }
    else { hi = mid; }
  }
  const jdTT = (lo + hi) / 2;
  const jdUTC = jdTT - tkDeltaTSeconds(year) / 86400;
  return Math.round((jdUTC - 2440587.5) * 86400000);
}

const tkCache = {};
// Danh sách 12 tiết của một năm dương lịch (theo giờ Việt Nam):
// [{name, branch, longitude, time(Date)}] đã sắp theo thời gian.
function solarTermsOfYear(year) {
  if (tkCache[year]) return tkCache[year];
  const list = SOLAR_TERMS.map(t => ({
    name: t.name, branch: t.branch, longitude: t.longitude,
    time: new Date(solarTermTimeMs(year, t)),
  }));
  list.sort((a, b) => a.time - b.time);
  tkCache[year] = list;
  return list;
}

// Chi tháng theo tiết khí cho một thời điểm (Date). Thời điểm được hiểu
// theo đồng hồ tuyệt đối; ranh giới tính theo giờ Việt Nam (+7) nên kết quả
// không phụ thuộc múi giờ máy. Xử lý đúng: đầu tháng 1 (trước Tiểu Hàn ->
// tháng Tý của Đại Tuyết năm trước; giữa Tiểu Hàn và Lập Xuân -> tháng Sửu)
// và cuối tháng 12 (sau Đại Tuyết -> tháng Tý).
function monthBranchFromDate(date) {
  const t = date.getTime();
  const ictYear = new Date(t + TK_TZ * 3600000).getUTCFullYear();
  let best = null;
  for (const y of [ictYear - 1, ictYear, ictYear + 1]) {
    for (const term of solarTermsOfYear(y)) {
      const tt = term.time.getTime();
      if (tt <= t && (!best || tt > best.time.getTime())) best = term;
    }
  }
  return best ? best.branch : null;
}

export { SOLAR_TERMS, sunApparentLongitude, solarTermsOfYear, monthBranchFromDate };
