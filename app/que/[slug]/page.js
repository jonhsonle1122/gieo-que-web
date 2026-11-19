import Link from "next/link";
import { notFound } from "next/navigation";
import HexFigure from "@/components/HexFigure";
import { HEXAGRAMS, HEX_BY_SLUG } from "@/lib/hexagrams";
import { hexFromBits, anQue } from "@/lib/engine";
import { SITE_NAME } from "@/lib/config";

export function generateStaticParams() {
  return HEXAGRAMS.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const h = HEX_BY_SLUG[slug];
  if (!h) return {};
  return {
    title: `Quẻ ${h.number} · ${h.name} — ý nghĩa, Thoán từ & Hào từ`,
    description: `${h.info.tu_khoa}. ${h.info.y_chinh} Xem cổ văn Thoán từ, Hào từ, Đại tượng và tượng giải đầy đủ của quẻ ${h.name} tại ${SITE_NAME}.`,
  };
}

const NOTE_SECTIONS = [
  ["tu_khoa", "Từ khóa tượng"],
  ["cau_tao", "Cấu tạo tượng"],
  ["y_nghia", "Ý nghĩa"],
  ["hai_chieu", "Hai chiều của quẻ"],
  ["tinh_tinh", "Tính tình"],
  ["nghe_nghiep", "Nghề nghiệp hợp tượng"],
  ["vat_dung", "Vật dụng / hình tượng"],
  ["thoi_van", "Thời vận"],
  ["doi_chieu", "Quẻ đối chiếu"],
  ["y_chinh", "Ý chính"],
  ["luu_y", "Điểm cần lưu ý"],
];

export default async function HexagramPage({ params }) {
  const { slug } = await params;
  const h = HEX_BY_SLUG[slug];
  if (!h) notFound();
  const inf = h.info;
  const hex = hexFromBits(h.bits);
  const aq = anQue(hex, null);
  const prev = HEX_BY_SLUG[HEXAGRAMS[h.number - 2]?.slug] || null;
  const next = HEX_BY_SLUG[HEXAGRAMS[h.number]?.slug] || null;

  return (
    <div>
      <p className="mut small" style={{ marginTop: 20 }}>
        <Link href="/64-que">← Toàn bộ 64 quẻ</Link>
      </p>
      <div className="center">
        <div className="mut">Quẻ {h.number}</div>
        <h1 className="serif" style={{ color: "var(--gold-soft)", margin: "4px 0" }}>
          {h.name}
        </h1>
        <div className="mut">
          Thượng {h.upper} · Hạ {h.lower} · Cung {aq.palace} ({aq.palace_element}) · {aq.loai} · Thế hào {aq.the} ·
          Ứng hào {aq.ung}
        </div>
        <div style={{ maxWidth: 260, margin: "0 auto" }}>
          <HexFigure bits={h.bits} />
        </div>
      </div>

      <div className="card">
        <h2>Cổ văn</h2>
        <p>
          <b>Thoán từ:</b> <span className="classical">{inf.thoan}</span>
          <br />
          <span className="mut">Dịch:</span> {inf.thoan_vi}
        </p>
        <p>
          <b>Đại tượng:</b> <span className="classical">{inf.dai_tuong}</span>
        </p>
        <h3 style={{ marginBottom: 4 }}>Hào từ</h3>
        <div className="hao-list">
          {inf.hao.map((line, i) => (
            <div key={i}>
              <span className="classical">{line}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="serif">Tượng giải</h2>
        <div className="note-grid">
          {NOTE_SECTIONS.map(([key, label]) =>
            inf[key] ? (
              <div className="note-block" key={key}>
                <h3>{label}</h3>
                <p>{inf[key]}</p>
              </div>
            ) : null
          )}
        </div>
      </div>

      <div className="notice center" style={{ marginTop: 36 }}>
        <p style={{ marginTop: 0 }}>
          Muốn biết quẻ này ứng vào việc của bạn thế nào? Gieo một quẻ cho đúng câu hỏi của mình.
        </p>
        <Link className="btn" href="/#gieo-que">
          Gieo quẻ ngay
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        <span>
          {prev ? <Link href={`/que/${prev.slug}`}>← Quẻ {prev.number} · {prev.name}</Link> : null}
        </span>
        <span>
          {next ? <Link href={`/que/${next.slug}`}>Quẻ {next.number} · {next.name} →</Link> : null}
        </span>
      </div>
    </div>
  );
}
