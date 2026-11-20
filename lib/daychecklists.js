// Checklist chọn ngày theo việc — chế độ Điểm Khiếu [TCK]
// (Lục Hào Thực Chiến Điểm Khiếu, mục III Nhật khóa trạch cát, tr. 230–245;
//  bản mã hóa: spec triển khai tính năng chọn ngày, mục 4–5).
//
// Nguyên tắc cứng:
// - Mọi mục chỉ dùng các vị từ dùng chung định nghĩa trong file này.
// - Mục nguồn mơ hồ/mâu thuẫn mang trang_thai "can_doi_chieu": luôn bỏ qua
//   khi chấm, hiện minh bạch ở trang chi tiết — KHÔNG tự diễn giải thêm.
// - Huynh Đệ hóa thoái đọc NGƯỢC nhau giữa khai trương (tốt) và kết hôn
//   (xấu) — giữ đúng từng việc, cấm "hợp nhất cho gọn".

import { SINH, KHAC, DATA } from "./engine.js";

// ------------------------------------------------------------ Vị từ cơ bản
export const chiElement = (chi) => DATA.chiElement[chi];
export const sinh = (a, b) => SINH[a] === b;
export const khac = (a, b) => KHAC[a] === b;
export const phu = (a, b) => a === b;

const HOP_PAIRS = [["Tý", "Sửu"], ["Dần", "Hợi"], ["Mão", "Tuất"], ["Thìn", "Dậu"], ["Tỵ", "Thân"], ["Ngọ", "Mùi"]];
const XUNG_PAIRS = [["Tý", "Ngọ"], ["Sửu", "Mùi"], ["Dần", "Thân"], ["Mão", "Dậu"], ["Thìn", "Tuất"], ["Tỵ", "Hợi"]];
const pairSet = (pairs) => {
  const s = new Set();
  for (const [a, b] of pairs) { s.add(a + "|" + b); s.add(b + "|" + a); }
  return s;
};
const HOP_SET = pairSet(HOP_PAIRS), XUNG_SET = pairSet(XUNG_PAIRS);
export const hopChi = (a, b) => HOP_SET.has(a + "|" + b);
export const xungChi = (a, b) => XUNG_SET.has(a + "|" + b);

// ------------------------------------------------------- Vị từ trên hào
// hao: một dòng trong que_chu.an_que.lines; ctx = {dayStem, dayBranch,
// monthBranch, toaSon}.
export const laDong = (hao, result) => result.hao_dong.includes(hao.hao);
export const nguyetPha = (hao, result, ctx) => xungChi(hao.chi, ctx.monthBranch);
export const nhatPha = (hao, result, ctx) => xungChi(hao.chi, ctx.dayBranch);
export const amDong = (hao, result, ctx) => !laDong(hao, result) && nhatPha(hao, result, ctx);
export const tinh = (hao, result, ctx) => !laDong(hao, result) && !amDong(hao, result, ctx);
export const haoBien = (hao, result) => result.que_bien.an_que.lines[hao.hao - 1];

// Tiến/Thoái thần: dùng BẢN ĐỒ TIẾN THẦN chuẩn của engine hiện hành
// (Tuệ Minh tr.74 — lib/luan.js dòng 33, bản đồ đã kiểm chứng cùng tầng
// luận cơ bản): cùng hành, chi tiến theo cặp cố định; Thoái là chiều ngược.
// Đây là cách đọc đúng của "chi kế tiếp trong vòng Trường Sinh" cho hào
// hóa cùng hành — vòng 12 chi đầy đủ sẽ cho chi khác hành, hào cùng hành
// không bao giờ đạt. Đối chiếu sách [TCK]: Tài Mùi Thổ hóa Tuất ở ví dụ
// khai trương 3 được sách gọi thẳng là "hóa tiến thần" — khớp bản đồ này.
const TIEN_THAN = { "Dần": "Mão", "Tỵ": "Ngọ", "Thân": "Dậu", "Hợi": "Tý", "Sửu": "Thìn", "Thìn": "Mùi", "Mùi": "Tuất", "Tuất": "Sửu" };
const THOAI_THAN = {};
for (const k in TIEN_THAN) THOAI_THAN[TIEN_THAN[k]] = k;
export const hoaTien = (hao, result) =>
  laDong(hao, result) && haoBien(hao, result).element === hao.element &&
  TIEN_THAN[hao.chi] === haoBien(hao, result).chi;
export const hoaThoai = (hao, result) =>
  laDong(hao, result) && haoBien(hao, result).element === hao.element &&
  THOAI_THAN[hao.chi] === haoBien(hao, result).chi;
export const hoiDauSinh = (hao, result) => laDong(hao, result) && sinh(haoBien(hao, result).element, hao.element);
export const hoiDauKhac = (hao, result) => laDong(hao, result) && khac(haoBien(hao, result).element, hao.element);
export const tietKhi = (hao, result) => laDong(hao, result) && sinh(hao.element, haoBien(hao, result).element);
export const hoaHop = (hao, result) => laDong(hao, result) && hopChi(haoBien(hao, result).chi, hao.chi);
export const hoaPha = (hao, result, ctx) =>
  laDong(hao, result) && (xungChi(haoBien(hao, result).chi, ctx.dayBranch) || xungChi(haoBien(hao, result).chi, ctx.monthBranch));
const TU_MO_TUYET = ["Tử", "Mộ", "Tuyệt"];
export const hoaTuMoTuyet = (hao, result) => laDong(hao, result) && TU_MO_TUYET.includes(haoBien(hao, result).ts_chi);

// "Vượng tướng" — ĐỊNH NGHĨA VẬN HÀNH của sản phẩm (sách không in định
// nghĩa hình thức trong mục trạch cát). Đã khóa bằng bộ ca mẫu sách trong
// scripts/test-daycast.mjs; nếu ca mẫu lệch, chỉ sửa tại vị từ này.
export function vuong(hao, result, ctx) {
  const dE = chiElement(ctx.dayBranch), mE = chiElement(ctx.monthBranch);
  return (
    sinh(mE, hao.element) || phu(mE, hao.element) ||
    sinh(dE, hao.element) || phu(dE, hao.element) ||
    hao.ts_thang === "Trường Sinh" || hao.ts_thang === "Đế Vượng" ||
    hao.ts_ngay === "Trường Sinh" || hao.ts_ngay === "Đế Vượng"
  );
}
export const duocSinhNhatNguyet = (hao, ctx) =>
  sinh(chiElement(ctx.dayBranch), hao.element) || sinh(chiElement(ctx.monthBranch), hao.element);
export function duocSinh(hao, result, ctx) {
  if (duocSinhNhatNguyet(hao, ctx)) return true;
  return result.que_chu.an_que.lines.some(
    (l) => l.hao !== hao.hao && vuong(l, result, ctx) && sinh(l.element, hao.element)
  );
}

// Tam hợp cục — quy ước hiện diện trích đúng tầng luận cơ bản hiện hành
// (lib/luan.js): tập chi hiện diện = chi 6 hào quẻ chủ + chi quẻ biến tại
// các hào động; cục chỉ "thành" khi đủ 3 chi và gắn với hào động.
const TAM_HOP = [["Thủy", "Thân", "Tý", "Thìn"], ["Kim", "Tỵ", "Dậu", "Sửu"], ["Hỏa", "Dần", "Ngọ", "Tuất"], ["Mộc", "Hợi", "Mão", "Mùi"]];
export function tamHopCuc(result) {
  const chuLines = result.que_chu.an_que.lines;
  const bienLines = result.que_bien.an_que.lines;
  const dong = new Set(result.hao_dong);
  const chuChis = {}, bienDongChis = {};
  for (const ln of chuLines) chuChis[ln.hao] = ln.chi;
  for (const h of dong) bienDongChis[h] = bienLines[h - 1].chi;
  const present = new Set([...Object.values(chuChis), ...Object.values(bienDongChis)]);
  const out = [];
  for (const [elem, a, trung, b] of TAM_HOP) {
    const chis = [a, trung, b];
    if (!chis.every((c) => present.has(c))) continue;
    let ganDong = [...dong].some((h) => chis.includes(chuChis[h]));
    if (!ganDong) {
      for (const cap of [[1, 3], [4, 6]]) {
        if (cap.every((h) => dong.has(h))) {
          const nguon = new Set([...Object.values(chuChis), ...cap.map((h) => bienDongChis[h])]);
          if (chis.every((c) => nguon.has(c))) ganDong = true;
        }
      }
    }
    if (ganDong) out.push({ hanh: elem, chis });
  }
  return out;
}

const MO_CHI = { "Mộc": "Mùi", "Hỏa": "Tuất", "Kim": "Sửu", "Thủy": "Thìn", "Thổ": "Thìn" };
export const moChi = (element) => MO_CHI[element];
export const phuc = (result, than) =>
  (result.que_chu.an_que.phuc_than || []).find((p) => p.luc_than === than) || null;

// ------------------------------------------------------------ Trợ giúp
const L = (result) => result.que_chu.an_que.lines;
const haoThe = (result) => L(result).find((l) => l.the);
const haoUng = (result) => L(result).find((l) => l.ung);
const byThan = (result, than) => L(result).filter((l) => l.luc_than === than);
const dayElem = (ctx) => chiElement(ctx.dayBranch);
const monthElem = (ctx) => chiElement(ctx.monthBranch);
const sonElem = (ctx) => (ctx.toaSon ? chiElement(ctx.toaSon) : null);
// Hành của từng Lục Thân suy từ hành cung (đồng nhất cho mọi quẻ):
const taiElem = (result) => KHAC[result.que_chu.an_que.palace_element];
const tuElem = (result) => SINH[result.que_chu.an_que.palace_element];
const huynhElem = (result) => result.que_chu.an_que.palace_element;
const INV_KHAC = {};
for (const e of Object.keys(KHAC)) INV_KHAC[KHAC[e]] = e;
const quanElem = (result) => INV_KHAC[result.que_chu.an_que.palace_element];
const TS_DV = ["Trường Sinh", "Đế Vượng"];
const BO_QUA_SON = "Chưa nhập tọa sơn — mục này cần tọa sơn mới chấm được";

// ============================================================ CHECKLIST
// Mỗi mục: {ma, chieu: "tot"|"xau", ten, kiemTra(result, ctx) ->
// true|false|"bo_qua", lyDoDat / lyDoPham (chuỗi hoặc hàm), lyDoBoQua?,
// phanBoQua? (phần nguồn chưa rõ — ghi nhận, không tính điểm),
// canhBao?(result, ctx) -> chuỗi|null, trang_thai?}
export const CHECKLISTS = {
  // ------------------------------------------------ 5.1 KHAI TRƯƠNG (9 tốt / 8 xấu)
  "khai-truong": [
    { ma: "KT-T1", chieu: "tot", ten: "Thế vượng — chủ quản được tiền tài",
      kiemTra: (r, ctx) => vuong(haoThe(r), r, ctx),
      lyDoDat: "Hào Thế vượng — chủ vững, quản được tiền tài" },
    { ma: "KT-T2", chieu: "tot", ten: "Tài lâm Thế hoặc Tài sinh Thế",
      kiemTra: (r) => haoThe(r).luc_than === "Thê Tài" || byThan(r, "Thê Tài").some((t) => sinh(t.element, haoThe(r).element)),
      lyDoDat: "Tài gắn với Thế / sinh Thế — tiền có đường về chủ" },
    { ma: "KT-T3", chieu: "tot", ten: "Tài động hóa tiến thần hoặc hóa hồi đầu sinh",
      kiemTra: (r) => byThan(r, "Thê Tài").some((t) => laDong(t, r) && (hoaTien(t, r) || hoiDauSinh(t, r))),
      lyDoDat: "Hào Tài động hóa tiến/hồi đầu sinh — tài đang đi lên" },
    { ma: "KT-T4", chieu: "tot", ten: "Tài tương hợp với Nguyệt thần hoặc Nhật thần",
      kiemTra: (r, ctx) => byThan(r, "Thê Tài").some((t) => hopChi(t.chi, ctx.monthBranch) || hopChi(t.chi, ctx.dayBranch)),
      lyDoDat: "Hào Tài hợp Nguyệt/Nhật — được thời khí nâng" },
    { ma: "KT-T5", chieu: "tot", ten: "Tài hợp hào động, hoặc thành Tài cục sinh/trợ Thế",
      kiemTra: (r) => {
        const dl = L(r).find((l) => laDong(l, r));
        if (dl && byThan(r, "Thê Tài").some((t) => hopChi(t.chi, dl.chi))) return true;
        const theEl = haoThe(r).element;
        return tamHopCuc(r).some((c) =>
          byThan(r, "Thê Tài").some((t) => t.element === c.hanh) && (sinh(c.hanh, theEl) || phu(c.hanh, theEl)));
      },
      lyDoDat: "Tài hợp động / thành Tài cục sinh Thế — dòng tiền tụ về chủ" },
    { ma: "KT-T6", chieu: "tot", ten: "Ứng (khách hàng) vượng và sinh Thế hoặc sinh Tài",
      kiemTra: (r, ctx) => {
        const u = haoUng(r);
        return vuong(u, r, ctx) && (sinh(u.element, haoThe(r).element) || byThan(r, "Thê Tài").some((t) => sinh(u.element, t.element)));
      },
      lyDoDat: "Khách hàng (Ứng) vượng và sinh chủ — làm ăn hưng vượng" },
    { ma: "KT-T7", chieu: "tot", ten: "Kỵ thần (Huynh Đệ) tự triệt: hóa thoái / hóa hợp / hóa hồi đầu khắc",
      kiemTra: (r) =>
        byThan(r, "Huynh Đệ").some((h) => laDong(h, r) && (hoaThoai(h, r) || hoaHop(h, r) || hoiDauKhac(h, r))) &&
        !byThan(r, "Huynh Đệ").some((h) => laDong(h, r) && (hoaTien(h, r) || hoiDauSinh(h, r))),
      lyDoDat: "Yếu tố cướp tài (Huynh Đệ) tự triệt — hại tự lui" },
    { ma: "KT-T8", chieu: "tot", ten: "Kỵ thần gặp phá / bị khắc / động hóa tử-mộ-tuyệt",
      kiemTra: (r, ctx) => byThan(r, "Huynh Đệ").some((h) =>
        nguyetPha(h, r, ctx) || nhatPha(h, r, ctx) ||
        khac(monthElem(ctx), h.element) || khac(dayElem(ctx), h.element) ||
        (laDong(h, r) && hoaTuMoTuyet(h, r))),
      lyDoDat: "Huynh Đệ bị phá/bị khắc — không chế được Tài" },
    { ma: "KT-T9", chieu: "tot", ten: "Ngũ hành Thế phù hợp tọa sơn của cửa hàng",
      kiemTra: (r, ctx) => {
        if (!ctx.toaSon) return "bo_qua";
        return sinh(haoThe(r).element, sonElem(ctx)) || phu(haoThe(r).element, sonElem(ctx));
      },
      lyDoDat: "Thế sinh/phù tọa sơn — chủ hợp mặt bằng",
      lyDoBoQua: BO_QUA_SON,
      phanBoQua: "Phần “lập cục cát hung” của mục KT-T9" },

    { ma: "KT-X1", chieu: "xau", ten: "Kiếp thần (Huynh Đệ) lâm Thế",
      kiemTra: (r) => haoThe(r).luc_than === "Huynh Đệ",
      lyDoPham: "Huynh Đệ lâm Thế — tiền không về còn mất thêm" },
    { ma: "KT-X2", chieu: "xau", ten: "Kiếp thần hoặc Quan Quỷ lâm Ứng",
      kiemTra: (r) => ["Huynh Đệ", "Quan Quỷ"].includes(haoUng(r).luc_than),
      lyDoPham: "Ứng mang Huynh/Quan — phía khách hàng bất lợi cho cầu tài" },
    { ma: "KT-X3", chieu: "xau", ten: "Kiếp thần được Nhật Nguyệt sinh mà vượng, chế khắc Tài",
      kiemTra: (r, ctx) => byThan(r, "Huynh Đệ").some((h) =>
        (sinh(dayElem(ctx), h.element) || sinh(monthElem(ctx), h.element)) &&
        vuong(h, r, ctx) &&
        byThan(r, "Thê Tài").some((t) => khac(h.element, t.element))),
      lyDoPham: "Huynh Đệ vượng và khắc Tài — tiền bị chặn" },
    { ma: "KT-X4", chieu: "xau", ten: "Kiếp thần hóa tiến / hồi đầu sinh / lâm Trường Sinh / Đế Vượng",
      kiemTra: (r) => byThan(r, "Huynh Đệ").some((h) =>
        (laDong(h, r) && (hoaTien(h, r) || hoiDauSinh(h, r))) ||
        TS_DV.includes(h.ts_thang) || TS_DV.includes(h.ts_ngay)),
      lyDoPham: "Huynh Đệ đang mạnh lên — bất lợi cầu tài" },
    { ma: "KT-X5", chieu: "xau", ten: "Thế, Ứng gặp Nhật phá, Nguyệt phá",
      kiemTra: (r, ctx) =>
        nguyetPha(haoThe(r), r, ctx) || nhatPha(haoThe(r), r, ctx) ||
        nguyetPha(haoUng(r), r, ctx) || nhatPha(haoUng(r), r, ctx),
      lyDoPham: "Thế/Ứng bị phá — chủ và khách đều chao đảo" },
    { ma: "KT-X6", chieu: "xau", ten: "Tài, Thế, Ứng ở Nhật là tử/mộ/tuyệt",
      kiemTra: (r) => [...byThan(r, "Thê Tài"), haoThe(r), haoUng(r)].some((l) => TU_MO_TUYET.includes(l.ts_ngay)),
      lyDoPham: "Hào chủ chốt rơi tử/mộ/tuyệt tại Nhật — lực tắt" },
    { ma: "KT-X7", chieu: "xau", ten: "Tài động hóa tiết khí / hồi đầu khắc / hóa phá / hóa tử-mộ-tuyệt",
      kiemTra: (r, ctx) => byThan(r, "Thê Tài").some((t) =>
        laDong(t, r) && (tietKhi(t, r) || hoiDauKhac(t, r) || hoaPha(t, r, ctx) || hoaTuMoTuyet(t, r))),
      lyDoPham: "Hào Tài động mà hóa xấu — tiền động theo hướng mất" },
    { ma: "KT-X8", chieu: "xau", ten: "Tài phục bị phi thần khắc, hoặc phục sinh phi thần (tiết khí)",
      kiemTra: (r) => {
        const p = phuc(r, "Thê Tài");
        return !!p && (khac(p.phi_than.element, p.element) || sinh(p.element, p.phi_than.element));
      },
      lyDoPham: "Tài ẩn bị phi thần khắc/tiết — tiền kẹt, khó ra" },
  ],

  // ------------------------------------------------ 5.2 XÂY NHÀ (8 cát / 8 hung)
  // Các mục là MẪU HỢP THÀNH: đạt khi toàn bộ các nhánh con thỏa; thỏa một
  // phần thì không đạt.
  "xay-nha": [
    { ma: "XN-C1", chieu: "tot", ten: "Tài trì Thế + Tử lâm Ứng; hoặc Tài hóa hồi đầu sinh/tiến; hoặc Tử được Nhật Nguyệt sinh",
      kiemTra: (r, ctx) =>
        (haoThe(r).luc_than === "Thê Tài" && haoUng(r).luc_than === "Tử Tôn") ||
        byThan(r, "Thê Tài").some((t) => laDong(t, r) && (hoiDauSinh(t, r) || hoaTien(t, r))) ||
        byThan(r, "Tử Tôn").some((t) => duocSinhNhatNguyet(t, ctx)),
      lyDoDat: "Tài và người đều có chỗ dựa — mẫu cát xây nhà" },
    { ma: "XN-C2", chieu: "tot", ten: "Tài trì Thế, được sinh phù/hợp, Tử vượng phát động",
      kiemTra: (r, ctx) => {
        const th = haoThe(r);
        return th.luc_than === "Thê Tài" &&
          (sinh(dayElem(ctx), th.element) || sinh(monthElem(ctx), th.element) ||
           phu(dayElem(ctx), th.element) || phu(monthElem(ctx), th.element) ||
           hopChi(th.chi, ctx.dayBranch) || hopChi(th.chi, ctx.monthBranch)) &&
          byThan(r, "Tử Tôn").some((t) => vuong(t, r, ctx) && laDong(t, r));
      },
      lyDoDat: "Tài trì Thế được nâng, Tử Tôn vượng phát động" },
    { ma: "XN-C3", chieu: "tot", ten: "Tam hợp Tử cục sinh Tài; Phụ, Quan, Huynh an tĩnh",
      kiemTra: (r, ctx) =>
        tamHopCuc(r).some((c) => c.hanh === tuElem(r) && sinh(c.hanh, taiElem(r))) &&
        ["Phụ Mẫu", "Quan Quỷ", "Huynh Đệ"].every((than) => byThan(r, than).every((l) => tinh(l, r, ctx))),
      lyDoDat: "Tử Tôn cục sinh Tài, các hào kỵ an tĩnh" },
    { ma: "XN-C4", chieu: "tot", ten: "Tài trì Thế; Huynh phát động nhưng Tử vượng/ám động tiết khí Kiếp thần",
      kiemTra: (r, ctx) =>
        haoThe(r).luc_than === "Thê Tài" &&
        byThan(r, "Huynh Đệ").some((h) => laDong(h, r)) &&
        (byThan(r, "Tử Tôn").some((t) => vuong(t, r, ctx)) || byThan(r, "Tử Tôn").some((t) => amDong(t, r, ctx))),
      lyDoDat: "Có Huynh động nhưng Tử Tôn đủ mạnh để tiết chế" },
    { ma: "XN-C5", chieu: "tot", ten: "Tử trì Thế, được sinh/hợp; Phụ an tĩnh",
      kiemTra: (r, ctx) => {
        const th = haoThe(r);
        return th.luc_than === "Tử Tôn" &&
          (sinh(dayElem(ctx), th.element) || sinh(monthElem(ctx), th.element) ||
           hopChi(th.chi, ctx.dayBranch) || hopChi(th.chi, ctx.monthBranch)) &&
          byThan(r, "Phụ Mẫu").every((p) => tinh(p, r, ctx));
      },
      lyDoDat: "Tử Tôn trì Thế được sinh — nhân đinh yên" },
    { ma: "XN-C6", chieu: "tot", ten: "Tử trì Thế động hóa sinh/tiến; hoặc Tài phục dưới Tử",
      kiemTra: (r) => {
        const th = haoThe(r);
        if (th.luc_than === "Tử Tôn" && laDong(th, r) && (hoiDauSinh(th, r) || hoaTien(th, r))) return true;
        const p = phuc(r, "Thê Tài");
        return !!p && p.phi_than.luc_than === "Tử Tôn";
      },
      lyDoDat: "Người và tiền cùng đi lên / tiền ẩn dưới Phúc thần" },
    { ma: "XN-C7", chieu: "tot", ten: "Có Quan; Quan trì Thế thì phải sinh vượng; Tử vượng an tĩnh",
      kiemTra: (r, ctx) =>
        byThan(r, "Quan Quỷ").length > 0 &&
        (haoThe(r).luc_than !== "Quan Quỷ" || vuong(haoThe(r), r, ctx)) &&
        byThan(r, "Tử Tôn").some((t) => vuong(t, r, ctx) && tinh(t, r, ctx)),
      lyDoDat: "Quan có mặt mà được chế ngự, Tử vượng tĩnh" },
    { ma: "XN-C8", chieu: "tot", ten: "Thời điểm phối với tọa sơn là cát (Thế sinh/phù tọa sơn)",
      kiemTra: (r, ctx) => {
        if (!ctx.toaSon) return "bo_qua";
        return sinh(haoThe(r).element, sonElem(ctx)) || phu(haoThe(r).element, sonElem(ctx));
      },
      lyDoDat: "Thế hợp với tọa sơn của nhà",
      lyDoBoQua: "Chưa nhập tọa sơn — mục này cần tọa sơn mới chấm được",
      phanBoQua: "Phần “lập cục cát hung” của mục XN-C8" },

    { ma: "XN-H1", chieu: "xau", ten: "“Không có Quan Quỷ mà gặp Quan Quỷ trì Thế” — sách viết chưa rõ",
      trang_thai: "can_doi_chieu",
      kiemTra: () => "bo_qua",
      lyDoBoQua: "Mục này trong sách viết tự mâu thuẫn — đang đối chiếu thêm với ca mẫu trong sách" },
    { ma: "XN-H2", chieu: "xau", ten: "Thế trì Quan, Kỵ Tử động khắc Thế",
      kiemTra: (r) =>
        haoThe(r).luc_than === "Quan Quỷ" &&
        byThan(r, "Tử Tôn").some((t) => laDong(t, r) && khac(t.element, haoThe(r).element)),
      lyDoPham: "Tử Tôn động khắc Quan trì Thế — bất lợi cho chủ" },
    { ma: "XN-H3", chieu: "xau", ten: "Thế bị Nhật Nguyệt khắc; hoặc hóa thoái/mộ/phá/tuyệt",
      kiemTra: (r, ctx) => {
        const th = haoThe(r);
        return khac(monthElem(ctx), th.element) || khac(dayElem(ctx), th.element) ||
          (laDong(th, r) && (hoaThoai(th, r) || hoaPha(th, r, ctx) || hoaTuMoTuyet(th, r)));
      },
      lyDoPham: "Hào Thế bị khắc/bị hóa xấu — chủ nhà yếu thế" },
    { ma: "XN-H4", chieu: "xau", ten: "Quan động hóa hồi đầu sinh / hóa tiến / khắc Thế",
      kiemTra: (r) => byThan(r, "Quan Quỷ").some((q) =>
        laDong(q, r) && (hoiDauSinh(q, r) || hoaTien(q, r) || khac(q.element, haoThe(r).element))),
      lyDoPham: "Quan Quỷ động và mạnh lên — họa có đường vào" },
    { ma: "XN-H5", chieu: "xau", ten: "Tam hợp thành Quỷ cục",
      kiemTra: (r) => tamHopCuc(r).some((c) => c.hanh === quanElem(r)),
      lyDoPham: "Quỷ cục thành hình — yếu tố họa tụ lại" },
    { ma: "XN-H6", chieu: "xau", ten: "Kiếp thần trì Thế, tam hợp thành Huynh cục",
      kiemTra: (r) => haoThe(r).luc_than === "Huynh Đệ" && tamHopCuc(r).some((c) => c.hanh === huynhElem(r)),
      lyDoPham: "Huynh trì Thế lại thành cục — chủ phá tài" },
    { ma: "XN-H7", chieu: "xau", ten: "Thế khắc tọa sơn",
      kiemTra: (r, ctx) => {
        if (!ctx.toaSon) return "bo_qua";
        return khac(haoThe(r).element, sonElem(ctx));
      },
      lyDoPham: "Thế khắc tọa sơn — chủ xung với đất nhà",
      lyDoBoQua: "Chưa nhập tọa sơn — mục này cần tọa sơn mới chấm được" },
    { ma: "XN-H8", chieu: "xau", ten: "Tử Tôn phục nhập mộ của phi thần",
      kiemTra: (r) => {
        const p = phuc(r, "Tử Tôn");
        return !!p && p.phi_than.chi === moChi(p.element);
      },
      lyDoPham: "Tử Tôn ẩn bị chôn dưới mộ của phi thần — nhân đinh bị đè" },
  ],

  // ------------------------------------------------ 5.3 KẾT HÔN (9 lành / 9 hung)
  "ket-hon": [
    { ma: "KH-L1", chieu: "tot", ten: "Thế–Ứng vượng tướng tương sinh; Thế và Ứng không gặp phá",
      kiemTra: (r, ctx) => {
        const th = haoThe(r), u = haoUng(r);
        return vuong(th, r, ctx) && vuong(u, r, ctx) &&
          (sinh(th.element, u.element) || sinh(u.element, th.element)) &&
          !nguyetPha(th, r, ctx) && !nhatPha(th, r, ctx) &&
          !nguyetPha(u, r, ctx) && !nhatPha(u, r, ctx);
      },
      lyDoDat: "Thế–Ứng vượng và tương sinh — hai phía hòa hợp",
      phanBoQua: "Vế “mọi Lục Thân không gặp phá” của mục KH-L1 (bản đầu áp cho Thế và Ứng)" },
    { ma: "KH-L2", chieu: "tot", ten: "Quan lâm Thế, Tài lâm Ứng sinh Thế (cấu hình mẫu)",
      kiemTra: (r) =>
        haoThe(r).luc_than === "Quan Quỷ" && haoUng(r).luc_than === "Thê Tài" &&
        sinh(haoUng(r).element, haoThe(r).element),
      lyDoDat: "Đúng cấu hình mẫu: Quan lâm Thế, Tài lâm Ứng sinh Thế" },
    { ma: "KH-L3", chieu: "tot", ten: "Tài, Quan đều được Nhật Nguyệt hoặc hào vượng tương sinh",
      kiemTra: (r, ctx) =>
        byThan(r, "Thê Tài").length > 0 && byThan(r, "Quan Quỷ").length > 0 &&
        byThan(r, "Thê Tài").every((t) => duocSinh(t, r, ctx)) &&
        byThan(r, "Quan Quỷ").every((q) => duocSinh(q, r, ctx)),
      lyDoDat: "Cả Tài và Quan đều được sinh — vợ chồng cùng được nâng" },
    { ma: "KH-L4", chieu: "tot", ten: "Thế động hóa tiến thần hoặc hóa hồi đầu sinh",
      kiemTra: (r) => laDong(haoThe(r), r) && (hoaTien(haoThe(r), r) || hoiDauSinh(haoThe(r), r)),
      lyDoDat: "Hào Thế động theo hướng đi lên" },
    { ma: "KH-L5", chieu: "tot", ten: "Tam hợp cục sinh Quan hoặc sinh Tài",
      kiemTra: (r) => tamHopCuc(r).some((c) => sinh(c.hanh, quanElem(r)) || sinh(c.hanh, taiElem(r))),
      lyDoDat: "Có cục sinh Quan/Tài — nền tảng được bồi" },
    { ma: "KH-L6", chieu: "tot", ten: "Tử Tôn vượng — nhân đinh có khí",
      kiemTra: (r, ctx) => byThan(r, "Tử Tôn").some((t) => vuong(t, r, ctx)),
      lyDoDat: "Tử Tôn vượng — nhân đinh có khí",
      phanBoQua: "Vế “Tử Tôn nên tĩnh” của mục KH-L6 (xung trực tiếp ví dụ 1 của sách)",
      canhBao: (r) =>
        byThan(r, "Tử Tôn").some((t) => laDong(t, r) && khac(t.element, quanElem(r)))
          ? "Lưu ý theo sách: Tử Tôn phát động khắc Quan Quỷ — điểm này đang đối chiếu thêm với ca mẫu nên chưa tính vào điểm."
          : null },
    { ma: "KH-L7", chieu: "tot", ten: "Huynh Đệ an tĩnh; hoặc động hóa mộ/tuyệt/hợp",
      kiemTra: (r, ctx) =>
        byThan(r, "Huynh Đệ").every((h) => tinh(h, r, ctx)) ||
        byThan(r, "Huynh Đệ").filter((h) => laDong(h, r))
          .every((h) => ["Mộ", "Tuyệt"].includes(haoBien(h, r).ts_chi) || hoaHop(h, r)),
      lyDoDat: "Huynh Đệ yên — không có yếu tố chen ngang" },
    { ma: "KH-L8", chieu: "tot", ten: "Phụ Mẫu an tĩnh — trưởng bối yên",
      kiemTra: (r, ctx) => byThan(r, "Phụ Mẫu").every((p) => tinh(p, r, ctx)),
      lyDoDat: "Phụ Mẫu an tĩnh — trưởng bối yên",
      phanBoQua: "Vế “Phụ quá vượng khắc Tử / quá nhược hóa thoái” của mục KH-L8" },
    { ma: "KH-L9", chieu: "tot", ten: "Hỷ Tài vượng sinh Quan",
      kiemTra: (r, ctx) =>
        byThan(r, "Thê Tài").some((t) => vuong(t, r, ctx)) &&
        byThan(r, "Thê Tài").some((t) => byThan(r, "Quan Quỷ").some((q) => sinh(t.element, q.element))),
      lyDoDat: "Tài vượng sinh Quan — nhờ vợ mà nên" },

    { ma: "KH-H1", chieu: "xau", ten: "Quẻ cấm dùng cho cưới hỏi (Cấu / Tiểu Súc / Khuê)",
      kiemTra: (r) => [44, 9, 38].includes(r.que_chu.number),
      lyDoPham: (r) => `Quẻ ngày là ${r.que_chu.name} — thuộc 3 quẻ sách cấm dùng cho cưới hỏi` },
    { ma: "KH-H2", chieu: "xau", ten: "Tử Tôn trì Thế, Quan gặp phá/Không vong",
      kiemTra: (r, ctx) =>
        haoThe(r).luc_than === "Tử Tôn" &&
        byThan(r, "Quan Quỷ").some((q) => nguyetPha(q, r, ctx) || nhatPha(q, r, ctx) || q.khong),
      lyDoPham: "Tử Tôn trì Thế mà Quan bị phá/rỗng — chồng bị yếu thế",
      phanBoQua: "Vế “Quan hóa thoái” của mục KH-H2" },
    { ma: "KH-H3", chieu: "xau", ten: "Quan phục dưới hào Tử Tôn",
      kiemTra: (r) => {
        const p = phuc(r, "Quan Quỷ");
        return !!p && p.phi_than.luc_than === "Tử Tôn";
      },
      lyDoPham: "Quan ẩn dưới Tử Tôn — người chồng khó xuất đầu" },
    { ma: "KH-H4", chieu: "xau", ten: "Quan hóa thoái / hóa tử-mộ-tuyệt / nhập Nhật mộ",
      kiemTra: (r, ctx) => byThan(r, "Quan Quỷ").some((q) =>
        laDong(q, r) && (hoaThoai(q, r) || hoaTuMoTuyet(q, r) || ctx.dayBranch === moChi(q.element))),
      lyDoPham: "Quan Quỷ động mà hóa lùi/diệt — danh phận mờ" },
    { ma: "KH-H5", chieu: "xau", ten: "Tài bị cục khắc / Nhật phá / Nguyệt phá / hóa thoái / hóa tử-mộ-tuyệt / hóa Mộc Dục",
      kiemTra: (r, ctx) => byThan(r, "Thê Tài").some((t) =>
        tamHopCuc(r).some((c) => khac(c.hanh, t.element)) ||
        nhatPha(t, r, ctx) || nguyetPha(t, r, ctx) ||
        (laDong(t, r) && (hoaThoai(t, r) || hoaTuMoTuyet(t, r) || haoBien(t, r).ts_chi === "Mộc Dục"))),
      lyDoPham: "Hào Tài bị tổn thương — phía vợ/tiền của hồi môn yếu" },
    { ma: "KH-H6", chieu: "xau", ten: "Phụ gặp phá — trưởng bối ưu sầu",
      kiemTra: (r, ctx) => byThan(r, "Phụ Mẫu").some((p) => nguyetPha(p, r, ctx) || nhatPha(p, r, ctx)),
      lyDoPham: "Phụ Mẫu bị phá — trưởng bối dễ sinh lo" },
    { ma: "KH-H7", chieu: "xau", ten: "Huynh hóa tiến / được Nhật Nguyệt sinh phù / thành Huynh cục",
      kiemTra: (r, ctx) => byThan(r, "Huynh Đệ").some((h) =>
        (laDong(h, r) && hoaTien(h, r)) ||
        sinh(dayElem(ctx), h.element) || sinh(monthElem(ctx), h.element) ||
        phu(dayElem(ctx), h.element) || phu(monthElem(ctx), h.element) ||
        tamHopCuc(r).some((c) => c.hanh === h.element)),
      lyDoPham: "Huynh Đệ mạnh lên — yếu tố cướp đoạt chen vào" },
    { ma: "KH-H8", chieu: "xau", ten: "Ứng khắc Thế",
      kiemTra: (r) => khac(haoUng(r).element, haoThe(r).element),
      lyDoPham: "Ứng khắc Thế — hai phía xung khắc ngay từ quẻ ngày" },
    { ma: "KH-H9", chieu: "xau", ten: "Hai hào Quan / hai hào Tài (lưỡng hiện)",
      kiemTra: (r) => byThan(r, "Quan Quỷ").length >= 2 || byThan(r, "Thê Tài").length >= 2,
      lyDoPham: "Quan/Tài lưỡng hiện — tượng hai chồng/hai vợ, sau dễ biến đổi" },
  ],
};

// ------------------------------------------------------------ Metadata việc
export const CAC_VIEC = [
  {
    slug: "khai-truong", ten: "Khai trương",
    tenSEO: "Ngày tốt khai trương", dungThan: "hào Thê Tài (tiền tài) làm chủ dụng thần, Thế là chủ, Ứng là khách hàng",
    gioiThieu:
      "Mọi khai trương — công ty, nhà máy, cửa hàng — sách lấy hào Tài làm chủ dụng thần: ngày tốt là ngày Thế (chủ) đủ vượng để quản được tiền tài, Tài có đường về chủ, khách hàng (Ứng) sinh chủ, và yếu tố cướp tài (Huynh Đệ) bị chế ngự.",
  },
  {
    slug: "xay-nha", ten: "Xây nhà",
    tenSEO: "Ngày tốt động thổ, xây nhà", dungThan: "mẫu hợp thành giữa Thê Tài (tiền của) và Tử Tôn (nhân đinh, bình an)",
    gioiThieu:
      "Chọn ngày xây nhà theo sách là xét các mẫu hợp thành: Tài và nhân đinh (Tử Tôn) đều phải có chỗ dựa, yếu tố họa (Quan Quỷ) bị chế ngự, và hào Thế không bị Nhật Nguyệt khắc phá. Thỏa một phần của một mẫu thì mẫu đó chưa đạt — không tính điểm lẻ.",
  },
  {
    slug: "ket-hon", ten: "Kết hôn",
    tenSEO: "Ngày tốt cưới hỏi", dungThan: "cặp Quan Quỷ (chồng) — Thê Tài (vợ) quanh trục Thế–Ứng",
    gioiThieu:
      "Ngày cưới theo sách đẹp nhất ở cấu hình mẫu: Quan lâm Thế, Tài lâm Ứng sinh Thế; Thế–Ứng vượng mà tương sinh; Tử Tôn vượng chủ nhân đinh. Sách cũng cấm cứng 3 quẻ dùng cho cưới hỏi: Thiên Phong Cấu, Phong Thiên Tiểu Súc và Hỏa Trạch Khuê — gặp quẻ cấm thì ngày bị xếp “Nên tránh” bất kể điểm.",
  },
];
export const VIEC_BY_SLUG = Object.fromEntries(CAC_VIEC.map((v) => [v.slug, v]));

// ------------------------------------------------------------ Đánh giá 1 ngày
const resolve = (v, r, ctx) => (typeof v === "function" ? v(r, ctx) : v);

// Trả: {items: [{ma, chieu, ten, trang_thai: dat|pham|khong_dat|khong_pham|
// bo_qua, ly_do}], bo_qua_notes, canh_bao, tot_dat, xau_pham, diem, cam_cung}
export function danhGiaNgay(result, viec, ctx) {
  const items = [], bo_qua_notes = [], canh_bao = [];
  let totDat = 0, xauPham = 0, camCung = false;
  for (const it of CHECKLISTS[viec]) {
    const kq = it.kiemTra(result, ctx);
    let st, lyDo = null;
    if (kq === "bo_qua") {
      st = "bo_qua";
      lyDo = it.lyDoBoQua || "Đang đối chiếu thêm với ca mẫu trong sách";
    } else if (it.chieu === "tot") {
      st = kq ? "dat" : "khong_dat";
      if (kq) { totDat++; lyDo = resolve(it.lyDoDat, result, ctx); }
    } else {
      st = kq ? "pham" : "khong_pham";
      if (kq) {
        xauPham++;
        lyDo = resolve(it.lyDoPham, result, ctx);
        if (it.ma === "KH-H1") camCung = true;
      }
    }
    items.push({ ma: it.ma, chieu: it.chieu, ten: it.ten, trang_thai: st, ly_do: lyDo });
    if (it.phanBoQua)
      bo_qua_notes.push({
        ma: it.ma,
        ten: it.phanBoQua,
        ly_do: "Phần này nguồn viết chưa đủ rõ — đang đối chiếu thêm với ca mẫu trong sách nên chưa tính điểm.",
      });
    if (it.canhBao) {
      const cb = it.canhBao(result, ctx);
      if (cb) canh_bao.push(cb);
    }
  }
  return {
    items, bo_qua_notes, canh_bao,
    tot_dat: totDat, xau_pham: xauPham,
    diem: totDat - xauPham, cam_cung: camCung,
  };
}
