"use client";
import { useRef, useState } from "react";
import { anQue, anPhucThan, tuanKhong, truongSinhStage, DATA } from "@/lib/engine";
import { dayCanChi, solar2lunar, yearCanChi, hourBranch } from "@/lib/amlich";
import { monthBranchFromDate } from "@/lib/tietkhi";

// Lá quẻ dạng ảnh (SVG) dựng từ dữ kiện engine đã tính sẵn — cùng cấu trúc
// các lá quẻ quen thuộc: đầu trang thông tin, 3 quẻ chủ/hỗ/biến, bảng an quẻ
// quẻ chủ + quẻ biến. Nút tải chuyển SVG thành PNG ngay trong trình duyệt.

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

function hourStem(dayStem, branch) {
  const s = CAN.indexOf(dayStem), b = CHI.indexOf(branch);
  if (s < 0 || b < 0) return "";
  return CAN[((s % 5) * 2 + b) % 10];
}

function fmtTime(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(date.getHours())}:${p(date.getMinutes())} · ${p(date.getDate())}/${p(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function headerTexts(date) {
  const dc = dayCanChi(date.getDate(), date.getMonth() + 1, date.getFullYear());
  const lu = solar2lunar(date.getDate(), date.getMonth() + 1, date.getFullYear());
  const yc = yearCanChi(lu.year);
  const hb = hourBranch(date.getHours());
  const mb = monthBranchFromDate(date);
  return {
    dc, lu, yc, hb, mb,
    lunarText: `ngày ${lu.day} tháng ${lu.month}${lu.leap ? " nhuận" : ""} năm ${yc.stem} ${yc.branch} âm lịch`,
    canChiText: `Giờ ${hourStem(dc.stem, hb.branch)} ${hb.branch} · Ngày ${dc.stem} ${dc.branch} · Tháng ${mb} · Năm ${yc.stem} ${yc.branch}`,
  };
}

export function buildLucHaoSheet(result, { question, topicLabel, date }) {
  const h = headerTexts(date);
  return {
    methodLabel: "Lục Hào",
    question, topicLabel,
    timeText: fmtTime(date),
    lunarText: h.lunarText,
    canChiText: h.canChiText,
    khongText: result.tuan_khong ? `Tuần Không: ${result.tuan_khong.join(", ")}` : "",
    chu: { ...result.que_chu, palace: result.que_chu.an_que.palace, palaceElem: result.que_chu.an_que.palace_element, loai: result.que_chu.an_que.loai, the: result.que_chu.an_que.the, ung: result.que_chu.an_que.ung },
    ho: result.que_ho,
    bien: result.que_bien,
    dongList: result.hao_dong || [],
    chuLines: result.que_chu.an_que.lines,
    bienLines: result.que_bien.an_que.lines,
    extraLine: null,
  };
}

export function buildMaiHoaSheet(result, { question, topicLabel, date }) {
  const h = headerTexts(date);
  const chuAn = anQue(result.que_chu, h.dc.stem);
  anPhucThan(chuAn);
  const bienAn = anQue(result.que_bien, h.dc.stem, chuAn.palace_element);
  const khong = tuanKhong(h.dc.stem, h.dc.branch);
  for (const aq of [chuAn, bienAn]) {
    for (const ln of aq.lines) {
      ln.khong = khong.includes(ln.chi);
      ln.ts_ngay = truongSinhStage(ln.element, h.dc.branch);
      ln.ts_thang = truongSinhStage(ln.element, h.mb);
    }
  }
  const theElem = (DATA.trigramByName[result.the_quai] || [])[1] || "";
  const dungElem = (DATA.trigramByName[result.dung_quai] || [])[1] || "";
  return {
    methodLabel: "Mai Hoa",
    question, topicLabel,
    timeText: fmtTime(date),
    lunarText: h.lunarText,
    canChiText: h.canChiText,
    khongText: `Tuần Không: ${khong.join(", ")}`,
    chu: { ...result.que_chu, palace: chuAn.palace, palaceElem: chuAn.palace_element, loai: chuAn.loai, the: chuAn.the, ung: chuAn.ung },
    ho: result.que_ho,
    bien: result.que_bien,
    dongList: [result.hao_dong],
    chuLines: chuAn.lines,
    bienLines: bienAn.lines,
    extraLine: `Thể: ${result.the_quai} (${theElem}) · Dụng: ${result.dung_quai} (${dungElem}) · Quan hệ Thể–Dụng: ${result.the_dung_relation}`,
  };
}

// ---------- SVG pieces ----------

const RED = "#9E1B1B";
const INK = "#1F1A14";
const GOLD = "#C9A227";
const GRID = "#D8C690";
const HEADBG = "#F5E7C1";

function HexBars({ x, y, hex, dongList, showTheUng }) {
  // y = top of the 6-bar stack; bars drawn top-down = hào 6 → hào 1
  const bw = 118, bh = 15, gap = 9;
  const rows = [];
  for (let i = 5; i >= 0; i--) {
    const hao = i + 1;
    const bit = hex.bits[i];
    const dong = dongList.includes(hao);
    const yy = y + (5 - i) * (bh + gap);
    const fill = dong ? RED : INK;
    rows.push(
      <g key={hao}>
        {showTheUng && hex.the === hao ? (
          <text x={x - 10} y={yy + bh - 3} fontSize="15" fontWeight="700" fill={RED} textAnchor="end">Thế</text>
        ) : null}
        {showTheUng && hex.ung === hao ? (
          <text x={x - 10} y={yy + bh - 3} fontSize="15" fontWeight="700" fill="#1D4ED8" textAnchor="end">Ứng</text>
        ) : null}
        {bit === 1 ? (
          <rect x={x} y={yy} width={bw} height={bh} fill={fill} />
        ) : (
          <>
            <rect x={x} y={yy} width={50} height={bh} fill={fill} />
            <rect x={x + bw - 50} y={yy} width={50} height={bh} fill={fill} />
          </>
        )}
        {dong ? (
          <text x={x + bw + 10} y={yy + bh - 2} fontSize="17" fontWeight="700" fill={RED}>✕</text>
        ) : null}
      </g>
    );
  }
  return <g>{rows}</g>;
}

function TableGrid({ x, y, cols, rows, rowH, headerH }) {
  const totalW = cols.reduce((a, c) => a + c.w, 0);
  const els = [];
  els.push(
    <rect key="hbg" x={x} y={y} width={totalW} height={headerH} fill={HEADBG} stroke={GRID} />
  );
  let cx = x;
  cols.forEach((c, ci) => {
    els.push(
      <text key={`h${ci}`} x={cx + 10} y={y + headerH - 12} fontSize="16" fontWeight="700" fill={INK}>{c.title}</text>
    );
    cx += c.w;
  });
  rows.forEach((r, ri) => {
    const yy = y + headerH + ri * rowH;
    if (r.hot) els.push(<rect key={`rbg${ri}`} x={x} y={yy} width={totalW} height={rowH} fill="#FDECEC" />);
    els.push(<rect key={`rb${ri}`} x={x} y={yy} width={totalW} height={rowH} fill="none" stroke={GRID} />);
    let ccx = x;
    cols.forEach((c, ci) => {
      const cell = r.cells[ci];
      if (cell) {
        els.push(
          <text key={`c${ri}-${ci}`} x={ccx + 10} y={yy + 27} fontSize="16.5" fontWeight={r.hot || cell.bold ? "700" : "400"} fill={r.hot ? RED : INK}>
            {cell.main}
          </text>
        );
        if (cell.sub) {
          els.push(
            <text key={`s${ri}-${ci}`} x={ccx + 10} y={yy + 47} fontSize="14" fill="#6B6257">{cell.sub}</text>
          );
        }
      }
      ccx += c.w;
    });
    // vertical lines
    let vx = x;
    cols.forEach((c, ci) => {
      els.push(<line key={`v${ri}-${ci}`} x1={vx} y1={y} x2={vx} y2={y + headerH + rows.length * rowH} stroke={GRID} />);
      vx += c.w;
    });
    els.push(<line key={`vr${ri}`} x1={vx} y1={y} x2={vx} y2={y + headerH + rows.length * rowH} stroke={GRID} />);
  });
  return <g>{els}</g>;
}

function SheetSvg({ sheet, svgRef }) {
  const W = 1080, PAD = 44, IW = W - PAD * 2;
  const hasSub = sheet.chuLines.some(
    (l) => l.phuc_than || l.the || l.ung || l.khong || sheet.dongList.includes(l.hao)
  );
  const rowH = hasSub ? 62 : 46;
  const headerH = 38;

  // vertical layout
  const yTitle = 78;
  const yInfo = 128; // 4 info lines, 27px apart → ends ~236
  const yHexName = 292;
  const yBars = yHexName + 18;
  const barsH = 6 * 15 + 5 * 9; // 135
  const yPalace = yBars + barsH + 30;
  const yExtra = sheet.extraLine ? yPalace + 34 : yPalace;
  const yTableTitle = yExtra + 44;
  const yTable = yTableTitle + 12;
  const tableH = headerH + 6 * rowH;
  const yFoot = yTable + tableH + 46;
  const H = yFoot + 60;

  const chuCols = [
    { title: "Hào", w: 50 },
    { title: "Lục Thân", w: 144 },
    { title: "Chi – Hành", w: 140 },
    { title: "Lục Thú", w: 100 },
    { title: "TS ngày", w: 108 },
    { title: "TS tháng", w: 112 },
  ];
  const bienCols = [
    { title: "Lục Thân", w: 112 },
    { title: "Chi – Hành", w: 118 },
    { title: "Lục Thú", w: 108 },
  ];
  const chuTableW = chuCols.reduce((a, c) => a + c.w, 0); // 654
  const bienTableW = bienCols.reduce((a, c) => a + c.w, 0); // 338
  const bienX = PAD + chuTableW + (IW - chuTableW - bienTableW);

  const mkRows = (lines, withDetail) =>
    [...lines].reverse().map((l) => {
      const dong = sheet.dongList.includes(l.hao);
      const marks = [l.the ? "Thế" : null, l.ung ? "Ứng" : null, dong ? "Động" : null, l.khong ? "Không" : null]
        .filter(Boolean)
        .join(" · ");
      if (withDetail) {
        return {
          hot: dong,
          cells: [
            { main: `${l.hao}`, bold: true },
            {
              main: l.luc_than || "",
              sub: l.phuc_than ? `Phục: ${l.phuc_than.luc_than} ${l.phuc_than.chi}` : marks || null,
            },
            { main: `${l.can} ${l.chi} – ${l.element}` },
            { main: l.luc_thu || "" },
            { main: l.ts_ngay || "" },
            { main: l.ts_thang || "" },
          ],
        };
      }
      return {
        hot: dong,
        cells: [
          { main: l.luc_than || "" },
          { main: `${l.can} ${l.chi}` },
          { main: l.luc_thu || "" },
        ],
      };
    });

  const hexGroups = [
    { label: sheet.chu.name.toUpperCase(), hex: sheet.chu, cx: PAD + 150, main: true },
    { label: sheet.ho.name.toUpperCase(), hex: sheet.ho, cx: W / 2, main: false },
    { label: sheet.bien.name.toUpperCase(), hex: sheet.bien, cx: W - PAD - 150, main: false },
  ];

  return (
    <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} fontFamily="Arial, 'Segoe UI', sans-serif">
      <rect x="0" y="0" width={W} height={H} fill="#FDF8EC" />
      <rect x="10" y="10" width={W - 20} height={H - 20} fill="none" stroke={GOLD} strokeWidth="3" />
      <rect x="18" y="18" width={W - 36} height={H - 36} fill="none" stroke={GOLD} strokeWidth="1" />

      <text x={W / 2} y={yTitle} fontSize="39" fontWeight="800" fill={RED} textAnchor="middle" letterSpacing="1">
        GIEO QUẺ — LUẬN QUẺ KINH DỊCH
      </text>
      <text x={W / 2} y={yTitle + 30} fontSize="17" fill="#6B6257" textAnchor="middle">
        gieo-que-web-deploy.vercel.app · Phần mềm lập quẻ · Phương pháp: {sheet.methodLabel}
      </text>

      <g fontSize="19" fill={INK}>
        <text x={PAD} y={yInfo}>
          <tspan fontWeight="700">Việc cần xem: </tspan>
          {sheet.topicLabel || ""}{sheet.question ? ` — ${sheet.question}` : ""}
        </text>
        <text x={PAD} y={yInfo + 28}>
          <tspan fontWeight="700">Thời gian lập quẻ: </tspan>
          {sheet.timeText}
          <tspan> · Theo âm lịch: {sheet.lunarText}</tspan>
        </text>
        <text x={PAD} y={yInfo + 56}>
          <tspan fontWeight="700">Can Chi: </tspan>
          {sheet.canChiText}
          {sheet.khongText ? <tspan> · {sheet.khongText}</tspan> : null}
        </text>
      </g>
      <line x1={PAD} y1={yInfo + 76} x2={W - PAD} y2={yInfo + 76} stroke={GOLD} strokeWidth="1.5" />

      {hexGroups.map((g) => (
        <g key={g.label}>
          <text x={g.cx} y={yHexName} fontSize="22" fontWeight="800" fill={RED} textAnchor="middle">{g.label}</text>
          <HexBars x={g.cx - 59} y={yBars} hex={g.hex} dongList={g.main ? sheet.dongList : []} showTheUng={g.main} />
          {g.main ? (
            <text x={g.cx} y={yPalace} fontSize="17.5" fill={INK} textAnchor="middle">
              Cung {sheet.chu.palace}{sheet.chu.palaceElem ? ` (${sheet.chu.palaceElem})` : ""}{sheet.chu.loai ? ` · ${sheet.chu.loai}` : ""}
            </text>
          ) : (
            <text x={g.cx} y={yPalace} fontSize="17.5" fill="#6B6257" textAnchor="middle">
              Quẻ {g.hex.number}
            </text>
          )}
        </g>
      ))}

      {sheet.extraLine ? (
        <text x={W / 2} y={yExtra + 6} fontSize="19" fontWeight="700" fill={INK} textAnchor="middle">{sheet.extraLine}</text>
      ) : null}

      <text x={PAD} y={yTableTitle} fontSize="19" fontWeight="800" fill={RED}>AN QUẺ — QUẺ CHỦ</text>
      <text x={bienX} y={yTableTitle} fontSize="19" fontWeight="800" fill={RED}>QUẺ BIẾN</text>
      <TableGrid x={PAD} y={yTable} cols={chuCols} rows={mkRows(sheet.chuLines, true)} rowH={rowH} headerH={headerH} />
      <TableGrid x={bienX} y={yTable} cols={bienCols} rows={mkRows(sheet.bienLines, false)} rowH={rowH} headerH={headerH} />

      <text x={W / 2} y={yFoot} fontSize="16.5" fill="#6B6257" textAnchor="middle">
        Lập tại gieo-que-web-deploy.vercel.app — Gieo quẻ Lục Hào &amp; Mai Hoa miễn phí mỗi ngày · Luận sâu miễn phí, tùy hỷ sau khi nhận bài
      </text>
      <text x={W / 2} y={yFoot + 27} fontSize="14.5" fill="#8A8175" textAnchor="middle">
        TS = vòng Trường Sinh theo Nhật thần (ngày) và Nguyệt kiến (tháng). Hào đỏ là hào động.
      </text>
    </svg>
  );
}

function slugify(s) {
  return (s || "que")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function LaQueSheetButton({ sheet }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const svgRef = useRef(null);

  function download() {
    const node = svgRef.current;
    if (!node) return;
    setBusy(true);
    try {
      const xml = new XMLSerializer().serializeToString(node);
      const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
      const img = new Image();
      img.onload = () => {
        const scale = 2;
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#FDF8EC";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `la-que-${sheet.chu.number}-${slugify(sheet.chu.name)}.png`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
          setBusy(false);
        }, "image/png");
      };
      img.onerror = () => setBusy(false);
      img.src = url;
    } catch (e) {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <p className="center">
        <button className="btn ghost" onClick={() => setOpen(!open)}>
          {open ? "Đóng lá quẻ" : "Xem lá quẻ"}
        </button>{" "}
        <button className="btn" onClick={() => { setOpen(true); setTimeout(download, 60); }} disabled={busy}>
          {busy ? "Đang tạo ảnh…" : "Tải ảnh lá quẻ"}
        </button>
      </p>
      {open ? (
        <div className="card" style={{ padding: 10, overflowX: "auto" }}>
          <SheetSvg sheet={sheet} svgRef={svgRef} />
        </div>
      ) : (
        <div style={{ position: "absolute", left: -99999, top: 0, width: 1080 }} aria-hidden="true">
          <SheetSvg sheet={sheet} svgRef={svgRef} />
        </div>
      )}
    </div>
  );
}
