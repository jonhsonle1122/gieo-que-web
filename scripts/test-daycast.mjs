// Kiểm chứng tính năng chọn ngày — chạy: node scripts/test-daycast.mjs
//   A. Parity cầu nối an quẻ (spec mục 9.1): an quẻ của lib/daycast.js phải
//      khớp TỪNG TRƯỜNG với lapQueLucHao trên xu tổng hợp tương đương.
//   B. Ca mẫu trong sách (spec mục 9.2): 7 ca cố định của Điểm Khiếu — quẻ
//      ra phải khớp sách trước, rồi nhãn phải đúng nhóm kỳ vọng. Đạt 7/7.
//   C. Test đơn vị từng mục xấu (spec mục 9.2): mỗi mục xấu của 3 việc có
//      ít nhất 1 quẻ nhân tạo cho "phạm" và 1 cho "không phạm".
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENGINE = await import(join(ROOT, "lib", "engine.js"));
const DAYCAST = await import(join(ROOT, "lib", "daycast.js"));
const CHK = await import(join(ROOT, "lib", "daychecklists.js"));
const RANK = await import(join(ROOT, "lib", "dayrank.js"));

let fails = 0, total = 0;
function ok(cond, label, extra) {
  total++;
  if (!cond) { fails++; console.log("FAIL", label, extra ? "\n  " + extra : ""); }
}
function eq(a, e, label) {
  const x = JSON.stringify(a), y = JSON.stringify(e);
  ok(x === y, label, `cầu nối: ${x}\n  chuẩn  : ${y}`);
}

// ============================================================ A. PARITY
// Xu tổng hợp tương đương một quẻ + hào động: dương tĩnh 7, âm tĩnh 8,
// dương động 9, âm động 6.
function coinsFrom(bits, dong) {
  return bits.map((b, i) => (i + 1 === dong ? (b ? 9 : 6) : b ? 7 : 8));
}
function mhFrom(bits, dong) {
  const chu = ENGINE.hexFromBits(bits);
  const bien = ENGINE.hexFromBits(bits.map((b, i) => (i + 1 === dong ? b ^ 1 : b)));
  const ho = ENGINE.hexFromBits([bits[1], bits[2], bits[3], bits[2], bits[3], bits[4]]);
  return { que_chu: chu, que_bien: bien, que_ho: ho, hao_dong: dong, the_quai: chu.upper, dung_quai: chu.lower, the_dung_relation: "Tỷ hòa" };
}

const CTXS = [
  ["Giáp", "Tý", "Dần"],
  ["Đinh", "Dậu", "Hợi"],
  ["Quý", "Hợi", "Mão"],
];
let parityCombos = 0;
for (const [stem, branch, month] of CTXS) {
  for (let n = 0; n < 64; n++) {
    const bits = [0, 1, 2, 3, 4, 5].map((i) => (n >> i) & 1);
    for (const dong of [1, 2, 3, 4, 5, 6]) {
      const chuan = ENGINE.lapQueLucHao(coinsFrom(bits, dong), stem, branch, month);
      const cau = DAYCAST.lapQueNgayTuMaiHoa(mhFrom(bits, dong), stem, branch, month);
      parityCombos++;
      eq(cau.que_chu.an_que, chuan.que_chu.an_que, `parity chủ ${bits.join("")}đ${dong} ${stem}${branch}/${month}`);
      eq(cau.que_bien.an_que, chuan.que_bien.an_que, `parity biến ${bits.join("")}đ${dong} ${stem}${branch}/${month}`);
      eq(cau.tuan_khong, chuan.tuan_khong, `parity tuần không ${bits.join("")}đ${dong}`);
      eq(cau.hao_dong, chuan.hao_dong, `parity hào động ${bits.join("")}đ${dong}`);
    }
  }
}
console.log(`A. Parity cầu nối: ${parityCombos} tổ hợp (64 quẻ × 6 hào động × ${CTXS.length} ngữ cảnh ngày)`);

// ============================================================ B. CA MẪU SÁCH
// Đầu vào đúng số sách in: (số chi năm, tháng âm, ngày âm, số chi giờ),
// can chi ngày + chi tháng kiến như sách ghi. Kỳ vọng: quẻ + nhóm nhãn.
const NHOM_CAO = ["Khá tốt", "Được chấm cao"];
// Định danh quẻ bằng SỐ (tên gọi có dị bản chính tả giữa sách và dữ liệu
// engine — vd quẻ 43 sách ghi "Quái", engine ghi "Quải" — cùng một quẻ).
const CA_SACH = [
  { ma: "KT-1", viec: "khai-truong", so: [7, 7, 19, 1], stem: "Đinh", branch: "Mão", month: "Thân", num: 10, que: "Thiên Trạch Lý", dong: 4, nhom: NHOM_CAO },
  { ma: "KT-2", viec: "khai-truong", so: [2, 4, 6, 4], stem: "Giáp", branch: "Dần", month: "Tỵ", num: 16, que: "Lôi Địa Dự", dong: 4, nhom: NHOM_CAO },
  { ma: "KT-3", viec: "khai-truong", so: [5, 4, 25, 2], stem: "Bính", branch: "Tuất", month: "Tỵ", num: 17, que: "Trạch Lôi Tùy", dong: 6, nhom: NHOM_CAO },
  { ma: "XN-1", viec: "xay-nha", so: [12, 11, 2, 9], stem: "Mậu", branch: "Tý", month: "Tý", num: 10, que: "Thiên Trạch Lý", dong: 4, son: "Thân", nhom: NHOM_CAO },
  { ma: "XN-2", viec: "xay-nha", so: [3, 7, 1, 7], stem: "Nhâm", branch: "Ngọ", month: "Mùi", num: 38, que: "Hỏa Trạch Khuê", dong: 6, nhom: ["Nên tránh"] },
  { ma: "KH-1", viec: "ket-hon", so: [3, 3, 6, 7], stem: "Kỷ", branch: "Mão", month: "Mão", num: 55, que: "Lôi Hỏa Phong", dong: 1, nhom: NHOM_CAO },
  { ma: "KH-2", viec: "ket-hon", so: [11, 3, 12, 7], stem: "Mậu", branch: "Ngọ", month: "Thìn", num: 43, que: "Trạch Thiên Quái", dong: 3, nhom: NHOM_CAO },
];
for (const ca of CA_SACH) {
  const r = DAYCAST.lapQueNgayTuSo(ca.so[0], ca.so[1], ca.so[2], ca.so[3], ca.stem, ca.branch, ca.month);
  ok(r.que_chu.number === ca.num, `${ca.ma} quẻ ra`, `ra số ${r.que_chu.number} "${r.que_chu.name}", sách số ${ca.num} "${ca.que}"`);
  ok(r.hao_dong[0] === ca.dong, `${ca.ma} hào động`, `ra ${r.hao_dong[0]}, sách ${ca.dong}`);
  const ctx = { dayStem: ca.stem, dayBranch: ca.branch, monthBranch: ca.month, toaSon: ca.son || null };
  const gia = CHK.danhGiaNgay(r, ca.viec, ctx);
  const nhan = RANK.nhanNgay(gia.diem, gia.cam_cung);
  ok(ca.nhom.includes(nhan), `${ca.ma} nhóm nhãn`, `nhãn "${nhan}" (điểm ${gia.diem >= 0 ? "+" : ""}${gia.diem}: ${gia.tot_dat} tốt · ${gia.xau_pham} xấu), kỳ vọng ${ca.nhom.join("/")}`);
  console.log(`   ${ca.ma}: ${r.que_chu.name} động ${r.hao_dong[0]} → điểm ${gia.diem >= 0 ? "+" : ""}${gia.diem} (${gia.tot_dat} tốt · ${gia.xau_pham} xấu) → ${nhan}`);
}

// ============================================================ C. TEST ĐƠN VỊ MỤC XẤU
// Dựng quẻ nhân tạo tối thiểu: chỉ đặt đúng các trường vị từ đọc.
function mkLine(hao, lucThan, element, chi, o = {}) {
  return {
    hao, bit: o.bit ?? 1, can: o.can || "Giáp", chi, element,
    ts_chi: o.ts_chi || "Lâm Quan", luc_than: lucThan, luc_thu: "Thanh Long",
    the: !!o.the, ung: !!o.ung, khong: !!o.khong,
    ts_ngay: o.ts_ngay ?? "Lâm Quan", ts_thang: o.ts_thang ?? "Lâm Quan",
    phuc_than: null,
  };
}
function mkResult(o) {
  // lines/bienLines: mảng 6 phần tử (hào 1..6) do mkLine tạo; bien mặc định
  // = bản sao của lines (hào động không đổi chi/hành nếu không ghi đè).
  const lines = o.lines;
  const bienLines = o.bienLines || lines.map((l) => ({ ...l }));
  const aq = (ls) => ({
    palace: o.palace || "Càn", palace_element: o.palaceElem || "Kim", loai: "",
    the: o.the ?? lines.findIndex((l) => l.the) + 1,
    ung: o.ung ?? lines.findIndex((l) => l.ung) + 1,
    lines: ls, phuc_than: o.phucThan || [],
  });
  return {
    hao_dong: o.dong ? [o.dong] : [],
    day_stem: "Giáp", day_branch: "Tý", month_branch: "Dần", tuan_khong: [],
    que_chu: { number: o.num || 1, name: o.name || "Quẻ Test", bits: [1, 1, 1, 1, 1, 1], an_que: aq(lines) },
    que_bien: { number: o.num || 1, name: o.name || "Quẻ Test", bits: [1, 1, 1, 1, 1, 1], an_que: aq(bienLines) },
    que_ho: { number: 1, name: "Quẻ Test", bits: [1, 1, 1, 1, 1, 1] },
  };
}
// Ngữ cảnh mặc định trung tính: Nhật Tý (Thủy), Nguyệt Dần (Mộc).
const CTX0 = { dayStem: "Giáp", dayBranch: "Tý", monthBranch: "Dần", toaSon: null };
// Bộ hào nền trung tính: không xung/hợp với Tý/Dần, Trường Sinh trung tính.
// Cung Càn (Kim): Huynh=Kim, Tài=Mộc, Quan=Hỏa, Tử=Thổ, Phụ=Thủy.
function nen(o = {}) {
  const lines = [
    mkLine(1, "Phụ Mẫu", "Thủy", "Sửu"),
    mkLine(2, "Huynh Đệ", "Kim", "Thìn"),
    mkLine(3, "Quan Quỷ", "Hỏa", "Mùi", { the: true }),
    mkLine(4, "Thê Tài", "Mộc", "Tuất", { ung: true }),
    mkLine(5, "Tử Tôn", "Thổ", "Sửu"),
    mkLine(6, "Phụ Mẫu", "Thủy", "Thìn"),
  ];
  if (o.sua) o.sua(lines);
  return mkResult({ lines, dong: o.dong || 0, bienLines: o.bienLines, phucThan: o.phucThan, num: o.num, name: o.name });
}
function muc(viec, ma) {
  const it = CHK.CHECKLISTS[viec].find((x) => x.ma === ma);
  if (!it) throw new Error("Không thấy mục " + ma);
  return it;
}
function pham(viec, ma, result, ctx = CTX0) {
  ok(muc(viec, ma).kiemTra(result, ctx) === true, `${ma} phải PHẠM`);
}
function khongPham(viec, ma, result, ctx = CTX0) {
  ok(muc(viec, ma).kiemTra(result, ctx) === false, `${ma} phải KHÔNG phạm`);
}

// ---- Khai trương: KT-X1..X8
pham("khai-truong", "KT-X1", nen({ sua: (l) => { l[2] = mkLine(3, "Huynh Đệ", "Kim", "Mùi", { the: true }); } }));
khongPham("khai-truong", "KT-X1", nen());
pham("khai-truong", "KT-X2", nen({ sua: (l) => { l[3] = mkLine(4, "Quan Quỷ", "Hỏa", "Tuất", { ung: true }); } }));
khongPham("khai-truong", "KT-X2", nen());
// Huynh Kim khắc Tài Mộc; Kim được Nguyệt Thổ (chi Thìn) sinh + Đế Vượng tại tháng → vượng
pham("khai-truong", "KT-X3", nen({ sua: (l) => { l[1] = mkLine(2, "Huynh Đệ", "Kim", "Sửu", { ts_thang: "Đế Vượng" }); } }), { ...CTX0, monthBranch: "Thìn" });
khongPham("khai-truong", "KT-X3", nen());
pham("khai-truong", "KT-X4", nen({ sua: (l) => { l[1] = mkLine(2, "Huynh Đệ", "Kim", "Thìn", { ts_ngay: "Trường Sinh" }); } }));
khongPham("khai-truong", "KT-X4", nen());
pham("khai-truong", "KT-X5", nen({ sua: (l) => { l[2] = mkLine(3, "Quan Quỷ", "Hỏa", "Ngọ", { the: true }); } })); // Ngọ xung Tý (Nhật phá Thế)
khongPham("khai-truong", "KT-X5", nen());
pham("khai-truong", "KT-X6", nen({ sua: (l) => { l[3] = mkLine(4, "Thê Tài", "Mộc", "Tuất", { ung: true, ts_ngay: "Mộ" }); } }));
khongPham("khai-truong", "KT-X6", nen());
// KT-X7 cần hào biến: dựng riêng
{
  const r = nen({ dong: 4 });
  r.que_bien.an_que.lines[3] = mkLine(4, "Thê Tài", "Mộc", "Ngọ", { ung: true }); // biến chi Ngọ xung Nhật Tý = hóa phá
  pham("khai-truong", "KT-X7", r);
  const r2 = nen({ dong: 4 });
  r2.que_bien.an_que.lines[3] = mkLine(4, "Phụ Mẫu", "Thủy", "Sửu", { ung: true }); // Thủy sinh Mộc = hồi đầu sinh
  khongPham("khai-truong", "KT-X7", r2);
}
pham("khai-truong", "KT-X8", nen({ phucThan: [{ luc_than: "Thê Tài", can: "Ất", chi: "Mão", element: "Mộc", hao: 2, phi_than: { hao: 2, can: "Bính", chi: "Tỵ", element: "Hỏa", luc_than: "Quan Quỷ" } }] })); // phục Mộc sinh phi Hỏa = tiết khí → phạm
khongPham("khai-truong", "KT-X8", nen({ phucThan: [{ luc_than: "Thê Tài", can: "Ất", chi: "Mão", element: "Mộc", hao: 2, phi_than: { hao: 2, can: "Giáp", chi: "Sửu", element: "Thủy", luc_than: "Phụ Mẫu" } }] })); // phi Thủy sinh phục Mộc = cát

// ---- Xây nhà: XN-H2..H8 (XN-H1 là mục bỏ qua — kiểm riêng)
pham("xay-nha", "XN-H2", nen({ dong: 5, sua: (l) => { l[2] = mkLine(3, "Quan Quỷ", "Hỏa", "Mùi", { the: true }); l[4] = mkLine(5, "Tử Tôn", "Thủy", "Sửu"); } })); // Tử(Thủy) động khắc Thế Quan(Hỏa)
khongPham("xay-nha", "XN-H2", nen());
pham("xay-nha", "XN-H3", nen({ sua: (l) => { l[2] = mkLine(3, "Thê Tài", "Mộc", "Mùi", { the: true }); } }), { ...CTX0, monthBranch: "Thân" }); // Thân(Kim) khắc Thế(Mộc)
khongPham("xay-nha", "XN-H3", nen({ sua: (l) => { l[2] = mkLine(3, "Huynh Đệ", "Kim", "Mùi", { the: true }); } })); // Thế Kim: Nhật Thủy/Nguyệt Mộc đều không khắc Kim
{
  const r = nen({ dong: 3 }); // Quan(Hỏa) động hóa biến Mộc sinh Hỏa = hồi đầu sinh
  r.que_bien.an_que.lines[2] = mkLine(3, "Thê Tài", "Mộc", "Thìn", { the: true });
  pham("xay-nha", "XN-H4", r);
  const r2 = nen({ dong: 3 });
  r2.que_bien.an_que.lines[2] = mkLine(3, "Quan Quỷ", "Hỏa", "Mùi", { the: true }); // biến đồng hành, không tiến (Mùi→? vòng Hỏa: Mùi là Mộ, kế tiếp Tuất) → không phạm
  khongPham("xay-nha", "XN-H4", r2);
}
khongPham("xay-nha", "XN-H4", nen());
pham("xay-nha", "XN-H5", nen({ dong: 1, sua: (l) => { // Tam hợp Hỏa cục Dần–Ngọ–Tuất, hành Hỏa = hành Quan của cung Càn
  l[0] = mkLine(1, "Quan Quỷ", "Hỏa", "Dần"); l[1] = mkLine(2, "Huynh Đệ", "Kim", "Ngọ"); l[3] = mkLine(4, "Thê Tài", "Mộc", "Tuất", { ung: true }); } }));
khongPham("xay-nha", "XN-H5", nen());
pham("xay-nha", "XN-H6", nen({ dong: 1, sua: (l) => { // Thế Huynh(Kim), tam hợp Kim cục Tỵ–Dậu–Sửu
  l[0] = mkLine(1, "Huynh Đệ", "Kim", "Tỵ", { the: true }); l[2] = mkLine(3, "Quan Quỷ", "Hỏa", "Mùi"); l[3] = mkLine(4, "Thê Tài", "Mộc", "Dậu", { ung: true }); l[4] = mkLine(5, "Tử Tôn", "Thổ", "Sửu"); } }));
khongPham("xay-nha", "XN-H6", nen());
pham("xay-nha", "XN-H7", nen({ sua: (l) => { l[2] = mkLine(3, "Huynh Đệ", "Kim", "Mùi", { the: true }); } }), { ...CTX0, toaSon: "Dần" }); // Thế Kim khắc sơn Dần(Mộc)
khongPham("xay-nha", "XN-H7", nen(), { ...CTX0, toaSon: "Dần" });
ok(muc("xay-nha", "XN-H7").kiemTra(nen(), CTX0) === "bo_qua", "XN-H7 không tọa sơn → bỏ qua");
pham("xay-nha", "XN-H8", nen({ phucThan: [{ luc_than: "Tử Tôn", can: "Mậu", chi: "Ngọ", element: "Hỏa", hao: 1, phi_than: { hao: 1, can: "Giáp", chi: "Tuất", element: "Thổ", luc_than: "Phụ Mẫu" } }] })); // mộ của Hỏa = Tuất = chi phi thần
khongPham("xay-nha", "XN-H8", nen({ phucThan: [{ luc_than: "Tử Tôn", can: "Mậu", chi: "Ngọ", element: "Hỏa", hao: 1, phi_than: { hao: 1, can: "Giáp", chi: "Sửu", element: "Thổ", luc_than: "Phụ Mẫu" } }] }));
ok(muc("xay-nha", "XN-H1").kiemTra(nen(), CTX0) === "bo_qua", "XN-H1 luôn bỏ qua (cần đối chiếu ca mẫu)");

// ---- Kết hôn: KH-H1..H9
pham("ket-hon", "KH-H1", nen({ num: 44, name: "Thiên Phong Cấu" }));
khongPham("ket-hon", "KH-H1", nen({ num: 10 }));
pham("ket-hon", "KH-H2", nen({ sua: (l) => { l[2] = mkLine(3, "Tử Tôn", "Thổ", "Mùi", { the: true }); l[5] = mkLine(6, "Quan Quỷ", "Hỏa", "Ngọ"); } })); // Quan chi Ngọ xung Tý = Nhật phá
khongPham("ket-hon", "KH-H2", nen());
pham("ket-hon", "KH-H3", nen({ phucThan: [{ luc_than: "Quan Quỷ", can: "Bính", chi: "Ngọ", element: "Hỏa", hao: 5, phi_than: { hao: 5, can: "Mậu", chi: "Sửu", element: "Thổ", luc_than: "Tử Tôn" } }] }));
khongPham("ket-hon", "KH-H3", nen({ phucThan: [{ luc_than: "Quan Quỷ", can: "Bính", chi: "Ngọ", element: "Hỏa", hao: 5, phi_than: { hao: 5, can: "Mậu", chi: "Sửu", element: "Thủy", luc_than: "Phụ Mẫu" } }] }));
{
  const r = nen({ dong: 3 }); // Quan Hỏa chi Ngọ động hóa Tỵ = hóa thoái (bản đồ Thoái thần: Ngọ→Tỵ)
  r.que_chu.an_que.lines[2] = mkLine(3, "Quan Quỷ", "Hỏa", "Ngọ", { the: true });
  r.que_bien.an_que.lines[2] = mkLine(3, "Quan Quỷ", "Hỏa", "Tỵ", { the: true });
  pham("ket-hon", "KH-H4", r);
  const r2 = nen({ dong: 3 });
  r2.que_chu.an_que.lines[2] = mkLine(3, "Quan Quỷ", "Hỏa", "Ngọ", { the: true });
  r2.que_bien.an_que.lines[2] = mkLine(3, "Quan Quỷ", "Hỏa", "Ngọ", { the: true });
  khongPham("ket-hon", "KH-H4", r2);
}
pham("ket-hon", "KH-H5", nen({ sua: (l) => { l[3] = mkLine(4, "Thê Tài", "Mộc", "Ngọ", { ung: true }); } })); // Tài chi Ngọ xung Tý = Nhật phá
khongPham("ket-hon", "KH-H5", nen());
pham("ket-hon", "KH-H6", nen({ sua: (l) => { l[0] = mkLine(1, "Phụ Mẫu", "Thủy", "Thân"); } })); // Thân xung Dần = Nguyệt phá
khongPham("ket-hon", "KH-H6", nen());
pham("ket-hon", "KH-H7", nen({ sua: (l) => { l[1] = mkLine(2, "Huynh Đệ", "Mộc", "Thìn"); } })); // Huynh Mộc được Nhật Thủy sinh
khongPham("ket-hon", "KH-H7", nen());
pham("ket-hon", "KH-H8", nen({ sua: (l) => { l[3] = mkLine(4, "Phụ Mẫu", "Thủy", "Tuất", { ung: true }); } })); // Ứng Thủy khắc Thế Hỏa (hào 3 nền)
khongPham("ket-hon", "KH-H8", nen());
pham("ket-hon", "KH-H9", nen({ sua: (l) => { l[5] = mkLine(6, "Thê Tài", "Mộc", "Thìn"); } })); // hai hào Tài (hào 4 + hào 6)
khongPham("ket-hon", "KH-H9", nen());

console.log(`\nTổng: ${total} kiểm tra, ${fails} lỗi`);
if (fails) { console.log("DAYCAST TEST FAIL"); process.exit(1); }
console.log("DAYCAST TEST OK");
