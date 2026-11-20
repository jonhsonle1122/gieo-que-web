import Link from "next/link";
import { notFound } from "next/navigation";
import HexFigure from "@/components/HexFigure";
import { AnQueTable, MiniHexCard } from "@/components/CastResult";
import { nhanClass } from "@/components/DayRankTable";
import { VIEC_BY_SLUG } from "@/lib/daychecklists";
import { DATA } from "@/lib/engine";
import { DISCLAIMER, GIO_MAC_DINH, chamNgay, diemText, gioByNum, thuCua } from "@/lib/dayrank";
import { SITE_NAME } from "@/lib/config";

function parseNgay(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

export async function generateMetadata({ params }) {
  const { viec, ngay } = await params;
  const v = VIEC_BY_SLUG[viec];
  const dt = parseNgay(ngay);
  if (!v || !dt) return {};
  return {
    title: `Quẻ ngày ${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()} cho việc ${v.ten.toLowerCase()} — chấm ngày Lục Hào`,
    description: `Chi tiết quẻ ngày và từng mục checklist chọn ngày ${v.ten.toLowerCase()} cho ngày ${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}.`,
  };
}

export default async function NgayPage({ params, searchParams }) {
  const { viec, ngay } = await params;
  const sp = await searchParams;
  const v = VIEC_BY_SLUG[viec];
  const dt = parseNgay(ngay);
  if (!v || !dt) notFound();

  const gioNumRaw = Number(sp.gio);
  const gioNum = Number.isInteger(gioNumRaw) && gioNumRaw >= 1 && gioNumRaw <= 12 ? gioNumRaw : GIO_MAC_DINH;
  const son = DATA.branches.includes(sp.son) ? sp.son : null;
  const gio = gioByNum(gioNum);

  const e = chamNgay(dt, viec, gioNum, son);
  const r = e.result;
  const aq = r.que_chu.an_que;
  const dat = e.gia.items.filter((i) => i.trang_thai === "dat");
  const pham = e.gia.items.filter((i) => i.trang_thai === "pham");
  const khongDat = e.gia.items.filter((i) => i.trang_thai === "khong_dat");
  const boQua = e.gia.items.filter((i) => i.trang_thai === "bo_qua");

  return (
    <div>
      <p className="mut small">
        <Link href="/chon-ngay">Chọn ngày</Link> · <Link href={`/chon-ngay/${viec}`}>{v.tenSEO}</Link>
      </p>
      <section className="hero">
        <div className="han-bg">擇</div>
        <h1>
          Ngày {dt.getDate()}/{dt.getMonth() + 1}/{dt.getFullYear()} — việc {v.ten.toLowerCase()}
        </h1>
        <p className="lead">
          {thuCua(dt)} · Âm lịch {e.lunar.day}/{e.lunar.month}/{e.lunar.year}
          {e.lunar.leap ? " (tháng nhuận)" : ""} · Ngày {e.day_stem} {e.day_branch} · Tháng {e.month_branch}{" "}
          (theo tiết khí) · Chấm theo giờ {gio.chi} ({gio.khung}){son ? ` · Tọa sơn ${son}` : ""}
        </p>
        <p>
          <span className={nhanClass(e.nhan)} style={{ marginLeft: 0, fontSize: "0.95rem" }}>
            {e.nhan} · {diemText(e.gia.diem)} ({e.gia.tot_dat} tốt · {e.gia.xau_pham} xấu)
          </span>
        </p>
      </section>

      {e.gia.canh_bao.length ? (
        <div className="notice warn">
          {e.gia.canh_bao.map((c, i) => (
            <p key={i} style={{ margin: 0 }}>{c}</p>
          ))}
        </div>
      ) : null}

      <div className="card">
        <div className="mut small">
          Quẻ ngày khởi bằng số học thời gian của ngày này (phép Mai Hoa) — Tuần Không:{" "}
          {r.tuan_khong ? r.tuan_khong.join(", ") : "—"}
        </div>
        <div className="big-title">
          Quẻ {r.que_chu.number} · {r.que_chu.name}
        </div>
        <HexFigure bits={r.que_chu.bits} dongList={r.hao_dong} />
        <div className="mut small center">
          Cung {aq.palace} ({aq.palace_element}) · {aq.loai} · Thế hào {aq.the} · Ứng hào {aq.ung} · Thể{" "}
          {r.maihoa.the_quai} / Dụng {r.maihoa.dung_quai} ({r.maihoa.the_dung_relation})
        </div>
        <h3 className="serif">Bảng an quẻ — quẻ chủ</h3>
        <AnQueTable aq={aq} dongList={r.hao_dong} />
        <h3 className="serif" style={{ marginTop: 18 }}>Bảng an quẻ — quẻ biến</h3>
        <AnQueTable aq={r.que_bien.an_que} dongList={[]} />
      </div>
      <div className="mini-cards">
        <MiniHexCard title="Quẻ biến" hex={r.que_bien} />
        <MiniHexCard title="Quẻ hỗ" hex={r.que_ho} />
      </div>

      <section className="section">
        <h2 className="serif">Checklist {v.ten.toLowerCase()} cho ngày này</h2>

        <h3>Đạt ({dat.length})</h3>
        {dat.length ? (
          <ul>
            {dat.map((i) => (
              <li key={i.ma}>
                <b>{i.ma}</b> — {i.ten}
                {i.ly_do ? <div className="mut small">✓ {i.ly_do}</div> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mut">Không có mục tốt nào đạt.</p>
        )}

        <h3>Phạm ({pham.length})</h3>
        {pham.length ? (
          <ul>
            {pham.map((i) => (
              <li key={i.ma}>
                <b>{i.ma}</b> — {i.ten}
                {i.ly_do ? <div className="lydo-pham small">⚠ {i.ly_do}</div> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mut">Không phạm mục xấu nào.</p>
        )}

        <h3>Không đạt ({khongDat.length})</h3>
        {khongDat.length ? (
          <ul>
            {khongDat.map((i) => (
              <li key={i.ma}>
                <b>{i.ma}</b> — {i.ten}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mut">Mọi mục tốt đều đạt.</p>
        )}

        <h3>Bỏ qua ({boQua.length + e.gia.bo_qua_notes.length})</h3>
        {boQua.length || e.gia.bo_qua_notes.length ? (
          <ul>
            {boQua.map((i) => (
              <li key={i.ma}>
                <b>{i.ma}</b> — {i.ten}
                <div className="mut small">{i.ly_do}</div>
              </li>
            ))}
            {e.gia.bo_qua_notes.map((n) => (
              <li key={n.ma + n.ten}>
                <b>{n.ma}</b> — {n.ten}
                <div className="mut small">{n.ly_do}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mut">Không có mục nào bị bỏ qua.</p>
        )}

        <p className="mut small">{DISCLAIMER}</p>
        <div className="notice">
          Ngày này chỉ là quẻ của ngày. Muốn chọn theo đúng việc riêng của bạn?{" "}
          <Link href="/luan-sau">Đặt luận sâu tại {SITE_NAME}</Link> — luận riêng theo câu hỏi và hoàn
          cảnh của bạn, có người duyệt trước khi gửi.
        </div>
      </section>
    </div>
  );
}
