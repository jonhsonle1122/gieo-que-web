import Link from "next/link";
import { notFound } from "next/navigation";
import DayRankTable from "@/components/DayRankTable";
import DayRankTool from "@/components/DayRankTool";
import { VIEC_BY_SLUG } from "@/lib/daychecklists";
import { DATA } from "@/lib/engine";
import { DISCLAIMER, GIO_MAC_DINH, chamNgay, dongGio, xepHang } from "@/lib/dayrank";
import { SITE_NAME, SITE_URL } from "@/lib/config";

function parseThangNam(sp, now) {
  let m = Number(sp.thang), y = Number(sp.nam);
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2000 || y > 2100) {
    return { thang: now.getMonth() + 1, nam: now.getFullYear(), macDinh: true };
  }
  // Giới hạn xem lại: tối đa 12 tháng trước / 12 tháng sau so với tháng hiện tại.
  const idx = y * 12 + (m - 1);
  const cur = now.getFullYear() * 12 + now.getMonth();
  if (idx < cur - 12 || idx > cur + 12) return { thang: now.getMonth() + 1, nam: now.getFullYear(), macDinh: true };
  return { thang: m, nam: y, macDinh: idx === cur };
}

function thangLink(viec, thang, nam, gio, son) {
  const p = new URLSearchParams();
  p.set("thang", String(thang));
  p.set("nam", String(nam));
  if (gio !== GIO_MAC_DINH) p.set("gio", String(gio));
  if (son) p.set("son", son);
  return `/chon-ngay/${viec}?${p.toString()}`;
}

export async function generateMetadata({ params, searchParams }) {
  const { viec } = await params;
  const sp = await searchParams;
  const v = VIEC_BY_SLUG[viec];
  if (!v) return {};
  const now = new Date();
  const { thang, nam, macDinh } = parseThangNam(sp, now);
  const md = {
    title: `${v.tenSEO} tháng ${thang} năm ${nam} — chấm bằng quẻ Lục Hào`,
    description: `Bảng chấm ngày tốt ${v.ten.toLowerCase()} tháng ${thang}/${nam} bằng quẻ Lục Hào từng ngày (trường phái Thực Chiến Điểm Khiếu): điểm, nhãn và lý do minh bạch cho từng ngày.`,
  };
  if (macDinh && SITE_URL) md.alternates = { canonical: `${SITE_URL}/chon-ngay/${viec}` };
  return md;
}

export default async function ViecPage({ params, searchParams }) {
  const { viec } = await params;
  const sp = await searchParams;
  const v = VIEC_BY_SLUG[viec];
  if (!v) notFound();

  const now = new Date();
  const { thang, nam } = parseThangNam(sp, now);
  const gioNumRaw = Number(sp.gio);
  const gioNum = Number.isInteger(gioNumRaw) && gioNumRaw >= 1 && gioNumRaw <= 12 ? gioNumRaw : GIO_MAC_DINH;
  const son = DATA.branches.includes(sp.son) ? sp.son : null;

  const soNgayTrongThang = new Date(nam, thang, 0).getDate();
  const entries = [];
  for (let d = 1; d <= soNgayTrongThang; d++) {
    entries.push(chamNgay(new Date(nam, thang - 1, d), viec, gioNum, son));
  }
  const ranked = xepHang(entries);

  const prevIdx = nam * 12 + (thang - 1) - 1;
  const nextIdx = nam * 12 + (thang - 1) + 1;
  const prev = { thang: (prevIdx % 12) + 1, nam: Math.floor(prevIdx / 12) };
  const next = { thang: (nextIdx % 12) + 1, nam: Math.floor(nextIdx / 12) };

  return (
    <div>
      <section className="hero">
        <div className="han-bg">擇</div>
        <h1>
          {v.tenSEO} tháng {thang}/{nam}
        </h1>
        <p className="lead">{v.gioiThieu}</p>
        <p className="mut">
          Dụng thần chính của việc này: {v.dungThan}. Phương pháp chấm theo quẻ Lục Hào của từng ngày —
          không kỵ tuổi, không dùng thần sát theo lịch.
        </p>
      </section>

      <section className="section">
        <h2 className="serif">
          Bảng chấm ngày tháng {thang}/{nam}
        </h2>
        <p className="mut small">{dongGio(gioNum)}</p>
        <DayRankTable entries={ranked} viec={viec} />
        <p style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <Link href={thangLink(viec, prev.thang, prev.nam, gioNum, son)}>
            ← Tháng {prev.thang}/{prev.nam}
          </Link>
          <Link href={thangLink(viec, next.thang, next.nam, gioNum, son)}>
            Tháng {next.thang}/{next.nam} →
          </Link>
        </p>
        <p className="mut small">{DISCLAIMER}</p>
        <div className="notice">
          Ngày trong bảng là quẻ của ngày, tính cho mọi người như nhau. Muốn chọn ngày theo đúng việc
          riêng và hoàn cảnh của bạn? <Link href="/luan-sau">Đặt luận sâu tại {SITE_NAME}</Link> — bài
          luận riêng theo câu hỏi của bạn, có người duyệt trước khi gửi.
        </div>
      </section>

      <section className="section">
        <DayRankTool viecMacDinh={viec} khoaViec />
      </section>
    </div>
  );
}
