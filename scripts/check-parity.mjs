// Kiểm tra parity: bản port ESM trong lib/ phải cho kết quả Y HỆT engine gốc
// của demo (demo/engine.js) trên cùng ca test của test_engine_js.js + ca luận.
// Chạy: node scripts/check-parity.mjs
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const ORIG = require(join(ROOT, "..", "gieo-que-engine", "demo", "engine.js"));
const PORT = await import(join(ROOT, "lib", "engine.js"));
const LUAN = await import(join(ROOT, "lib", "luan.js"));
const AMLICH = await import(join(ROOT, "lib", "amlich.js"));
const TIETKHI = await import(join(ROOT, "lib", "tietkhi.js"));

let fails = 0;
function eq(a, e, label) {
  const x = JSON.stringify(a), y = JSON.stringify(e);
  if (x !== y) { console.log("FAIL", label, "\n  port:", x, "\n  gốc :", y); fails++; }
}

// Ca cố định từ test_engine_js.js (ca gieo trong chat: quẻ Phong)
const sums = [7, 8, 9, 7, 8, 6];
eq(PORT.lapQueLucHao(sums, "Giáp", "Tý"), ORIG.lapQueLucHao(sums, "Giáp", "Tý"), "luc-hao-phong-full");
eq(PORT.lapQueLucHao(sums, "Giáp", "Tý", "Dần"), ORIG.lapQueLucHao(sums, "Giáp", "Tý", "Dần"), "luc-hao-co-thang");
// Ca Q02 Trường Sinh (sách Sơ cấp tr.64)
eq(
  PORT.lapQueLucHao([7, 7, 7, 7, 8, 7], "Quý", "Hợi", "Mão"),
  ORIG.lapQueLucHao([7, 7, 7, 7, 8, 7], "Quý", "Hợi", "Mão"),
  "q02-truong-sinh"
);
// Vài ca biên: thuần Càn toàn động / toàn tĩnh, có phục thần
for (const s of [[9, 9, 9, 9, 9, 9], [6, 6, 6, 6, 6, 6], [7, 7, 7, 7, 7, 7], [6, 8, 7, 9, 6, 8]]) {
  eq(PORT.lapQueLucHao(s, "Bính", "Ngọ", "Tỵ"), ORIG.lapQueLucHao(s, "Bính", "Ngọ", "Tỵ"), "luc-hao-" + s.join(""));
}
// Mai Hoa: 10 ca của test gốc
const MH = [[1, 1, 1, 1], [7, 6, 15, 4], [3, 3, 9, 9], [6, 12, 30, 12], [9, 5, 5, 7],
            [2, 2, 2, 2], [4, 8, 16, 10], [5, 7, 21, 3], [12, 11, 29, 6], [10, 4, 12, 8]];
for (const [y, mo, d, h] of MH) eq(PORT.lapQueMaiHoa(y, mo, d, h), ORIG.lapQueMaiHoa(y, mo, d, h), "maihoa-" + [y, mo, d, h]);
// Luận cơ bản: so toàn bộ object kết quả trên vài lĩnh vực
const r = PORT.lapQueLucHao([7, 8, 9, 8, 9, 7], "Đinh", "Dậu", "Hợi");
for (const lv of ["cau_tai", "cong_danh", "gia_trach", "con_cai"]) {
  eq(LUAN.luanCoBan(r, lv), ORIG.luanCoBan(r, lv), "luan-" + lv);
}
eq(
  LUAN.luanCoBan(r, "hon_nhan", { gioiTinh: "nam" }),
  ORIG.luanCoBan(r, "hon_nhan", { gioiTinh: "nam" }),
  "luan-hon-nhan"
);
eq(
  LUAN.luanCoBan(r, "suc_khoe", { quanHe: "minh", benhMoi: true }),
  ORIG.luanCoBan(r, "suc_khoe", { quanHe: "minh", benhMoi: true }),
  "luan-suc-khoe"
);
// Âm lịch / tiết khí: kiểm tra độc lập vài mốc đã biết
eq(AMLICH.dayCanChi(19, 11, 2026), { stem: "Đinh", branch: "Dậu" }, "canchi-19-11-2026");
eq(AMLICH.solar2lunar(19, 11, 2026).day, 11, "amlich-19-11-2026"); // 11/10 âm? kiểm tra chéo bên dưới
console.log("âm lịch 19/11/2026:", JSON.stringify(AMLICH.solar2lunar(19, 11, 2026)));
console.log("chi tháng 19/11/2026:", TIETKHI.monthBranchFromDate(new Date(2026, 10, 19)));

console.log(fails === 0 ? "PARITY OK — bản port khớp engine gốc" : fails + " LỆCH");
process.exit(fails ? 1 : 0);
