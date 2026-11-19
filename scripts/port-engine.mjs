// Port engine từ ~/workspace/gieo-que-engine/demo sang ESM trong lib/.
// Nguyên tắc: biến đổi cơ học (import/export), KHÔNG sửa luật gieo quẻ.
// Chạy: node scripts/port-engine.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "..", "gieo-que-engine", "demo");
const LIB = join(ROOT, "lib");
const rd = (p) => readFileSync(p, "utf-8");

// ---------- 1. DATA: trích nguyên văn từ demo/engine.js (đã gồm hexInfo + cauLuan) ----------
const engineJs = rd(join(SRC, "engine.js"));
const m = engineJs.match(/^const DATA = (\{[\s\S]*?\});\n/);
if (!m) throw new Error("Không trích được DATA từ engine.js");
const DATA = JSON.parse(m[1]);
writeFileSync(
  join(LIB, "engine-data.js"),
  "// DATA sinh tự động từ engine Python qua build_demo.py của gieo-que-engine\n" +
    "// (bảng quái/cung/nạp giáp + hexInfo 64 quẻ + bộ câu luận cơ bản). Không sửa tay.\n" +
    "export const DATA = " + JSON.stringify(DATA, null, 1) + ";\n"
);
console.log("engine-data.js:", Object.keys(DATA).length, "khóa");

// ---------- 2. Danh sách 64 quẻ + slug ----------
function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
const hexagrams = Object.keys(DATA.hexByNumber)
  .map((n) => Number(n))
  .sort((a, b) => a - b)
  .map((n) => {
    const [name, up, low] = DATA.hexByNumber[String(n)];
    const bits = [...DATA.trigramByName[low][0], ...DATA.trigramByName[up][0]];
    return {
      number: n,
      name,
      upper: up,
      lower: low,
      bits,
      slug: n + "-" + slugify(name),
      info: DATA.hexInfo[String(n)],
    };
  });
if (hexagrams.length !== 64) throw new Error("Không đủ 64 quẻ");
if (new Set(hexagrams.map((h) => h.slug)).size !== 64) throw new Error("Slug trùng");
writeFileSync(
  join(LIB, "hexagrams.js"),
  "// 64 quẻ: tên, thượng/hạ quái, slug, cổ văn + ghi chú 11 trường (từ hex_info.json).\n" +
    "export const HEXAGRAMS = " + JSON.stringify(hexagrams, null, 1) + ";\n" +
    "export const HEX_BY_SLUG = Object.fromEntries(HEXAGRAMS.map(h => [h.slug, h]));\n" +
    "export const HEX_BY_NUMBER = Object.fromEntries(HEXAGRAMS.map(h => [h.number, h]));\n"
);
console.log("hexagrams.js: 64 quẻ, slug mẫu:", hexagrams[0].slug, "/", hexagrams[63].slug);

// ---------- 3. engine_logic.js -> lib/engine.js ----------
let eng = rd(join(SRC, "engine_logic.js"));
eng = eng.replace(
  /^\/\/ Engine gieo quẻ[^\n]*\n/,
  "// Engine gieo quẻ — port ESM nguyên văn từ gieo-que-engine/demo/engine_logic.js\n" +
    "// (bản JS port 1-1 từ gieo_que.py). Chỉ đổi cơ chế module, không đổi luật.\n" +
    "import { DATA } from \"./engine-data.js\";\n"
);
eng = eng.replace(
  /if \(typeof module !== "undefined"\) module\.exports = \{[^}]*\};?/,
  "export { hexFromBits, lapQueLucHao, lapQueMaiHoa, tuanKhong, lucThu, anQue, anPhucThan, truongSinhStage, truongSinhChi, haoThai };\n" +
    "export { SINH, KHAC, COIN_MAP, DATA, lucThan };"
);
if (!eng.includes("export { hexFromBits")) throw new Error("engine: thay exports thất bại");
writeFileSync(join(LIB, "engine.js"), eng);
console.log("engine.js ok");

// ---------- 4. luan_logic.js -> lib/luan.js ----------
let luan = rd(join(SRC, "luan_logic.js"));
luan =
  "// Tầng LUẬN CƠ BẢN — port ESM nguyên văn từ gieo-que-engine/demo/luan_logic.js.\n" +
  "import { SINH, KHAC, lucThan, tuanKhong, DATA } from \"./engine.js\";\n" +
  luan;
luan = luan.replace(
  /if \(typeof module !== "undefined"\)\s*module\.exports = Object\.assign\(module\.exports \|\| \{\},\s*\{chonDungThan, luanCoBan, soanVanBan, vuongTuong\}\);/,
  "export { chonDungThan, luanCoBan, soanVanBan, vuongTuong, LINH_VUC };"
);
if (!luan.includes("export { chonDungThan")) throw new Error("luan: thay exports thất bại");
writeFileSync(join(LIB, "luan.js"), luan);
console.log("luan.js ok");

// ---------- 5. amlich.js -> lib/amlich.js ----------
let am = rd(join(SRC, "amlich.js"));
am = am.replace(
  /if \(typeof module !== "undefined"\) module\.exports = \{[^}]*\};/,
  "export { solar2lunar, dayCanChi, yearCanChi, hourBranch, jdFromDate };"
);
if (!am.includes("export { solar2lunar")) throw new Error("amlich: thay exports thất bại");
writeFileSync(join(LIB, "amlich.js"), "// Âm lịch + Can Chi — port ESM nguyên văn từ gieo-que-engine/demo/amlich.js.\n" + am);
console.log("amlich.js ok");

// ---------- 6. tietkhi.js -> lib/tietkhi.js ----------
let tk = rd(join(SRC, "tietkhi.js"));
tk = tk.replace(
  /if \(typeof module !== "undefined"\) module\.exports = \{\s*SOLAR_TERMS, sunApparentLongitude, solarTermsOfYear, monthBranchFromDate,\s*\};/,
  "export { SOLAR_TERMS, sunApparentLongitude, solarTermsOfYear, monthBranchFromDate };"
);
if (!tk.includes("export { SOLAR_TERMS")) throw new Error("tietkhi: thay exports thất bại");
writeFileSync(join(LIB, "tietkhi.js"), "// Tiết khí -> chi tháng — port ESM nguyên văn từ gieo-que-engine/demo/tietkhi.js.\n" + tk);
console.log("tietkhi.js ok");

console.log("PORT XONG");
