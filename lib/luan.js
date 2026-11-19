// Tầng LUẬN CƠ BẢN — port ESM nguyên văn từ gieo-que-engine/demo/luan_logic.js.
import { SINH, KHAC, lucThan, tuanKhong, DATA } from "./engine.js";
// Tầng LUẬN CƠ BẢN — bản JS port 1-1 từ luan_co_ban.py (Python), cài đúng
// đặc tả books/KHUNG-LUAN-CO-BAN.md. Dùng chung hằng SINH / KHAC, hàm lucThan /
// tuanKhong của engine_logic.js và DATA.cauLuan (bộ câu gốc trong
// data/cau_luan_co_ban.json) — các file này được build_demo.py nối liền nhau
// trong engine.js và trong bản HTML. Cấu trúc dict kết quả giữ nguyên tên khóa
// snake_case như Python để đối chiếu parity trực tiếp.
// Cập nhật 2026-11-19: đủ 13/13 lĩnh vực như Python — tim_vat_mat theo
// loai_vat (mục XVIII), hon_nhan có xem_ho (mục IX), xuat_hanh/kien_tung theo
// quan_he với đích mặc định hào Thế (mục XIII/XVII), hanh_nhan người lạ lấy
// hào Ứng (mục XV). Khối QUAN_HE_NGUOI / LINH_VUC dưới đây được sinh từ
// chính dict của luan_co_ban.py — sửa spec thì sửa ở Python rồi sinh lại.
// Cập nhật 2026-11-19 (phần giữa Ch.XII): thi_cu theo mục V phần 3 — Quan
// Quỷ là dụng chính, loaiThi van/vo, chốt cứng không đậu (Tử/Tài động hoặc
// trì Thế, Tử thành cục); kinh_doanh theo mục XIV — Tử Tôn "gốc rễ" của
// Tài (chốt cứng mất rễ) + tieuMuc (luc_suc đổi dụng thành Tử Tôn);
// suc_khoe theo mục XVI — người lạ lấy hào Ứng, vat_nuoi lấy Tử Tôn, trục
// bệnh mới/lâu qua benhMoi (đảo ngược ở S12 + chốt cứng bệnh lâu lục xung).

// ------------------------------------------------------- Quan hệ địa chi
function _capDoi(cacCap){
  const d = {};
  for (const [a,b] of cacCap){ d[a]=b; d[b]=a; }
  return d;
}
const PAIR_XUNG = _capDoi([["Tý","Ngọ"],["Sửu","Mùi"],["Dần","Thân"],["Mão","Dậu"],["Thìn","Tuất"],["Tỵ","Hợi"]]);
const PAIR_HOP = _capDoi([["Tý","Sửu"],["Dần","Hợi"],["Mão","Tuất"],["Thìn","Dậu"],["Tỵ","Thân"],["Ngọ","Mùi"]]);
const HINH_CHIEU = {"Tý":["Mão"],"Mão":["Tý"],"Tỵ":["Thân"],"Thân":["Dần"],"Dần":["Tỵ"],"Sửu":["Tuất"],"Tuất":["Mùi"],"Mùi":["Sửu"]};
const BO_BA_HINH = [["Dần","Tỵ","Thân"],["Sửu","Tuất","Mùi"]];
const TU_HINH_SET = new Set(["Thìn","Ngọ","Dậu","Hợi"]);
const MO_THEO_HANH = {"Thủy":"Thìn","Hỏa":"Tuất","Kim":"Sửu","Mộc":"Mùi","Thổ":"Thìn"};
const TIEN_THAN = {"Dần":"Mão","Tỵ":"Ngọ","Thân":"Dậu","Hợi":"Tý","Sửu":"Thìn","Thìn":"Mùi","Mùi":"Tuất","Tuất":"Sửu"};
const THOAI_THAN = {}; for (const k in TIEN_THAN) THOAI_THAN[TIEN_THAN[k]] = k;
const TAM_HOP_CUC = [["Thủy","Thân","Tý","Thìn"],["Kim","Tỵ","Dậu","Sửu"],["Hỏa","Dần","Ngọ","Tuất"],["Mộc","Hợi","Mão","Mùi"]];
const LUC_XUNG_HEX_SET = new Set([1,2,29,30,51,52,57,58,25,34]);
const PHAN_NGAM_TRI = {"Càn":"Tốn","Tốn":"Càn","Khảm":"Ly","Ly":"Khảm","Chấn":"Đoài","Đoài":"Chấn","Khôn":"Cấn","Cấn":"Khôn"};
const MUA_THEO_THANG = {"Dần":"Xuân","Mão":"Xuân","Thìn":"Xuân","Tỵ":"Hạ","Ngọ":"Hạ","Mùi":"Hạ","Thân":"Thu","Dậu":"Thu","Tuất":"Thu","Hợi":"Đông","Tý":"Đông","Sửu":"Đông"};
const CHAN_KHONG_MUA = {"Xuân":"Thổ","Hạ":"Kim","Thu":"Mộc","Đông":"Hỏa"};

// ------------------------------------- Nguyên / Kỵ / Cừu theo Dụng (Mục 0)
const NGUYEN_KY_CUU = {
  "Thê Tài": ["Tử Tôn","Huynh Đệ","Phụ Mẫu"],
  "Quan Quỷ": ["Thê Tài","Tử Tôn","Huynh Đệ"],
  "Phụ Mẫu": ["Quan Quỷ","Thê Tài","Tử Tôn"],
  "Tử Tôn": ["Huynh Đệ","Phụ Mẫu","Quan Quỷ"],
  "Huynh Đệ": ["Phụ Mẫu","Quan Quỷ","Thê Tài"],
};

// ------------------------------------------------------------ Lĩnh vực
const QUAN_HE_NGUOI = {
  "minh": "THE",
  "vo": "Thê Tài",
  "chong": "Quan Quỷ",
  "cha": "Phụ Mẫu",
  "me": "Phụ Mẫu",
  "cha_me": "Phụ Mẫu",
  "con": "Tử Tôn",
  "chau": "Tử Tôn",
  "anh_em": "Huynh Đệ",
  "em_trai": "Huynh Đệ",
  "anh_trai": "Huynh Đệ",
  "chi_em": "Huynh Đệ",
  "ban": "Huynh Đệ",
  "nguoi_la": "UNG",
  "khong_than_thich": "UNG",
  "vat_nuoi": "Tử Tôn",
  "ton_thuong": "KHAC_THE"
};
const TIEU_MUC_KINH_DOANH_GHI_CHU = {
  "luc_suc": "Buôn bán lục súc (gia súc, gia cầm): dụng thần là Tử Tôn, đồng thời xem hào Thê Tài (mục XIV phần 2, tr. 215-218).",
  "vay_muon": "Tiểu mục vay mượn (mục XIV phần 3, tr. 218): trục Thế–Ứng — Thế và Ứng không nên bị Nguyệt phá hay lâm Không; Tử Tôn hoặc Thê Tài phát động thì vay được.",
  "mo_cua_hang": "Tiểu mục mở cửa hàng (mục XIV phần 4, tr. 219): hào Ứng là người quản lý hoặc khách đến mua — xét quan hệ Thế–Ứng (tín hiệu S9) cùng hào Tài.",
  "dau_tu": "Tiểu mục đầu tư (mục XIV phần 5, tr. 220): Quan Quỷ và hào Ứng vượng mà sinh hợp Thế thì người đáng nhờ cậy; Ứng khắc Thế là dễ bị hãm hại.",
  "ca_do": "Tiểu mục cá độ (mục XIV phần 6, tr. 220): trục Thế–Ứng là chính (tín hiệu S9), thắng mà được tiền thì xem thêm hào Thê Tài."
};
const LINH_VUC = {
  "cau_tai": {
    "nhan": "cầu tài",
    "dung": "Thê Tài",
    "can_cu": "tr. 68, 118"
  },
  "kinh_doanh": {
    "nhan": "kinh doanh, buôn bán",
    "dung": "Thê Tài",
    "can_cu": "mục XIV, tr. 211-220",
    "ghi_chu_them": "Theo mục XIV (tr. 211): Tử Tôn là 'gốc rễ' (căn nguyên) của Thê Tài và là tiêu chí quyết định việc mua/trữ hàng — Tài suy vẫn mua được nếu Tử có lực; Tử hưu tù thất hãm thì Tài không có rễ, giá dù thấp cũng không nên mua vào. Tiểu mục qua tham số tieu_muc: 'luc_suc' (buôn bán gia súc/gia cầm — dụng thần đổi thành Tử Tôn, đồng thời xem Tài), 'vay_muon', 'mo_cua_hang' (Ứng = người quản lý hoặc khách mua), 'dau_tu', 'ca_do' (trục Thế–Ứng)."
  },
  "cong_danh": {
    "nhan": "công việc, công danh",
    "dung": "Quan Quỷ",
    "can_cu": "tr. 67-68"
  },
  "hon_nhan": {
    "nhan": "tình cảm, hôn nhân",
    "dung_theo_gioi": {
      "nam": "Thê Tài",
      "nu": "Quan Quỷ",
      "xem_ho": "Thê Tài"
    },
    "can_cu": "tr. 67-68; mục IX, tr. 178-183",
    "ghi_chu_them": "Theo mục IX (tr. 178): hào Ứng là đối phương/nhà đối phương, chỉ phụ họa — hào Tài (nam xem) / Quan (nữ xem) mới là trọng; người thứ ba xem hộ cũng lấy Thê Tài. Dụng hợp Thế, trì Thế, tránh Không/Phá/Mộ/Tuyệt là tốt; quẻ bát thuần và lục xung quẻ là tín hiệu xấu riêng của mục này (tr. 179, 182)."
  },
  "suc_khoe": {
    "nhan": "sức khỏe, bệnh tật",
    "dung_theo_quan_he": true,
    "mac_dinh_quan_he": "minh",
    "can_cu": "tr. 67-68; mục XVI, tr. 232-255",
    "uu_tien_bach_ho": true,
    "ghi_chu_them": "Theo mục XVI (tr. 232): Quan Quỷ là thần bệnh cần bị chế, Tử Tôn là thuốc/thần cứu. Người bệnh không thân thích lấy hào Ứng (quan_he='nguoi_la'), vật nuôi lấy Tử Tôn (quan_he='vat_nuoi'). Trục bệnh mới/bệnh lâu đảo ngược nhau ở lục xung/lục hợp và Tuần Không — truyền benh_moi=True/False để áp trục này. Tiểu mục mời thầy thuốc (phần 2, tr. 254): thầy thuốc = hào Ứng, thuốc = Tử Tôn."
  },
  "thi_cu": {
    "nhan": "thi cử, học hành",
    "dung": "Quan Quỷ",
    "can_cu": "mục V phần 3, tr. 157-165",
    "ghi_chu_them": "Theo mục V phần 3 (tr. 157): thi văn lấy Quan Quỷ làm dụng thần CHÍNH, Phụ Mẫu quan trọng thứ hai (bài vở, bảng vàng — xem thêm hào Phụ Mẫu trong quẻ); thi võ chỉ lấy Quan Quỷ (truyền loai_thi='vo'). Cha mẹ xem con thi vẫn dùng Quan + Phụ, KHÔNG lấy Lục Thân của người thi. Chốt cứng: Tử Tôn hoặc Thê Tài trì Thế, hoặc Tử/Tài phát động, hoặc Tử Tôn thành tam hợp cục -> không đậu."
  },
  "xuat_hanh": {
    "nhan": "xuất hành, đi xa",
    "dung_theo_quan_he": true,
    "mac_dinh_quan_he": "minh",
    "khong_nguyen_ky": true,
    "can_cu": "mục XIII, tr. 205-207",
    "ghi_chu_them": "Theo mục XIII (tr. 205): xem cho mình lấy hào Thế (người ra đi) làm đích; Ứng = nơi đến/người đi cùng, Phụ Mẫu = hành lý và phương tiện (việc giấy tờ/visa cũng lấy Phụ Mẫu làm dụng thần — VD X03), Thê Tài = lộ phí, Tử Tôn = thần bình an, Quan Quỷ = tai họa trên đường. Sách không lập vòng Nguyên/Kỵ cho mục này."
  },
  "gia_trach": {
    "nhan": "nhà cửa, gia trạch",
    "dung": "Phụ Mẫu",
    "can_cu": "tr. 67; Q06"
  },
  "con_cai": {
    "nhan": "con cái",
    "dung": "Tử Tôn",
    "can_cu": "tr. 68"
  },
  "kien_tung": {
    "nhan": "kiện tụng",
    "dung_theo_quan_he": true,
    "mac_dinh_quan_he": "minh",
    "khong_nguyen_ky": true,
    "can_cu": "mục XVII, tr. 256-258",
    "ghi_chu_them": "Theo mục XVII (tr. 256): kiện tụng không lấy một Lục Thân làm dụng thần — trục luận là Thế (mình) đối Ứng (đối phương), nên tầng cơ bản chấm tín hiệu trên hào Thế. Quan Quỷ = quan tòa/pháp quyền (sinh Thế là tòa hướng về ta, khắc Thế là bất lợi); Phụ Mẫu = văn thư, cáo trạng (lâm Thế = ta là nguyên cáo, lâm Ứng = ta là bị cáo); Thê Tài = lý lẽ thuộc về ai; Huynh Đệ = nhân chứng, hao tài. Xem cho người bị kiện/tạm giam: truyền quan_he để lấy Lục Thân của người đó (hai VD K01, K02 của sách đều lấy Tử Tôn)."
  },
  "thoi_tiet": {
    "nhan": "thời tiết",
    "dung_theo_hien_tuong": {
      "mua": [
        "Phụ Mẫu"
      ],
      "nang": [
        "Tử Tôn",
        "Thê Tài"
      ],
      "sam": [
        "Quan Quỷ"
      ],
      "gio": [
        "Huynh Đệ"
      ]
    },
    "khong_nguyen_ky": true,
    "can_cu": "tr. 108-116"
  },
  "hanh_nhan": {
    "nhan": "người đi xa về",
    "dung_theo_quan_he": true,
    "can_cu": "mục XV, tr. 221-224; Q10",
    "canh_bao": "Dữ kiện sách tự mâu thuẫn ở một điểm: Dụng thần hóa Tiến thần — tr. 221 ghi 'chẳng về', tr. 222 ghi 'người về ngay'. Tầng cơ bản giữ cách chấm khung chung cho tín hiệu hóa Tiến/Thoái, không tự phân xử.",
    "ghi_chu_them": "Theo mục XV (tr. 221): xem cho thân nhân lấy Lục Thân theo quan hệ; xem cho người không thân thích lấy hào Ứng làm dụng thần (quan_he='nguoi_la'). Thế khắc Dụng = người đi chưa có ý về; Dụng khắc Thế = về ngay; Dụng sinh/hợp Thế = muốn về nhưng chậm. Phụ Mẫu là tin tức: động hoặc sinh Thế thì có tin, lâm Không/hưu tù khố tuyệt thì không có tin (tr. 224)."
  },
  "tim_vat_mat": {
    "nhan": "tìm vật mất",
    "dung_theo_loai_vat": {
      "van_thu": "Phụ Mẫu",
      "vat_nuoi": "Tử Tôn",
      "tien": "Thê Tài",
      "vat_dung": "Thê Tài"
    },
    "can_cu": "mục XVIII, tr. 262-264",
    "ghi_chu_them": "Theo mục XVIII (tr. 262): dụng thần chọn theo loại vật — đồ thuộc văn thư (xe thuyền, mũ áo, trang sức, vải vóc, văn kiện, tranh ảnh) lấy Phụ Mẫu; vật nuôi/gia súc lấy Tử Tôn; tiền tài và vật dụng thường ngày (VD điện thoại, tr. 267) lấy Thê Tài. Quan Quỷ là kẻ trộm: lâm Huyền Vũ là bị trộm; không hiện, không động hoặc tử tuyệt thì không phải bị trộm. Dụng khắc Thế = vật dễ tìm, Thế khắc Dụng = khó tìm."
  }
};
const LINH_VUC_CHUA_CO_DU_KIEN = {};

// ------------------------------------------------------------ Tiện ích
function qhXung(a, b){ return PAIR_XUNG[a] === b; }
function qhHop(a, b){ return PAIR_HOP[a] === b; }
function qhHinh(a, b){
  if (a === b) return TU_HINH_SET.has(a);
  return (HINH_CHIEU[a] || []).includes(b) || (HINH_CHIEU[b] || []).includes(a);
}
function vuongTuong(elem, monthBranch){
  if (monthBranch === null || monthBranch === undefined) return null;
  const thangElem = DATA.chiElement[monthBranch];
  if (elem === thangElem) return "Vượng";
  if (SINH[thangElem] === elem) return "Tướng";
  return "Hưu tù";
}
function laLucHopQue(lines){
  const chis = lines.map(l=>l.chi);
  return [0,1,2].every(i=>qhHop(chis[i], chis[i+3]));
}
function _pickOpt(v, fallback){
  return (v !== undefined && v !== null) ? v : (fallback === undefined ? null : fallback);
}

// ------------------------------------------------------------ Ngữ cảnh
function taoNguCanh(ketQua, opts){
  opts = opts || {};
  const dayStem = _pickOpt(opts.dayStem, ketQua.day_stem);
  const dayBranch = _pickOpt(opts.dayBranch, ketQua.day_branch);
  const monthBranch = _pickOpt(opts.monthBranch, ketQua.month_branch);
  if (monthBranch !== null && !DATA.branches.includes(monthBranch))
    throw new Error("Chi tháng không hợp lệ: " + monthBranch);
  const chu = ketQua.que_chu, bien = ketQua.que_bien;
  let khongList = [];
  if (dayStem && dayBranch) khongList = tuanKhong(dayStem, dayBranch);
  else if (ketQua.tuan_khong) khongList = [...ketQua.tuan_khong];
  return {
    ket_qua: ketQua, chu: chu, bien: bien,
    chu_lines: chu.an_que.lines, bien_lines: bien.an_que.lines,
    palace: chu.an_que.palace, palace_elem: chu.an_que.palace_element,
    the: chu.an_que.the, ung: chu.an_que.ung,
    dong: new Set(ketQua.hao_dong || []),
    day_stem: dayStem, day_branch: dayBranch,
    day_elem: dayBranch ? DATA.chiElement[dayBranch] : null,
    month_branch: monthBranch,
    month_elem: monthBranch ? DATA.chiElement[monthBranch] : null,
    khong_set: new Set(khongList),
  };
}
function sucManhLine(ctx, ln){ return vuongTuong(ln.element, ctx.month_branch); }
function biPhaBoiThang(ctx, chi){
  return ctx.month_branch !== null && qhXung(chi, ctx.month_branch);
}

// ------------------------------------------------------- Chọn Dụng thần
function tieuChiUuTien(ctx, ln){
  const chi = ln.chi;
  let gapXungHop = false;
  for (const ref of [ctx.day_branch, ctx.month_branch]){
    if (ref && (qhXung(chi, ref) || qhHop(chi, ref))) gapXungHop = true;
  }
  return [
    ctx.dong.has(ln.hao),
    ctx.khong_set.has(chi) || biPhaBoiThang(ctx, chi),
    gapXungHop,
    ln.hao === ctx.the || ln.hao === ctx.ung,
  ];
}
function chonTrongCacHao(ctx, cands, uuTienBachHo){
  if (cands.length === 1) return cands[0];
  let pool = [...cands];
  if (uuTienBachHo){
    const bh = pool.filter(ln=>ln.luc_thu === "Bạch Hổ");
    if (bh.length) pool = bh;
  }
  for (let idx = 0; idx < 4; idx++){
    const sub = pool.filter(ln=>tieuChiUuTien(ctx, ln)[idx]);
    if (sub.length) pool = sub;
    if (pool.length === 1) return pool[0];
  }
  pool.sort((a,b)=>{
    const ka = [-Math.abs(a.hao - ctx.the), Math.abs(a.hao - ctx.ung), a.hao];
    const kb = [-Math.abs(b.hao - ctx.the), Math.abs(b.hao - ctx.ung), b.hao];
    return ka[0]-kb[0] || ka[1]-kb[1] || ka[2]-kb[2];
  });
  return pool[0];
}
function dungTuPhuc(ctx, thanNames){
  const entries = ctx.chu.an_que.phuc_than.filter(e=>thanNames.includes(e.luc_than));
  if (!entries.length) return null;
  const e = [...entries].sort((a,b)=>a.hao-b.hao)[0];
  return {than: e.luc_than, hao: e.hao, chi: e.chi, element: e.element,
          phuc: true, phi_than: e.phi_than, dong: ctx.dong.has(e.hao)};
}
function chonDungThan(ketQua, linhVuc, opts){
  opts = opts || {};
  const gioiTinh = opts.gioiTinh ?? null, quanHe = opts.quanHe ?? null,
        hienTuong = opts.hienTuong ?? null, loaiVat = opts.loaiVat ?? null,
        loaiThi = opts.loaiThi ?? null, tieuMuc = opts.tieuMuc ?? null;
  if (Object.prototype.hasOwnProperty.call(LINH_VUC_CHUA_CO_DU_KIEN, linhVuc))
    throw new Error("Lĩnh vực '" + linhVuc + "' chưa có dữ kiện sách: " + LINH_VUC_CHUA_CO_DU_KIEN[linhVuc]);
  if (!Object.prototype.hasOwnProperty.call(LINH_VUC, linhVuc))
    throw new Error("Lĩnh vực không hỗ trợ: " + linhVuc);
  if (linhVuc === "thi_cu" && loaiThi !== null && !["van", "vo"].includes(loaiThi))
    throw new Error("loai_thi không hợp lệ cho 'thi_cu': " + loaiThi + " (chọn 'van' hoặc 'vo')");
  if (linhVuc === "kinh_doanh" && tieuMuc !== null
      && !Object.prototype.hasOwnProperty.call(TIEU_MUC_KINH_DOANH_GHI_CHU, tieuMuc))
    throw new Error("tieu_muc không hợp lệ cho 'kinh_doanh': " + tieuMuc
      + " (chọn một trong: " + Object.keys(TIEU_MUC_KINH_DOANH_GHI_CHU).join(", ") + ")");
  const spec = LINH_VUC[linhVuc];
  const ctx = taoNguCanh(ketQua, opts);
  const canhBao = spec.canh_bao ? [spec.canh_bao] : [];
  const ghiChu = [];

  let thanNames = null, dichDacBiet = null;
  if (linhVuc === "kinh_doanh" && tieuMuc === "luc_suc"){
    thanNames = ["Tử Tôn"];
  } else if (spec.dung_theo_gioi){
    if (!Object.prototype.hasOwnProperty.call(spec.dung_theo_gioi, gioiTinh))
      throw new Error("Lĩnh vực 'hon_nhan' cần gioi_tinh thuộc " + Object.keys(spec.dung_theo_gioi).join("/"));
    thanNames = [spec.dung_theo_gioi[gioiTinh]];
  } else if (spec.dung_theo_loai_vat){
    if (!Object.prototype.hasOwnProperty.call(spec.dung_theo_loai_vat, loaiVat))
      throw new Error("Lĩnh vực 'tim_vat_mat' cần loai_vat thuộc " + Object.keys(spec.dung_theo_loai_vat).join("/") + " (dụng thần theo loại vật, tr. 262)");
    thanNames = [spec.dung_theo_loai_vat[loaiVat]];
  } else if (spec.dung_theo_hien_tuong){
    if (!Object.prototype.hasOwnProperty.call(spec.dung_theo_hien_tuong, hienTuong))
      throw new Error("Lĩnh vực 'thoi_tiet' cần hien_tuong thuộc " + Object.keys(spec.dung_theo_hien_tuong).join("/"));
    thanNames = [...spec.dung_theo_hien_tuong[hienTuong]];
  } else if (spec.dung_theo_quan_he){
    const qh = quanHe || spec.mac_dinh_quan_he || null;
    if (qh === null && spec.dung_mac_dinh){
      thanNames = [spec.dung_mac_dinh];
    } else if (qh === null){
      throw new Error("Lĩnh vực '" + linhVuc + "' cần quan_he (một trong: " + Object.keys(QUAN_HE_NGUOI).join(", ") + ")");
    } else if (!Object.prototype.hasOwnProperty.call(QUAN_HE_NGUOI, qh)){
      throw new Error("quan_he không hợp lệ: " + qh);
    } else {
      const dich = QUAN_HE_NGUOI[qh];
      if (dich === "THE" || dich === "KHAC_THE" || dich === "UNG") dichDacBiet = dich;
      else thanNames = [dich];
    }
  }
  if (thanNames === null && dichDacBiet === null){
    const dich = spec.dung || spec.dung_mac_dinh;
    if (dich === "THE") dichDacBiet = "THE";
    else thanNames = [dich];
  }

  let dung;
  if (dichDacBiet === "THE"){
    const ln = ctx.chu_lines[ctx.the - 1];
    dung = {than: ln.luc_than, hao: ln.hao, chi: ln.chi, element: ln.element,
            phuc: false, phi_than: null, dong: ctx.dong.has(ln.hao),
            the_la_dung: true, cac_hao_cung_than: [ln.hao]};
  } else if (dichDacBiet === "UNG"){
    const ln = ctx.chu_lines[ctx.ung - 1];
    dung = {than: ln.luc_than, hao: ln.hao, chi: ln.chi, element: ln.element,
            phuc: false, phi_than: null, dong: ctx.dong.has(ln.hao),
            the_la_dung: false, cac_hao_cung_than: [ln.hao]};
    if (linhVuc === "suc_khoe")
      ghiChu.push("Người bệnh không thân thích với người xem: lấy hào Ứng làm Dụng thần (mục XVI, tr. 232 — VD1: vợ xem bệnh cho đồng nghiệp).");
    else
      ghiChu.push("Người được hỏi không thân thích với người xem: lấy hào Ứng làm Dụng thần (mục XV, tr. 221).");
  } else if (dichDacBiet === "KHAC_THE"){
    const theLn = ctx.chu_lines[ctx.the - 1];
    const cands = ctx.chu_lines.filter(ln=>KHAC[ln.element] === theLn.element && ln.hao !== theLn.hao);
    if (!cands.length) throw new Error("Quẻ không có hào khắc hào Thế để làm Dụng thần");
    const ln = chonTrongCacHao(ctx, cands, false);
    dung = {than: ln.luc_than, hao: ln.hao, chi: ln.chi, element: ln.element,
            phuc: false, phi_than: null, dong: ctx.dong.has(ln.hao),
            the_la_dung: false, cac_hao_cung_than: cands.map(c=>c.hao)};
    ghiChu.push("Dụng thần là hào khắc hào Thế (xem tổn thương của chính mình — Q04, tr. 70).");
  } else {
    const cands = ctx.chu_lines.filter(ln=>thanNames.includes(ln.luc_than));
    if (cands.length){
      const ln = chonTrongCacHao(ctx, cands, !!spec.uu_tien_bach_ho);
      dung = {than: ln.luc_than, hao: ln.hao, chi: ln.chi, element: ln.element,
              phuc: false, phi_than: null, dong: ctx.dong.has(ln.hao),
              the_la_dung: false, cac_hao_cung_than: cands.map(c=>c.hao)};
      if (cands.length > 1){
        ghiChu.push(ln.luc_than + " lưỡng hiện (hào " + cands.map(c=>c.hao).join(", ")
          + "); chọn hào " + ln.hao + " theo thứ tự ưu tiên tr. 69"
          + (spec.uu_tien_bach_ho ? " — xem bệnh ưu tiên hào lâm Bạch Hổ (Q05)." : "."));
      }
    } else {
      dung = dungTuPhuc(ctx, thanNames);
      if (dung === null)
        throw new Error("Không tìm được Dụng thần (" + thanNames.join("/") + ") trong quẻ chủ lẫn phục thần");
      dung.the_la_dung = false;
      dung.cac_hao_cung_than = [];
      ghiChu.push(dung.than + " không xuất hiện trong quẻ chủ; lấy Phục thần làm Dụng thần (tr. 74).");
    }
  }

  let nguyen = null, ky = null, cuu = null;
  if (!spec.khong_nguyen_ky){
    [nguyen, ky, cuu] = NGUYEN_KY_CUU[dung.than];
  }
  if (spec.ghi_chu_them && !(linhVuc === "thi_cu" && loaiThi === "vo"))
    ghiChu.push(spec.ghi_chu_them);
  if (linhVuc === "thi_cu" && loaiThi === "vo")
    ghiChu.push("Thi võ: chỉ lấy Quan Quỷ làm dụng thần, không xét Phụ Mẫu (mục V phần 3, tr. 157). Chốt cứng không đậu (Tử/Tài trì Thế hoặc phát động, Tử Tôn thành tam hợp cục) vẫn áp như thi văn.");
  if (linhVuc === "kinh_doanh" && tieuMuc)
    ghiChu.push(TIEU_MUC_KINH_DOANH_GHI_CHU[tieuMuc]);
  return {linh_vuc: linhVuc, nhan: spec.nhan, ...dung,
          nguyen: nguyen, ky: ky, cuu: cuu,
          can_cu: spec.can_cu ?? null, canh_bao: canhBao, ghi_chu: ghiChu};
}

// ------------------------------------------------- Chuẩn bị trạng thái
function hoiDauCua(ctx, hao){
  const chuLn = ctx.chu_lines[hao - 1], bienLn = ctx.bien_lines[hao - 1];
  let elemQh = null;
  if (SINH[bienLn.element] === chuLn.element) elemQh = "sinh";
  else if (KHAC[bienLn.element] === chuLn.element) elemQh = "khac";
  let chiQh = null;
  if (qhHop(chuLn.chi, bienLn.chi)) chiQh = "hop";
  else if (qhXung(chuLn.chi, bienLn.chi)) chiQh = "xung";
  return {elem_quan_he: elemQh, chi_quan_he: chiQh,
          tien: TIEN_THAN[chuLn.chi] === bienLn.chi,
          thoai: THOAI_THAN[chuLn.chi] === bienLn.chi,
          hoa_mo: bienLn.chi === MO_THEO_HANH[chuLn.element],
          bien_chi: bienLn.chi, bien_elem: bienLn.element};
}
function nhapMoCua(ctx, ln){
  const mo = MO_THEO_HANH[ln.element];
  const forms = [];
  if (ctx.day_branch === mo || ctx.month_branch === mo) forms.push("ngay_thang");
  if (ctx.dong.has(ln.hao) && ctx.bien_lines[ln.hao - 1].chi === mo) forms.push("hoa_mo");
  for (const h of ctx.dong){
    if (h !== ln.hao && ctx.chu_lines[h - 1].chi === mo){ forms.push("dong_mo"); break; }
  }
  return forms;
}
function loaiKhongCua(ctx, chi, elem, hao, phiElem){
  if (!ctx.khong_set.has(chi)) return null;
  if (biPhaBoiThang(ctx, chi)) return "chan";
  const mua = ctx.month_branch !== null ? MUA_THEO_THANG[ctx.month_branch] : undefined;
  if (mua && CHAN_KHONG_MUA[mua] === elem) return "chan";
  const sm = vuongTuong(elem, ctx.month_branch);
  if (sm === "Vượng" || sm === "Tướng") return "gia";
  if (hao !== null && hao !== undefined && ctx.dong.has(hao)) return "gia";
  let duocSinh = (ctx.day_elem !== null && SINH[ctx.day_elem] === elem);
  if (!duocSinh){
    for (const h of ctx.phat_dong){
      if (h !== hao && SINH[ctx.chu_lines[h - 1].element] === elem){ duocSinh = true; break; }
    }
  }
  if (duocSinh) return "gia";
  if (phiElem !== null && phiElem !== undefined && KHAC[phiElem] === elem) return "chan";
  if (sm === "Hưu tù" && (hao === null || hao === undefined || !ctx.phat_dong.has(hao))) return "chan";
  return "gia";
}
function chuanBiLuan(ctx, dung){
  ctx.dung = dung;
  ctx.dung_chi = dung.chi; ctx.dung_elem = dung.element; ctx.dung_hao = dung.hao;
  ctx.suc_manh_map = {}; ctx.pha_map = {};
  for (const ln of ctx.chu_lines){
    ctx.suc_manh_map[ln.hao] = sucManhLine(ctx, ln);
    ctx.pha_map[ln.hao] = biPhaBoiThang(ctx, ln.chi);
  }
  ctx.dung_suc_manh = vuongTuong(dung.element, ctx.month_branch);
  ctx.dung_pha = biPhaBoiThang(ctx, dung.chi);
  ctx.dung_lam_nguyet = ctx.month_branch !== null && dung.chi === ctx.month_branch;
  ctx.dung_lam_nhat = ctx.day_branch !== null && dung.chi === ctx.day_branch;
  const amDong = new Set(), xungKhong = new Set();
  if (ctx.day_branch){
    for (const ln of ctx.chu_lines){
      if (ctx.dong.has(ln.hao)) continue;
      if (!qhXung(ln.chi, ctx.day_branch)) continue;
      if (ctx.khong_set.has(ln.chi)) xungKhong.add(ln.hao);
      else if (ctx.suc_manh_map[ln.hao] === "Vượng" || ctx.suc_manh_map[ln.hao] === "Tướng") amDong.add(ln.hao);
    }
  }
  ctx.am_dong = amDong; ctx.xung_khong = xungKhong;
  ctx.phat_dong = new Set([...ctx.dong, ...amDong, ...xungKhong]);
  let acting = ctx.chu_lines.filter(ln=>ctx.phat_dong.has(ln.hao));
  if (ctx.dong.size === 0){
    acting = acting.concat(ctx.chu_lines.filter(ln=>!ctx.phat_dong.has(ln.hao)
      && (ctx.suc_manh_map[ln.hao] === "Vượng" || ctx.suc_manh_map[ln.hao] === "Tướng")));
  }
  ctx.acting = acting;
  ctx.hoi_dau_map = {};
  for (const h of ctx.dong) ctx.hoi_dau_map[h] = hoiDauCua(ctx, h);
  ctx.nhap_mo_map = {};
  for (const ln of ctx.chu_lines) ctx.nhap_mo_map[ln.hao] = nhapMoCua(ctx, ln);
  ctx.khong_loai_map = {};
  for (const ln of ctx.chu_lines)
    ctx.khong_loai_map[ln.hao] = loaiKhongCua(ctx, ln.chi, ln.element, ln.hao, null);
  if (dung.phuc){
    ctx.dung_khong_loai = loaiKhongCua(ctx, dung.chi, dung.element, null,
      dung.phi_than ? dung.phi_than.element : null);
  } else {
    ctx.dung_khong_loai = ctx.khong_loai_map[dung.hao] ?? null;
  }
  // Tam hợp cục (tr. 87-89)
  const chuChis = {}, bienDongChis = {};
  for (const ln of ctx.chu_lines) chuChis[ln.hao] = ln.chi;
  for (const h of ctx.dong) bienDongChis[h] = ctx.bien_lines[h - 1].chi;
  const present = new Set([...Object.values(chuChis), ...Object.values(bienDongChis)]);
  const cucResults = [], quanHao = new Set();
  for (const [elem, a, trung, b] of TAM_HOP_CUC){
    const chis = [a, trung, b];
    if (chis.every(c=>present.has(c))){
      let ganDong = [...ctx.dong].some(h=>chis.includes(chuChis[h]));
      if (!ganDong){
        for (const cap of [[1,3],[4,6]]){
          if (cap.every(h=>ctx.dong.has(h))){
            const nguon = new Set([...Object.values(chuChis), ...cap.map(h=>bienDongChis[h])]);
            if (chis.every(c=>nguon.has(c))) ganDong = true;
          }
        }
      }
      if (!ganDong) continue;
      const hoa = ctx.chu_lines.some(ln=>ln.chi === trung
        && (ctx.suc_manh_map[ln.hao] === "Vượng" || ctx.suc_manh_map[ln.hao] === "Tướng")
        && !ctx.pha_map[ln.hao] && !ctx.khong_set.has(ln.chi));
      cucResults.push({elem: elem, chis: chis, trung: trung, hoa: hoa, hu: false});
      if (!hoa) for (const ln of ctx.chu_lines) if (chis.includes(ln.chi)) quanHao.add(ln.hao);
    } else if (chis.filter(c=>present.has(c)).length === 2){
      cucResults.push({elem: elem, chis: chis, trung: trung, hoa: false, hu: true});
    }
  }
  ctx.cuc_results = cucResults;
  ctx.cuc_quan_hao = quanHao;
  ctx.cuc_present = present;
  return ctx;
}
function biVoHieu(ctx, ln){
  const hao = ln.hao, lyDo = [];
  if (ctx.cuc_quan_hao.has(hao)) lyDo.push("bị hợp quấn");
  if ((ctx.nhap_mo_map[hao] || []).length) lyDo.push("nhập mộ");
  if (ln.luc_than === ctx.dung.ky && ctx.pha_map[hao]) lyDo.push("Kỵ thần bị Nguyệt phá");
  if (ctx.dong.has(hao) && ctx.hoi_dau_map[hao].elem_quan_he === "khac"
      && (ln.luc_than === ctx.dung.nguyen || ln.luc_than === ctx.dung.ky))
    lyDo.push("bị hồi đầu khắc");
  if ((ln.luc_than === ctx.dung.nguyen || ln.luc_than === ctx.dung.ky)
      && ctx.khong_loai_map[hao] === "chan")
    lyDo.push("lâm chân không");
  return lyDo;
}
function taoTinHieu(ma, ten, trangThai, o){
  o = o || {};
  const c1 = o.c1 || 0, c2 = o.c2 || 0, c3 = o.c3 || 0;
  return {ma: ma, ten: ten, trang_thai: trangThai, diem: c1 + c2 + c3,
          dong_gop: {C1: c1, C2: c2, C3: c3},
          dien_giai: o.dienGiai || "", can_cu: o.canCu || "",
          phu: o.phu || [], bo_canh: o.boCanh || {}};
}

// ------------------------------------------------------------ 16 tín hiệu
function tinHieuS1(ctx){
  const ten = "Vượng tướng của Dụng thần theo Nguyệt kiến";
  if (ctx.month_branch === null)
    return taoTinHieu("S1", ten, "thieu_du_kien",
      {dienGiai: "Chưa có chi tháng nên chưa xét được vượng suy của Dụng thần.", canCu: "tr. 80"});
  const sm = ctx.dung_suc_manh;
  let c1 = 0;
  if (!ctx.dung_pha){
    if (SINH[ctx.month_elem] === ctx.dung_elem || qhHop(ctx.dung_chi, ctx.month_branch)) c1 = 1;
    else if (KHAC[ctx.month_elem] === ctx.dung_elem) c1 = -1;
  }
  let c2 = (sm === "Vượng" || sm === "Tướng") ? 1 : -1;
  const phu = [];
  if (ctx.dung_lam_nguyet){ c2 += 1; phu.push("lam_nguyet_kien"); }
  if (ctx.dung_lam_nhat){ c2 += 1; phu.push("lam_nhat_than"); }
  const trang = {"Vượng":"vuong","Tướng":"tuong","Hưu tù":"huu_tu"}[sm];
  let dien = "Dụng thần hào " + ctx.dung_hao + " chi " + ctx.dung_chi + " (" + ctx.dung_elem
    + "); tháng " + ctx.month_branch + " (" + ctx.month_elem + ") -> " + sm + ".";
  if (ctx.dung_lam_nguyet) dien += " Dụng lâm Nguyệt kiến.";
  if (ctx.dung_lam_nhat) dien += " Dụng lâm Nhật thần.";
  return taoTinHieu("S1", ten, trang, {c1: c1, c2: c2, dienGiai: dien, canCu: "tr. 80-81",
    phu: phu, boCanh: {chi_thang: ctx.month_branch, hanh_thang: ctx.month_elem}});
}
function tinHieuS2(ctx){
  const ten = "Nguyệt phá";
  if (ctx.month_branch === null)
    return taoTinHieu("S2", ten, "thieu_du_kien",
      {dienGiai: "Chưa có chi tháng nên chưa xét được Nguyệt phá.", canCu: "tr. 82"});
  const kyPha = ctx.chu_lines.filter(ln=>ln.luc_than === ctx.dung.ky && ctx.pha_map[ln.hao]).map(ln=>ln.hao);
  const phu = kyPha.length ? ["ky_bi_pha"] : [];
  if (ctx.dung_pha)
    return taoTinHieu("S2", ten, "dung_bi_pha",
      {dienGiai: "Chi " + ctx.dung_chi + " của Dụng thần xung chi tháng " + ctx.month_branch + " -> Dụng bị Nguyệt phá.",
       canCu: "tr. 82", phu: phu});
  if (kyPha.length)
    return taoTinHieu("S2", ten, "ky_bi_pha",
      {dienGiai: "Kỵ thần ở hào " + kyPha.join(", ") + " bị Nguyệt phá nên không khắc hại được Dụng thần.",
       canCu: "tr. 82"});
  return taoTinHieu("S2", ten, "khong_pha",
    {dienGiai: "Dụng thần không bị Nguyệt phá.", canCu: "tr. 82"});
}
function tinHieuS3(ctx){
  const ten = "Nhật thần tác động lên Dụng thần";
  if (ctx.day_branch === null)
    return taoTinHieu("S3", ten, "thieu_du_kien",
      {dienGiai: "Chưa có can chi ngày nên chưa xét được Nhật thần.", canCu: "tr. 82-83"});
  const de = ctx.dung_elem, dc = ctx.dung_chi;
  const sinhFlag = SINH[ctx.day_elem] === de || qhHop(ctx.day_branch, dc);
  const khacFlag = KHAC[ctx.day_elem] === de || qhXung(ctx.day_branch, dc) || qhHinh(ctx.day_branch, dc);
  const mienTru = ctx.dung_lam_nguyet || ctx.dung_lam_nhat;
  const bo = {chi_ngay: ctx.day_branch, hanh_ngay: ctx.day_elem};
  if (khacFlag && !sinhFlag){
    if (mienTru)
      return taoTinHieu("S3", ten, "mien_tru",
        {dienGiai: "Nhật thần xung/khắc Dụng thần nhưng Dụng lâm Nguyệt kiến hoặc lâm Nhật thần nên được miễn trừ.",
         canCu: "tr. 81-83", boCanh: bo});
    return taoTinHieu("S3", ten, "nhat_khac", {c1: -1,
      dienGiai: "Ngày " + ctx.day_branch + " (" + ctx.day_elem + ") khắc/xung/hình Dụng thần.",
      canCu: "tr. 82-83", boCanh: bo});
  }
  if (sinhFlag && !khacFlag)
    return taoTinHieu("S3", ten, "nhat_sinh", {c1: 1,
      dienGiai: "Ngày " + ctx.day_branch + " (" + ctx.day_elem + ") sinh/hợp Dụng thần.",
      canCu: "tr. 82-83", boCanh: bo});
  return taoTinHieu("S3", ten, "trung_tinh",
    {dienGiai: "Nhật thần không sinh cũng không khắc Dụng thần một cách rõ rệt.",
     canCu: "tr. 82-83", boCanh: bo});
}
function tinHieuS4(ctx){
  const ten = "Ám động / Nhật phá của hào tĩnh";
  if (ctx.day_branch === null)
    return taoTinHieu("S4", ten, "thieu_du_kien",
      {dienGiai: "Chưa có can chi ngày nên chưa xét được ám động.", canCu: "tr. 84"});
  const dung = ctx.dung, found = [];
  if (!dung.phuc && !ctx.dong.has(dung.hao)){
    if (ctx.xung_khong.has(dung.hao)) found.push("dung_xung_khong");
    else if (ctx.am_dong.has(dung.hao)) found.push("dung_am_dong");
    else if (qhXung(ctx.dung_chi, ctx.day_branch)) found.push("dung_nhat_pha");
  }
  if (ctx.chu_lines.some(ln=>ln.luc_than === dung.ky && ctx.am_dong.has(ln.hao))) found.push("ky_am_dong");
  if (ctx.chu_lines.some(ln=>ln.luc_than === dung.nguyen && ctx.am_dong.has(ln.hao))) found.push("nguyen_am_dong");
  if ([...ctx.dong].some(h=>ctx.suc_manh_map[h] === "Hưu tù" && qhXung(ctx.chu_lines[h - 1].chi, ctx.day_branch)))
    found.push("dong_xung_tan");
  if (!found.length)
    return taoTinHieu("S4", ten, "khong_ap_dung",
      {dienGiai: "Không có hào tĩnh nào bị Nhật xung tới mức ám động hay nhật phá.", canCu: "tr. 84"});
  const uuTien = ["dung_xung_khong","dung_am_dong","dung_nhat_pha","ky_am_dong","nguyen_am_dong","dong_xung_tan"];
  found.sort((a,b)=>uuTien.indexOf(a) - uuTien.indexOf(b));
  const amList = [...ctx.am_dong].sort((a,b)=>a-b).map(h=>"hào " + h).join(", ");
  const xkList = [...ctx.xung_khong].sort((a,b)=>a-b).map(h=>"hào " + h).join(", ");
  return taoTinHieu("S4", ten, found[0],
    {dienGiai: "Các hào ám động: " + (amList || "không") + "; xung Không khởi động: " + (xkList || "không") + ".",
     canCu: "tr. 83-84", phu: found.slice(1)});
}
function tinHieuS5(ctx){
  const ten = "Tuần Không của Dụng thần";
  if (ctx.khong_set.size === 0)
    return taoTinHieu("S5", ten, "thieu_du_kien",
      {dienGiai: "Chưa có can chi ngày nên chưa xác định được Tuần Không.", canCu: "tr. 65, 99"});
  const dung = ctx.dung, phu = [];
  for (const [than, maPhu] of [[dung.nguyen, "nguyen_lam_khong"], [dung.ky, "ky_lam_khong"]]){
    if (than && ctx.chu_lines.some(ln=>ln.luc_than === than && ctx.khong_set.has(ln.chi))) phu.push(maPhu);
  }
  if (!ctx.khong_set.has(ctx.dung_chi))
    return taoTinHieu("S5", ten, "khong_lam_khong",
      {dienGiai: "Chi " + ctx.dung_chi + " của Dụng thần không lâm Tuần Không.", canCu: "tr. 65, 99", phu: phu});
  if (ctx.dung_khong_loai === "chan")
    return taoTinHieu("S5", ten, "chan_khong", {c2: -2,
      dienGiai: "Dụng thần chi " + ctx.dung_chi + " lâm Tuần Không và thuộc diện chân Không.",
      canCu: "tr. 65, 99", phu: phu});
  return taoTinHieu("S5", ten, "gia_khong",
    {dienGiai: "Dụng thần chi " + ctx.dung_chi + " lâm Tuần Không nhưng thuộc diện giả Không (chỉ chậm, đợi xuất Không).",
     canCu: "tr. 65, 99", phu: phu});
}
function tinHieuS6(ctx){
  const ten = "Hào động sinh/khắc Dụng thần";
  const dung = ctx.dung, de = ctx.dung_elem, dc = ctx.dung_chi;
  const sinhList = [], khacList = [];
  for (const ln of ctx.acting){
    if (!dung.phuc && ln.hao === dung.hao) continue;
    if (biVoHieu(ctx, ln).length) continue;
    const s = SINH[ln.element] === de || qhHop(ln.chi, dc);
    const k = KHAC[ln.element] === de || qhXung(ln.chi, dc);
    if (s) sinhList.push(ln.hao);
    if (k) khacList.push(ln.hao);
  }
  let trang, c1;
  if (sinhList.length && !khacList.length){ trang = "dong_sinh_dung"; c1 = 1; }
  else if (khacList.length && !sinhList.length){ trang = "dong_khac_dung"; c1 = -1; }
  else if (sinhList.length && khacList.length){ trang = "ca_hai"; c1 = 0; }
  else { trang = "khong_co"; c1 = 0; }
  const bo = {hao_sinh: sinhList.map(h=>"hào " + h).join(", "),
              hao_khac: khacList.map(h=>"hào " + h).join(", ")};
  const dien = "Hào có lực sinh Dụng: " + (bo.hao_sinh || "không")
    + "; hào có lực khắc Dụng: " + (bo.hao_khac || "không") + ".";
  return taoTinHieu("S6", ten, trang, {c1: c1, dienGiai: dien, canCu: "tr. 87, 100", boCanh: bo});
}
function tinHieuS7(ctx){
  const ten = "Dụng thần tự động và đường hóa";
  const dung = ctx.dung;
  if (dung.phuc || !ctx.dong.has(dung.hao))
    return taoTinHieu("S7", ten, "khong_tu_dong",
      {dienGiai: "Dụng thần không phải hào động nên không xét đường hóa.", canCu: "tr. 74, 92"});
  const hd = ctx.hoi_dau_map[dung.hao];
  const c1 = hd.elem_quan_he === "sinh" ? 1 : (hd.elem_quan_he === "khac" ? -1 : 0);
  const c3 = hd.tien ? 1 : (hd.thoai ? -1 : 0);
  const found = [];
  if (hd.elem_quan_he === "khac") found.push("hoi_dau_khac");
  if (hd.tien) found.push("hoa_tien");
  if (hd.thoai) found.push("hoa_thoai");
  if (hd.elem_quan_he === "sinh") found.push("hoi_dau_sinh");
  if (hd.hoa_mo) found.push("hoa_mo");
  if (hd.chi_quan_he === "xung") found.push("bien_xung");
  if (hd.chi_quan_he === "hop") found.push("bien_hop");
  if (!found.length) found.push("hoa_trung_tinh");
  const bo = {chi_bien: hd.bien_chi, hanh_bien: hd.bien_elem};
  const dien = "Dụng thần hào " + dung.hao + " chi " + ctx.dung_chi + " động, hóa chi "
    + hd.bien_chi + " (" + hd.bien_elem + ").";
  return taoTinHieu("S7", ten, found[0], {c1: c1, c3: c3, dienGiai: dien,
    canCu: "tr. 74, 87-88, 92", phu: found.slice(1), boCanh: bo});
}
function tinHieuS8(ctx){
  const ten = "Hồi đầu tác động lên Nguyên/Kỵ thần động";
  const dung = ctx.dung;
  if (!dung.nguyen && !dung.ky)
    return taoTinHieu("S8", ten, "khong_ap_dung",
      {dienGiai: "Lĩnh vực này không áp vòng Nguyên/Kỵ.", canCu: "tr. 92"});
  const found = [];
  for (const [than, tienTo] of [[dung.nguyen, "nguyen"], [dung.ky, "ky"]]){
    if (!than) continue;
    for (const ln of ctx.chu_lines){
      if (ln.luc_than === than && ctx.dong.has(ln.hao)){
        const rel = ctx.hoi_dau_map[ln.hao].elem_quan_he;
        if (rel === "khac") found.push(tienTo + "_bi_hoi_khac");
        else if (rel === "sinh") found.push(tienTo + "_hoi_sinh");
      }
    }
  }
  if (!found.length)
    return taoTinHieu("S8", ten, "khong_ap_dung",
      {dienGiai: "Nguyên/Kỵ thần không động, hoặc động nhưng không gặp hồi đầu sinh/khắc.", canCu: "tr. 92"});
  const uuTien = ["nguyen_bi_hoi_khac","ky_bi_hoi_khac","nguyen_hoi_sinh","ky_hoi_sinh"];
  found.sort((a,b)=>uuTien.indexOf(a) - uuTien.indexOf(b));
  return taoTinHieu("S8", ten, found[0],
    {dienGiai: "Hồi đầu chỉ tác động hào động sinh ra nó; kết quả đã tính vào cổng hiệu lực của S6.",
     canCu: "tr. 92", phu: found.slice(1)});
}
function tinHieuS9(ctx){
  const ten = "Quan hệ Thế - Ứng";
  const theLn = ctx.chu_lines[ctx.the - 1], ungLn = ctx.chu_lines[ctx.ung - 1];
  const bo = {chi_the: theLn.chi, chi_ung: ungLn.chi, hanh_the: theLn.element, hanh_ung: ungLn.element};
  const dien = "Thế hào " + ctx.the + " chi " + theLn.chi + " (" + theLn.element + "); Ứng hào "
    + ctx.ung + " chi " + ungLn.chi + " (" + ungLn.element + ").";
  if (qhHop(theLn.chi, ungLn.chi)){
    const diem = (ctx.linh_vuc === "xuat_hanh" || ctx.linh_vuc === "hanh_nhan") ? -1 : 1;
    return taoTinHieu("S9", ten, "hop", {c3: diem, dienGiai: dien, canCu: "tr. 85-87", boCanh: bo});
  }
  if (qhXung(theLn.chi, ungLn.chi))
    return taoTinHieu("S9", ten, "xung", {c3: -1, dienGiai: dien, canCu: "tr. 85-87", boCanh: bo});
  if (SINH[ungLn.element] === theLn.element)
    return taoTinHieu("S9", ten, "ung_sinh_the", {c3: 1, dienGiai: dien, canCu: "tr. 85-87", boCanh: bo});
  if (KHAC[ungLn.element] === theLn.element)
    return taoTinHieu("S9", ten, "ung_khac_the", {c3: -1, dienGiai: dien, canCu: "tr. 85-87", boCanh: bo});
  if (SINH[theLn.element] === ungLn.element)
    return taoTinHieu("S9", ten, "the_sinh_ung", {c3: -1, dienGiai: dien, canCu: "tr. 85-87", boCanh: bo});
  if (KHAC[theLn.element] === ungLn.element)
    return taoTinHieu("S9", ten, "the_khac_ung", {c3: 0, dienGiai: dien, canCu: "tr. 85-87", boCanh: bo});
  return taoTinHieu("S9", ten, "ty_hoa", {c3: 0, dienGiai: dien, canCu: "tr. 85-87", boCanh: bo});
}
function tinHieuS10(ctx){
  const ten = "Dụng thần phục và Phi thần";
  const dung = ctx.dung;
  if (!dung.phuc)
    return taoTinHieu("S10", ten, "khong_ap_dung",
      {dienGiai: "Dụng thần xuất hiện trong quẻ chủ, không phải phục thần.", canCu: "tr. 74"});
  const phi = dung.phi_than;
  let c2 = 0;
  const found = [];
  if (ctx.dung_pha){ found.push("phuc_bi_pha"); c2 -= 1; }
  if (phi && KHAC[phi.element] === dung.element){ found.push("phi_khac_phuc"); c2 -= 1; }
  else if (phi && SINH[phi.element] === dung.element){ found.push("phi_sinh_phuc"); c2 += 1; }
  if (ctx.khong_set.has(dung.chi)){ found.push("phuc_lam_khong"); c2 -= 1; }
  if (!found.length) found.push("phuc_trung_tinh");
  const uuTien = ["phuc_bi_pha","phi_khac_phuc","phi_sinh_phuc","phuc_lam_khong","phuc_trung_tinh"];
  found.sort((a,b)=>uuTien.indexOf(a) - uuTien.indexOf(b));
  const bo = {chi_phi: phi ? phi.chi : "", hanh_phi: phi ? phi.element : "", hao_phi: dung.hao};
  const dien = "Phục thần " + dung.than + " chi " + dung.chi + " (" + dung.element + ") phục dưới hào " + dung.hao
    + (phi ? "; Phi thần là hào mang chi " + phi.chi + " (" + phi.element + ")." : ".");
  return taoTinHieu("S10", ten, found[0], {c2: c2, dienGiai: dien,
    canCu: "tr. 74, 81-82", phu: found.slice(1), boCanh: bo});
}
function tinHieuS11(ctx){
  const ten = "Nhập mộ";
  const dung = ctx.dung;
  let forms;
  if (dung.phuc){
    forms = (ctx.day_branch === MO_THEO_HANH[dung.element] || ctx.month_branch === MO_THEO_HANH[dung.element])
      ? ["ngay_thang"] : [];
  } else {
    forms = ctx.nhap_mo_map[dung.hao] || [];
  }
  const phu = [];
  if (dung.ky && ctx.chu_lines.some(ln=>ln.luc_than === dung.ky && (ctx.nhap_mo_map[ln.hao] || []).length))
    phu.push("ky_nhap_mo");
  if (ctx.the !== dung.hao && (ctx.nhap_mo_map[ctx.the] || []).length) phu.push("the_nhap_mo");
  if (!forms.length)
    return taoTinHieu("S11", ten, "khong_nhap_mo",
      {dienGiai: "Dụng thần không nhập mộ.", canCu: "tr. 96-98", phu: phu});
  const biKhac = (ctx.month_elem !== null && KHAC[ctx.month_elem] === dung.element)
    || (ctx.day_elem !== null && KHAC[ctx.day_elem] === dung.element)
    || ctx.chu_lines.some(ln=>ctx.phat_dong.has(ln.hao) && ln.hao !== dung.hao && KHAC[ln.element] === dung.element);
  if (ctx.dung_suc_manh === "Vượng" || ctx.dung_suc_manh === "Tướng")
    return taoTinHieu("S11", ten, "dung_nhap_mo_vuong",
      {dienGiai: "Dụng thần nhập mộ (dạng " + forms.join(", ") + ") nhưng đang vượng tướng nên chỉ là cản trở trước mắt, đợi ngày xung Mộ.",
       canCu: "tr. 96-98", phu: phu});
  if (ctx.dung_suc_manh === "Hưu tù" || biKhac)
    return taoTinHieu("S11", ten, "dung_nhap_mo_huu", {c2: -1,
      dienGiai: "Dụng thần nhập mộ (dạng " + forms.join(", ") + ") trong lúc hưu tù hoặc bị khắc.",
      canCu: "tr. 96-98", phu: phu});
  return taoTinHieu("S11", ten, "dung_nhap_mo_vuong",
    {dienGiai: "Dụng thần nhập mộ (dạng " + forms.join(", ") + "); thiếu dữ kiện tháng nên chưa kết luận nặng.",
     canCu: "tr. 96-98", phu: phu});
}
function tinHieuS12(ctx){
  const ten = "Lục hợp quẻ / Lục xung quẻ và chiều biến";
  const chuNum = ctx.chu.number, bienNum = ctx.bien.number;
  const chuLoai = LUC_XUNG_HEX_SET.has(chuNum) ? "xung" : (laLucHopQue(ctx.chu_lines) ? "hop" : null);
  const bienLoai = LUC_XUNG_HEX_SET.has(bienNum) ? "xung" : (laLucHopQue(ctx.bien_lines) ? "hop" : null);
  const loaiTxt = l => l === "xung" ? "lục xung" : (l === "hop" ? "lục hợp" : "thường");
  const dien = "Quẻ chủ " + ctx.chu.name + " (" + loaiTxt(chuLoai) + "); quẻ biến "
    + ctx.bien.name + " (" + loaiTxt(bienLoai) + ").";
  // Trục bệnh MỚI / bệnh LÂU của mục XVI (tr. 232-254) — đảo ngược nhau.
  // Chỉ áp khi người hỏi khai rõ benh_moi và quẻ chủ không rơi vào chiều
  // biến hợp<->xung (chiều biến vẫn chấm theo quy tắc chung ở dưới).
  if (ctx.linh_vuc === "suc_khoe" && ctx.benh_moi !== null && ctx.benh_moi !== undefined
      && !(chuLoai && bienLoai && chuLoai !== bienLoai)){
    if (chuLoai === "xung" && ctx.benh_moi){
      const phu = ctx.khong_set.has(ctx.dung_chi) ? ["dung_khong_gap_xung"] : [];
      return taoTinHieu("S12", ten, "benh_moi_luc_xung", {c3: 1,
        dienGiai: dien + " Bệnh mới gặp lục xung quẻ: xung là tán bệnh, uống thuốc sẽ khỏi."
          + (phu.length ? " Dụng thần lâm Tuần Không gặp xung khởi động cũng theo hướng khỏi." : ""),
        canCu: "mục XVI, tr. 232-254", phu: phu});
    }
    if (chuLoai === "xung")
      return taoTinHieu("S12", ten, "benh_lau_luc_xung", {c3: -1,
        dienGiai: dien + " Bệnh lâu gặp lục xung quẻ: xung tán cả bệnh lẫn người bệnh — chiều hướng rất xấu (có chốt cứng riêng ở phần tổng hợp).",
        canCu: "mục XVI, tr. 232-254"});
    if (chuLoai === "hop" && ctx.benh_moi)
      return taoTinHieu("S12", ten, "benh_moi_luc_hop", {c3: -1,
        dienGiai: dien + " Bệnh mới gặp lục hợp quẻ: hợp là giữ lại, bệnh dễ kéo dài.",
        canCu: "mục XVI, tr. 232-254"});
    if (chuLoai === "hop")
      return taoTinHieu("S12", ten, "benh_lau_luc_hop", {c3: 1,
        dienGiai: dien + " Bệnh lâu gặp lục hợp quẻ: hợp giữ được người bệnh, chiều hướng sẽ khỏi.",
        canCu: "mục XVI, tr. 232-254"});
  }
  if (chuLoai === "hop" && bienLoai === "xung")
    return taoTinHieu("S12", ten, "hop_bien_xung", {c3: -1, dienGiai: dien, canCu: "tr. 85-87"});
  if (chuLoai === "xung" && bienLoai === "hop")
    return taoTinHieu("S12", ten, "xung_bien_hop", {c3: 1, dienGiai: dien, canCu: "tr. 85-87"});
  if (chuLoai === "xung")
    return taoTinHieu("S12", ten, "luc_xung_que", {dienGiai: dien, canCu: "tr. 86-87"});
  if (chuLoai === "hop")
    return taoTinHieu("S12", ten, "luc_hop_que", {dienGiai: dien, canCu: "tr. 85-86"});
  return taoTinHieu("S12", ten, "trung_tinh", {dienGiai: dien, canCu: "tr. 85-87"});
}
function tinHieuS13(ctx){
  const ten = "Tam hợp cục";
  const dung = ctx.dung;
  let c3 = 0;
  const found = [];
  let huNote = false;
  for (const r of ctx.cuc_results){
    if (r.hu){ huNote = true; continue; }
    if (r.hoa){
      if (SINH[r.elem] === ctx.dung_elem || r.chis.includes(ctx.dung_chi)){
        c3 += 1;
        found.push(r.chis.includes(ctx.dung_chi) ? "dung_trong_cuc" : "cuc_sinh_dung");
      }
      if (KHAC[r.elem] === ctx.dung_elem
          && [dung.ky, dung.cuu].includes(lucThan(ctx.palace_elem, r.elem))){
        c3 -= 1;
        found.push("cuc_khac_dung");
      }
    } else {
      if (r.chis.includes(ctx.dung_chi)){ c3 -= 1; found.push("dung_bi_quan"); }
      if (dung.ky && ctx.chu_lines.some(ln=>ln.luc_than === dung.ky && r.chis.includes(ln.chi))){
        c3 += 1;
        found.push("ky_bi_quan");
      }
    }
  }
  if (!found.length){
    const trang = huNote ? "hu_cuc" : "khong_co_cuc";
    return taoTinHieu("S13", ten, trang,
      {dienGiai: huNote ? "Có bộ ba còn thiếu một chi (hư cục), chỉ ghi chú, không chấm điểm."
                        : "Không có tam hợp cục nào thành.",
       canCu: "tr. 87-89"});
  }
  const nhomDuong = ["cuc_sinh_dung", "dung_trong_cuc", "ky_bi_quan"];
  let chinh = found.find(f=>(c3 > 0) === nhomDuong.includes(f));
  if (chinh === undefined) chinh = found[0];
  const phu = found.filter(f=>f !== chinh).concat(huNote ? ["hu_cuc"] : []);
  const moTa = ctx.cuc_results.filter(r=>!r.hu)
    .map(r=>r.elem + " cục (" + [...r.chis].sort().join(", ") + ") " + (r.hoa ? "hóa cục" : "hợp quấn"))
    .join("; ");
  return taoTinHieu("S13", ten, chinh, {c3: c3, dienGiai: "Các cục thành: " + moTa + ".",
    canCu: "tr. 87-89", phu: phu, boCanh: {hanh_cuc: ctx.cuc_results[0].elem}});
}
function biHinhChi(ctx, hao, chi){
  const others = ctx.chu_lines.filter(ln=>ln.hao !== hao).map(ln=>ln.chi);
  for (const ref of [ctx.day_branch, ctx.month_branch]) if (ref) others.push(ref);
  if (chi === "Tý" || chi === "Mão"){
    const other = chi === "Tý" ? "Mão" : "Tý";
    if (others.includes(other)) return true;
  }
  for (const bo of BO_BA_HINH){
    if (bo.includes(chi) && bo.every(c=>c === chi || others.includes(c))) return true;
  }
  if (TU_HINH_SET.has(chi) && (ctx.day_branch === chi || ctx.month_branch === chi)) return true;
  return false;
}
function tinHieuS14(ctx){
  const ten = "Tam hình";
  const dung = ctx.dung;
  const dungHinh = dung.phuc ? false : biHinhChi(ctx, dung.hao, ctx.dung_chi);
  const theLn = ctx.chu_lines[ctx.the - 1];
  const theHinh = biHinhChi(ctx, ctx.the, theLn.chi);
  let ghi = "";
  if (dungHinh && (qhHop(ctx.dung_chi, ctx.day_branch || "") || qhHop(ctx.dung_chi, ctx.month_branch || "")))
    ghi = " Hào bị hình đồng thời được hợp giữ nên hình giảm nhẹ (tham hợp quên hình) — điểm vẫn tính theo Mục C.";
  if (dungHinh)
    return taoTinHieu("S14", ten, "dung_bi_hinh", {c3: -1,
      dienGiai: "Dụng thần rơi vào quan hệ tam hình." + ghi, canCu: "tr. 90-91"});
  if (theHinh)
    return taoTinHieu("S14", ten, "the_bi_hinh", {c3: -1,
      dienGiai: "Hào Thế rơi vào quan hệ tam hình.", canCu: "tr. 90-91"});
  return taoTinHieu("S14", ten, "khong_hinh",
    {dienGiai: "Dụng thần và hào Thế không bị tam hình.", canCu: "tr. 90-91"});
}
function tinHieuS15(ctx){
  const ten = "Phản ngâm / Phục ngâm";
  const dung = ctx.dung, chu = ctx.chu, bien = ctx.bien;
  const phanQuai = ctx.dong.size > 0 && (
    PHAN_NGAM_TRI[chu.upper] === bien.upper || PHAN_NGAM_TRI[chu.lower] === bien.lower);
  const phanHao = [...ctx.dong].some(h=>qhXung(ctx.chu_lines[h - 1].chi, ctx.bien_lines[h - 1].chi));
  const phan = phanQuai || phanHao;
  const dungPhanHao = !dung.phuc && ctx.dong.has(dung.hao)
    && qhXung(ctx.dung_chi, ctx.bien_lines[dung.hao - 1].chi);
  const dungHoiKhac = !dung.phuc && ctx.dong.has(dung.hao)
    && ctx.hoi_dau_map[dung.hao].elem_quan_he === "khac";
  const chuChis = ctx.chu_lines.map(ln=>ln.chi), bienChis = ctx.bien_lines.map(ln=>ln.chi);
  const phucHa = bien.lower !== chu.lower
    && JSON.stringify(bienChis.slice(0, 3)) === JSON.stringify(chuChis.slice(0, 3));
  const phucThuong = bien.upper !== chu.upper
    && JSON.stringify(bienChis.slice(3)) === JSON.stringify(chuChis.slice(3));
  const phucLienQuan = (phucHa && (dung.hao <= 3 || ctx.the <= 3))
    || (phucThuong && (dung.hao >= 4 || ctx.the >= 4));
  let c3 = 0;
  if (phan) c3 += (dungPhanHao || dungHoiKhac) ? -2 : -1;
  if (phucLienQuan) c3 -= 1;
  let trang;
  if (dungPhanHao || (phan && dungHoiKhac)) trang = "phan_ngam_dung";
  else if (phan) trang = "phan_ngam";
  else if (phucHa || phucThuong) trang = "phuc_ngam";
  else trang = "khong_ngam";
  const dien = "Phản ngâm quái: " + (phanQuai ? "có" : "không") + "; phản ngâm hào: "
    + (phanHao ? "có" : "không") + "; phục ngâm nội quái: " + (phucHa ? "có" : "không")
    + ", ngoại quái: " + (phucThuong ? "có" : "không") + ".";
  return taoTinHieu("S15", ten, trang, {c3: c3, dienGiai: dien, canCu: "tr. 93-95"});
}
function tinHieuS16(ctx){
  const ten = "Lục Thú phụ trợ";
  const dung = ctx.dung;
  const theLn = ctx.chu_lines[ctx.the - 1];
  const quanDong = ctx.chu_lines.some(ln=>ln.luc_than === "Quan Quỷ" && ctx.dong.has(ln.hao));
  if (theLn.luc_thu === "Chu Tước" && quanDong)
    return taoTinHieu("S16", ten, "the_chu_tuoc_quan_dong",
      {dienGiai: "Hào Thế lâm Chu Tước và có Quan Quỷ phát động: tín hiệu khẩu thiệt, giấy tờ, kiện cáo (Q34). Chỉ ghi chú, không chấm điểm.",
       canCu: "tr. 132; Q34"});
  if (ctx.linh_vuc === "suc_khoe" && !dung.phuc){
    const dungLn = ctx.chu_lines[dung.hao - 1];
    if (dungLn.luc_thu === "Bạch Hổ")
      return taoTinHieu("S16", ten, "dung_lam_bach_ho",
        {dienGiai: "Dụng thần xem bệnh lâm Bạch Hổ — đây là căn cứ ưu tiên chọn Dụng (Q05), không phải điểm số.",
         canCu: "tr. 71; Q05"});
  }
  return taoTinHieu("S16", ten, "khong_ap_dung",
    {dienGiai: "Không có tín hiệu Lục Thú nào thuộc hai điểm có dữ kiện sách rõ ở tầng cơ bản.",
     canCu: "tr. 71, 132"});
}
const CAC_TIN_HIEU = [tinHieuS1, tinHieuS2, tinHieuS3, tinHieuS4, tinHieuS5, tinHieuS6,
                      tinHieuS7, tinHieuS8, tinHieuS9, tinHieuS10, tinHieuS11, tinHieuS12,
                      tinHieuS13, tinHieuS14, tinHieuS15, tinHieuS16];

// --------------------------------------- Gốc rễ Tử Tôn (buôn bán, A2)
// Mirror của _goc_re_tu_ton trong luan_co_ban.py (mục XIV, tr. 211-214).
// Trả [ma, mo_ta] với ma ∈ {"co_re", "mat_re", "chua_ro"}.
function gocReTuTon(ctx){
  const tuLines = ctx.chu_lines.filter(ln=>ln.luc_than === "Tử Tôn");
  if (tuLines.length){
    const coLuc = ln => ((ctx.suc_manh_map[ln.hao] === "Vượng" || ctx.suc_manh_map[ln.hao] === "Tướng")
        && !ctx.pha_map[ln.hao])
      || (ctx.phat_dong.has(ln.hao) && ctx.khong_loai_map[ln.hao] !== "chan")
      || ln.chi === ctx.month_branch || ln.chi === ctx.day_branch;
    const thatHam = ln => ctx.suc_manh_map[ln.hao] === "Hưu tù" && (
      ctx.khong_loai_map[ln.hao] === "chan" || ctx.pha_map[ln.hao]
      || (ctx.nhap_mo_map[ln.hao] || []).length > 0);
    const luc = tuLines.filter(coLuc);
    if (luc.length){
      const ln = luc[0];
      return ["co_re", "Tử Tôn hào " + ln.hao + " chi " + ln.chi
        + " có lực (vượng tướng, phát động hoặc lâm Nhật Nguyệt)"];
    }
    if (tuLines.every(thatHam)){
      const haos = tuLines.map(ln=>ln.hao).join(", ");
      return ["mat_re", "Tử Tôn (hào " + haos + ") đều hưu tù và thất hãm "
        + "(lâm chân Không, bị Nguyệt phá hoặc nhập mộ)"];
    }
    return ["chua_ro", ""];
  }
  for (const e of ctx.chu.an_que.phuc_than){
    if (e.luc_than !== "Tử Tôn") continue;
    const sm = vuongTuong(e.element, ctx.month_branch);
    const phiKhac = !!e.phi_than && KHAC[e.phi_than.element] === e.element;
    const lamKhong = ctx.khong_set.has(e.chi);
    const pha = biPhaBoiThang(ctx, e.chi);
    if (sm === "Hưu tù" && (phiKhac || lamKhong || pha)){
      const lyDo = [];
      if (phiKhac) lyDo.push("bị Phi thần " + e.phi_than.chi + " khắc");
      if (lamKhong) lyDo.push("lâm Tuần Không");
      if (pha) lyDo.push("bị Nguyệt phá");
      return ["mat_re", "Tử Tôn phục tàng dưới hào " + e.hao + " chi " + e.chi
        + " đang hưu tù và " + lyDo.join(", ") + " — căn nguyên thất hãm"];
    }
    if ((sm === "Vượng" || sm === "Tướng") && !phiKhac && !lamKhong && !pha)
      return ["co_re", "Tử Tôn phục dưới hào " + e.hao + " chi " + e.chi
        + " vẫn vượng tướng"];
    return ["chua_ro", ""];
  }
  return ["chua_ro", ""];
}

// ------------------------------------------------------------ Tổng hợp
function luanCoBan(ketQua, linhVuc, opts){
  opts = opts || {};
  const ctx = taoNguCanh(ketQua, opts);
  ctx.linh_vuc = linhVuc;
  ctx.benh_moi = opts.benhMoi ?? null;
  const dung = chonDungThan(ketQua, linhVuc, {
    gioiTinh: opts.gioiTinh, quanHe: opts.quanHe, hienTuong: opts.hienTuong,
    loaiVat: opts.loaiVat, loaiThi: opts.loaiThi, tieuMuc: opts.tieuMuc,
    dayStem: ctx.day_stem, dayBranch: ctx.day_branch, monthBranch: ctx.month_branch});
  chuanBiLuan(ctx, dung);
  const tinHieu = CAC_TIN_HIEU.map(f=>f(ctx));
  const byMa = {};
  for (const s of tinHieu) byMa[s.ma] = s;
  const c1ChiTiet = {nguyet: byMa.S1.dong_gop.C1, nhat: byMa.S3.dong_gop.C1,
                     dong_hao: byMa.S6.dong_gop.C1, hoi_dau: byMa.S7.dong_gop.C1};
  const c1 = c1ChiTiet.nguyet + c1ChiTiet.nhat + c1ChiTiet.dong_hao + c1ChiTiet.hoi_dau;
  const c2 = tinHieu.reduce((t, s)=>t + s.dong_gop.C2, 0);
  const c3 = tinHieu.reduce((t, s)=>t + s.dong_gop.C3, 0);
  const tong = c1 + c2 + c3;

  const chotCung = [];
  if (ctx.dung_pha)
    chotCung.push("Dụng thần bị Nguyệt phá -> KHÓ (tr. 82: hào bị phá coi như vô dụng, được sinh cũng không cứu được).");
  if (ctx.dung_khong_loai === "chan" && ctx.dung_suc_manh === "Hưu tù")
    chotCung.push("Dụng thần lâm chân Không lại đang hưu tù -> KHÓ.");
  if (dung.phuc && dung.phi_than && KHAC[dung.phi_than.element] === dung.element
      && ctx.khong_set.has(dung.chi))
    chotCung.push("Phục thần bị Phi thần khắc lại lâm Tuần Không -> KHÓ.");
  // --- Chốt cứng riêng theo lĩnh vực (mục chuyên đề Chương XII)
  const gocRe = linhVuc === "kinh_doanh" ? gocReTuTon(ctx) : null;
  if (linhVuc === "thi_cu"){
    const lyDo = [];
    const tuDong = ctx.chu_lines.filter(ln=>ln.luc_than === "Tử Tôn"
      && ctx.phat_dong.has(ln.hao)).map(ln=>ln.hao);
    const taiDong = ctx.chu_lines.filter(ln=>ln.luc_than === "Thê Tài"
      && ctx.phat_dong.has(ln.hao)).map(ln=>ln.hao);
    const theLn = ctx.chu_lines[ctx.the - 1];
    if (tuDong.length)
      lyDo.push("Tử Tôn phát động (hào " + tuDong.join(", ") + ") khắc Quan Quỷ");
    if (taiDong.length)
      lyDo.push("Thê Tài phát động (hào " + taiDong.join(", ") + ") làm phân tán đường công danh");
    if (theLn.luc_than === "Tử Tôn" || theLn.luc_than === "Thê Tài")
      lyDo.push(theLn.luc_than + " trì Thế");
    let tuElem = null;
    for (const cuc of TAM_HOP_CUC)
      if (lucThan(ctx.palace_elem, cuc[0]) === "Tử Tôn") tuElem = cuc[0];
    if (tuElem && ctx.cuc_results.some(r=>!r.hu && r.elem === tuElem))
      lyDo.push("Tử Tôn thành tam hợp " + tuElem + " cục");
    if (lyDo.length)
      chotCung.push("Thi cử: " + lyDo.join("; ")
        + " -> KHÓ (không đậu — mục V phần 3, tr. 157-165).");
  }
  if (gocRe !== null && gocRe[0] === "mat_re")
    chotCung.push("Buôn bán: " + gocRe[1]
      + " -> KHÓ (Tài không có gốc rễ: giá dù thấp cũng không nên mua vào/trữ hàng — mục XIV, tr. 211-214).");
  if (linhVuc === "suc_khoe" && ctx.benh_moi === false
      && LUC_XUNG_HEX_SET.has(ctx.chu.number))
    chotCung.push("Bệnh lâu gặp quẻ lục xung -> KHÓ (bệnh bất trị: dụng thần dù lâm Nhật Nguyệt hay được động hào sinh cũng khó cứu — mục XVI, tr. 232-254).");
  let ketLuan;
  if (chotCung.length) ketLuan = "Khó";
  else if (tong >= 3) ketLuan = "Thuận";
  else if (tong <= -3) ketLuan = "Khó";
  else ketLuan = "Trung tính";
  const ghiChu = [...dung.ghi_chu];
  if (gocRe !== null && gocRe[0] === "co_re")
    ghiChu.push("Buôn bán: " + gocRe[1] + " — Tài có gốc rễ (mục XIV, tr. 211-214).");
  if (!chotCung.length && ketLuan === "Khó" && ctx.dung_lam_nguyet && c1 >= 0){
    ketLuan = "Trung tính";
    ghiChu.push("Dụng thần lâm Nguyệt kiến và điểm 4 nguồn không âm nên kết luận được nâng lên Trung tính (tr. 81: lâm Nguyệt kiến gặp thương vô hại).");
  }

  let chinh = tinHieu.filter(s=>s.diem !== 0)
    .sort((a, b)=>Math.abs(b.diem) - Math.abs(a.diem)).map(s=>s.ma);
  for (const [ma, dieuKien] of [["S2", ctx.dung_pha],
                                ["S5", ctx.dung_khong_loai === "chan"],
                                ["S10", dung.phuc]]){
    if (dieuKien && !chinh.includes(ma)) chinh.unshift(ma);
  }
  chinh = chinh.slice(0, 5);
  if (!chinh.length) chinh = ["S1"];

  const ketQuaLuan = {
    linh_vuc: linhVuc, nhan_linh_vuc: dung.nhan,
    ten_que_chu: ctx.chu.name, ten_que_bien: ctx.bien.name,
    co_bien: ctx.dong.size > 0,
    dung_than: dung, tin_hieu: tinHieu,
    diem: {C1: {...c1ChiTiet, tong: c1}, C2: c2, C3: c3, tong: tong},
    chot_cung: chotCung, ket_luan: ketLuan,
    tin_hieu_chinh: chinh,
    ghi_chu: ghiChu.concat(dung.canh_bao),
  };
  ketQuaLuan.van_ban = soanVanBan(ketQuaLuan);
  return ketQuaLuan;
}

// ------------------------------------------------------------ Soạn văn bản
function taiMauCau(){
  return (typeof DATA !== "undefined" && DATA.cauLuan) ? DATA.cauLuan : null;
}
function _fmtStr(tpl, fmt){
  return tpl.replace(/\{(\w+)\}/g, (m, k)=>
    Object.prototype.hasOwnProperty.call(fmt, k) ? String(fmt[k]) : "");
}
function renderMau(mauList, fmt, idx){
  if (!mauList) return "";
  if (typeof mauList === "string") return _fmtStr(mauList, fmt);
  if (!mauList.length) return "";
  return _fmtStr(mauList[idx % mauList.length], fmt);
}
function soanVanBan(luan, mau){
  if (mau === undefined || mau === null) mau = taiMauCau();
  const dung = luan.dung_than;
  const fmt = {
    ten_que: luan.ten_que_chu, ten_que_bien: luan.ten_que_bien,
    linh_vuc: luan.nhan_linh_vuc, than_dung: dung.than,
    hao_dung: dung.hao, chi_dung: dung.chi, hanh_dung: dung.element,
    tong: luan.diem.tong, ket_luan: luan.ket_luan,
  };
  const doan = [];
  const moKey = dung.phuc ? "phuc" : (dung.the_la_dung ? "the" : "thuong");
  let mo = renderMau(mau.mo_dau[moKey], fmt, dung.hao);
  if (luan.co_bien) mo += " " + renderMau(mau.mo_dau.bien, fmt, dung.hao);
  doan.push(mo);

  const byMa = {};
  for (const s of luan.tin_hieu) byMa[s.ma] = s;
  const cau = [];
  for (const ma of luan.tin_hieu_chinh){
    const s = byMa[ma];
    const f2 = {...fmt, ...s.bo_canh};
    const tpl = ((mau.tin_hieu || {})[ma] || {})[s.trang_thai];
    if (tpl) cau.push(renderMau(tpl, f2, dung.hao));
    for (const phu of s.phu){
      const tplPhu = ((mau.tin_hieu || {})[ma] || {})[phu];
      if (tplPhu) cau.push(renderMau(tplPhu, f2, dung.hao + 1));
    }
  }
  if (cau.length) doan.push(cau.join(" "));
  else doan.push(renderMau(mau.chung.it_tin_hieu, fmt, 0));

  const klKey = {"Thuận": "thuan", "Trung tính": "trung_tinh", "Khó": "kho"}[luan.ket_luan];
  let ket = renderMau(mau.ket_luan[klKey], fmt, dung.hao);
  if (luan.chot_cung.length) ket += " " + renderMau(mau.chung.co_chot_cung, fmt, 0);
  ket += " " + renderMau(mau.chung.diem_so, fmt, 0);
  doan.push(ket);
  return doan.filter(p=>p).join("\n\n");
}
export { chonDungThan, luanCoBan, soanVanBan, vuongTuong, LINH_VUC };
