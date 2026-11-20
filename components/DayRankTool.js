"use client";

import { useMemo, useState } from "react";
import DayRankTable from "./DayRankTable";
import { CAC_VIEC } from "@/lib/daychecklists";
import {
  CAC_CHI, DISCLAIMER, GIO_MAC_DINH, KHUNG_GIO, chamKhoang, dongGio, ngaySlug, xepHang,
} from "@/lib/dayrank";

// Công cụ chọn ngày tùy chọn (spec mục 7.3): chọn việc + khoảng ngày + giờ
// + tọa sơn, chấm ngay phía client bằng cùng pipeline với bảng tháng server.
export default function DayRankTool({ viecMacDinh = "khai-truong", khoaViec = false }) {
  const today = useMemo(() => new Date(), []);
  const [viec, setViec] = useState(viecMacDinh);
  const [tuNgay, setTuNgay] = useState(ngaySlug(today));
  const [soNgay, setSoNgay] = useState(30);
  const [gioNum, setGioNum] = useState(GIO_MAC_DINH);
  const [son, setSon] = useState("");

  const entries = useMemo(() => {
    const [y, m, d] = tuNgay.split("-").map(Number);
    if (!y || !m || !d) return [];
    const from = new Date(y, m - 1, d);
    return xepHang(chamKhoang(from, soNgay, viec, gioNum, son || null));
  }, [tuNgay, soNgay, viec, gioNum, son]);

  return (
    <div className="card">
      <div className="big-title" style={{ fontSize: "1.15rem" }}>
        Tự chọn khoảng ngày của bạn
      </div>
      <div style={{ display: "grid", gap: 0, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", columnGap: 14 }}>
        {!khoaViec && (
          <div>
            <label className="flabel" htmlFor="dr-viec">Việc cần chọn ngày</label>
            <select id="dr-viec" value={viec} onChange={(e) => setViec(e.target.value)}>
              {CAC_VIEC.map((v) => (
                <option key={v.slug} value={v.slug}>{v.ten}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="flabel" htmlFor="dr-tu">Từ ngày</label>
          <input id="dr-tu" type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} />
        </div>
        <div>
          <label className="flabel" htmlFor="dr-so">Số ngày xem</label>
          <select id="dr-so" value={soNgay} onChange={(e) => setSoNgay(Number(e.target.value))}>
            {[7, 14, 30, 45, 60].map((n) => (
              <option key={n} value={n}>{n} ngày</option>
            ))}
          </select>
        </div>
        <div>
          <label className="flabel" htmlFor="dr-gio">Giờ dự định làm việc</label>
          <select id="dr-gio" value={gioNum} onChange={(e) => setGioNum(Number(e.target.value))}>
            {KHUNG_GIO.map((g) => (
              <option key={g.num} value={g.num}>
                Giờ {g.chi} ({g.khung}){g.num === GIO_MAC_DINH ? " — mặc định" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="flabel" htmlFor="dr-son">Tọa sơn (tùy chọn)</label>
          <select id="dr-son" value={son} onChange={(e) => setSon(e.target.value)}>
            <option value="">— Không nhập —</option>
            {CAC_CHI.map((c) => (
              <option key={c} value={c}>Sơn {c}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="mut small" style={{ marginTop: 14 }}>{dongGio(gioNum)}</p>
      {entries.length ? (
        <DayRankTable entries={entries} viec={viec} />
      ) : (
        <p className="mut">Hãy chọn ngày bắt đầu hợp lệ.</p>
      )}
      <p className="mut small" style={{ marginTop: 12 }}>{DISCLAIMER}</p>
    </div>
  );
}
