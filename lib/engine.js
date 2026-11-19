// Engine gieo quẻ — port ESM nguyên văn từ gieo-que-engine/demo/engine_logic.js
// (bản JS port 1-1 từ gieo_que.py). Chỉ đổi cơ chế module, không đổi luật.
import { DATA } from "./engine-data.js";
const SINH = {"Mộc":"Hỏa","Hỏa":"Thổ","Thổ":"Kim","Kim":"Thủy","Thủy":"Mộc"};
const KHAC = {"Mộc":"Thổ","Thổ":"Thủy","Thủy":"Hỏa","Hỏa":"Kim","Kim":"Mộc"};
const BEASTS = ["Thanh Long","Chu Tước","Câu Trần","Đằng Xà","Bạch Hổ","Huyền Vũ"];
const BEAST_START = {"Giáp":0,"Ất":0,"Bính":1,"Đinh":1,"Mậu":2,"Kỷ":3,"Canh":4,"Tân":4,"Nhâm":5,"Quý":5};
const COIN_MAP = {6:[0,true],7:[1,false],8:[0,false],9:[1,true]};
const MAIHOA_BY_NUM = {1:"Càn",2:"Đoài",3:"Ly",4:"Chấn",5:"Tốn",6:"Khảm",7:"Cấn",8:"Khôn"};

function trigramOf(bits){ return DATA.trigrams[bits.join(",")]; } // [tên, ngũ hành]
function hexFromBits(bits){
  const low = trigramOf(bits.slice(0,3))[0], up = trigramOf(bits.slice(3,6))[0];
  const [num, name] = DATA.hexByTrigrams[up + "|" + low];
  return {number:num, name:name, upper:up, lower:low, bits:[...bits]};
}
function lucThan(palaceElem, lineElem){
  if (lineElem === palaceElem) return "Huynh Đệ";
  if (SINH[palaceElem] === lineElem) return "Tử Tôn";
  if (SINH[lineElem] === palaceElem) return "Phụ Mẫu";
  if (KHAC[palaceElem] === lineElem) return "Thê Tài";
  return "Quan Quỷ";
}
function lucThu(dayStem){
  const s = BEAST_START[dayStem];
  return Array.from({length:6}, (_,i)=>BEASTS[(s+i)%6]);
}
function tuanKhong(dayStem, dayBranch){
  let idx = -1;
  for (let i=0;i<60;i++) if (DATA.stems[i%10]===dayStem && DATA.branches[i%12]===dayBranch) { idx=i; break; }
  if (idx<0) throw new Error("Can Chi không hợp lệ: " + dayStem + " " + dayBranch);
  const start = idx - (idx%10), covered = new Set();
  for (let k=0;k<10;k++) covered.add(DATA.branches[(start+k)%12]);
  return DATA.branches.filter(b=>!covered.has(b));
}
// ------------------------------------------------------- Vòng Trường Sinh
// Port từ gieo_que.py (Sơ cấp tr.63–64): 12 giai đoạn an theo từng hào, dùng
// tam hợp cục của hành của hào — Thủy khởi tại Thân, Kim tại Tị, Hỏa tại Dần,
// Mộc tại Hợi; Thổ không có cục riêng → an theo Thủy cục (khởi tại Thân).
const TS_STAGES = ["Trường Sinh","Mộc Dục","Quan Đới","Lâm Quan","Đế Vượng","Suy","Bệnh","Tử","Mộ","Tuyệt","Thai","Dưỡng"];
const TS_START = {"Thủy":"Thân","Kim":"Tỵ","Hỏa":"Dần","Mộc":"Hợi","Thổ":"Thân"};
let _tsTable = null;
function tsTable(){
  if (_tsTable) return _tsTable;
  _tsTable = {};
  for (const el in TS_START){
    const i0 = DATA.branches.indexOf(TS_START[el]);
    _tsTable[el] = {};
    TS_STAGES.forEach((st,k)=>{ _tsTable[el][DATA.branches[(i0+k)%12]] = st; });
  }
  return _tsTable;
}
function truongSinhStage(element, branch){ return tsTable()[element][branch]; }
function truongSinhChi(element, stage){
  const t = tsTable()[element];
  for (const chi in t) if (t[chi]===stage) return chi;
  return null;
}
function haoThai(aq){
  // Hào Thai (Trung cấp Ch.II): hào mang chi ở bậc Thai trong vòng của hành
  // Tử Tôn (hành do cung sinh ra); xét cả hào chính lẫn phục thần.
  const tuElem = SINH[aq.palace_element];
  const thaiChi = truongSinhChi(tuElem, "Thai");
  const hits = [];
  for (const ln of aq.lines) if (ln.chi===thaiChi) hits.push({hao:ln.hao, loai:"chinh"});
  for (const p of (aq.phuc_than||[])) if (p.chi===thaiChi) hits.push({hao:p.hao, loai:"phuc"});
  return {tu_ton_element:tuElem, thai_chi:thaiChi, hao:hits};
}
function anQue(hex, dayStem, thanPalaceElem){
  const [pname, pelem, the, loai] = DATA.palaceOf[hex.number];
  const thanElem = (thanPalaceElem !== undefined && thanPalaceElem !== null) ? thanPalaceElem : pelem;
  const ung = the <= 3 ? the + 3 : the - 3;
  const cans = [DATA.napCan[hex.lower][0],DATA.napCan[hex.lower][0],DATA.napCan[hex.lower][0],
                DATA.napCan[hex.upper][1],DATA.napCan[hex.upper][1],DATA.napCan[hex.upper][1]];
  const chis = [...DATA.napChi[hex.lower][0], ...DATA.napChi[hex.upper][1]];
  const beasts = dayStem ? lucThu(dayStem) : Array(6).fill(null);
  const lines = chis.map((chi,i)=>{ const elem = DATA.chiElement[chi]; return {
    hao:i+1, bit:hex.bits[i], can:cans[i], chi:chi, element:elem,
    ts_chi:truongSinhStage(elem, chi),
    luc_than:lucThan(thanElem, elem), luc_thu:beasts[i],
    the:i+1===the, ung:i+1===ung, khong:null, phuc_than:null }; });
  return {palace:pname, palace_element:pelem, loai:loai, the:the, ung:ung, lines:lines, phuc_than:[]};
}
// ------------------------------------------------------- Phục thần / Phi thần
// Port từ gieo_que.py (an_phuc_than): Lục Thân nào KHÔNG xuất hiện trong 6 hào
// quẻ chủ thì "phục" — lấy can chi của hào mang Lục Thân đó trong BẢN CUNG QUẺ
// (quẻ thuần của cung quẻ chủ), phục DƯỚI hào quẻ chủ có CÙNG số hào; hào quẻ
// chủ tại vị trí đó là phi thần. Chỉ an cho quẻ chủ.
const PALACE_PURE_NUMBER = {"Càn":1,"Khôn":2,"Chấn":51,"Tốn":57,"Khảm":29,"Ly":30,"Cấn":52,"Đoài":58};
const LUC_THAN_ALL = ["Phụ Mẫu","Huynh Đệ","Quan Quỷ","Thê Tài","Tử Tôn"];
function banCungAnQue(palaceName){
  const [name, up, low] = DATA.hexByNumber[PALACE_PURE_NUMBER[palaceName]];
  const bits = [...DATA.trigramByName[low][0], ...DATA.trigramByName[up][0]];
  return anQue(hexFromBits(bits), null);
}
function anPhucThan(aq){
  const present = new Set(aq.lines.map(l=>l.luc_than));
  const missing = LUC_THAN_ALL.filter(t=>!present.has(t));
  const summary = [];
  if (missing.length){
    const banCung = banCungAnQue(aq.palace);
    for (const than of missing){
      for (const bl of banCung.lines){
        if (bl.luc_than !== than) continue;
        const pos = bl.hao, phi = aq.lines[pos-1];
        const phuc = {luc_than:than, can:bl.can, chi:bl.chi, element:bl.element};
        phi.phuc_than = phuc;
        summary.push({...phuc, hao:pos, phi_than:{hao:phi.hao, can:phi.can, chi:phi.chi, element:phi.element, luc_than:phi.luc_than}});
      }
    }
  }
  aq.phuc_than = summary;
  return aq;
}
function lapQueLucHao(coinSums, dayStem, dayBranch, monthBranch){
  if (coinSums.length!==6 || coinSums.some(v=>!(v in COIN_MAP))) throw new Error("Cần đúng 6 lần tung, mỗi lần 6..9");
  if (monthBranch !== undefined && monthBranch !== null && !DATA.branches.includes(monthBranch))
    throw new Error("Chi tháng không hợp lệ: " + monthBranch);
  const bits=[], dong=[];
  coinSums.forEach((v,i)=>{ const [bit,isDong]=COIN_MAP[v]; bits.push(bit); if(isDong) dong.push(i+1); });
  const chu = hexFromBits(bits);
  const bien = hexFromBits(bits.map((b,i)=> dong.includes(i+1) ? b^1 : b));
  const ho = hexFromBits([bits[1],bits[2],bits[3],bits[2],bits[3],bits[4]]);
  const chuAn = anQue(chu, dayStem);
  anPhucThan(chuAn); // phục/phi thần chỉ an cho quẻ chủ (như gieo_que.py)
  // Lục Thân quẻ biến tính theo cung QUẺ CHỦ (sách Sơ cấp tr.77) — khớp bản sửa gieo_que.py
  const out = {coin_sums:[...coinSums], hao_dong:dong,
    day_stem: dayStem === undefined ? null : dayStem,
    day_branch: dayBranch === undefined ? null : dayBranch,
    month_branch: monthBranch === undefined ? null : monthBranch,
    que_chu:{...chu, an_que:chuAn},
    que_bien:{...bien, an_que:anQue(bien, dayStem, chuAn.palace_element)}, que_ho:ho};
  if (dayStem && dayBranch){
    const khong = tuanKhong(dayStem, dayBranch); out.tuan_khong = khong;
    for (const sect of ["que_chu","que_bien"]) for (const ln of out[sect].an_que.lines) ln.khong = khong.includes(ln.chi);
  }
  // Vòng Trường Sinh tại Nhật thần / Nguyệt kiến (Sơ cấp tr.64, quẻ mẫu Q02)
  for (const sect of ["que_chu","que_bien"]) for (const ln of out[sect].an_que.lines){
    ln.ts_ngay = dayBranch ? truongSinhStage(ln.element, dayBranch) : null;
    ln.ts_thang = monthBranch ? truongSinhStage(ln.element, monthBranch) : null;
  }
  return out;
}
function modOrFull(v,d){ const r=v%d; return r===0?d:r; }
function lapQueMaiHoa(yearBranch, month, day, hourBranch){
  const s = yearBranch + month + day;
  const upName = MAIHOA_BY_NUM[modOrFull(s,8)], lowName = MAIHOA_BY_NUM[modOrFull(s+hourBranch,8)];
  const dong = modOrFull(s+hourBranch,6);
  const bits = [...DATA.trigramByName[lowName][0], ...DATA.trigramByName[upName][0]];
  const chu = hexFromBits(bits);
  const bien = hexFromBits(bits.map((b,i)=> i+1===dong ? b^1 : b));
  const ho = hexFromBits([bits[1],bits[2],bits[3],bits[2],bits[3],bits[4]]);
  const dung = dong<=3 ? chu.lower : chu.upper, the = dong<=3 ? chu.upper : chu.lower;
  const theElem = DATA.trigramByName[the][1], dungElem = DATA.trigramByName[dung][1];
  let rel;
  if (theElem===dungElem) rel="Tỷ hòa"; else if (SINH[dungElem]===theElem) rel="Dụng sinh Thể";
  else if (SINH[theElem]===dungElem) rel="Thể sinh Dụng"; else if (KHAC[theElem]===dungElem) rel="Thể khắc Dụng";
  else rel="Dụng khắc Thể";
  return {que_chu:chu, que_bien:bien, que_ho:ho, hao_dong:dong, the_quai:the, dung_quai:dung, the_dung_relation:rel};
}
export { hexFromBits, lapQueLucHao, lapQueMaiHoa, tuanKhong, lucThu, anQue, anPhucThan, truongSinhStage, truongSinhChi, haoThai };
export { SINH, KHAC, COIN_MAP, DATA, lucThan };
