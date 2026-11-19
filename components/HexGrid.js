"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import HexFigure from "./HexFigure";

// Lưới 64 quẻ có tìm kiếm theo số, tên quẻ, từ khóa tượng và ý chính.
export default function HexGrid({ items }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (h) =>
        String(h.number) === needle ||
        h.name.toLowerCase().includes(needle) ||
        (h.tu_khoa || "").toLowerCase().includes(needle) ||
        (h.y_chinh || "").toLowerCase().includes(needle)
    );
  }, [q, items]);
  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm theo số quẻ, tên quẻ hoặc từ khóa… (ví dụ: 37, Gia Nhân, gia đình)"
        aria-label="Tìm quẻ"
      />
      <p className="mut small">
        {filtered.length ? `Hiển thị ${filtered.length} quẻ` : "Không tìm thấy quẻ nào khớp."}
      </p>
      <div className="grid64">
        {filtered.map((h) => (
          <Link key={h.number} href={`/que/${h.slug}`}>
            <div className="gnum">Quẻ {h.number}</div>
            <div className="gname">{h.name}</div>
            <HexFigure bits={h.bits} mini />
            <div className="gy">{h.y_chinh}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
