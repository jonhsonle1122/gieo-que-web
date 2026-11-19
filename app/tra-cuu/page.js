"use client";

import { useState } from "react";
import Link from "next/link";
import { ORDER_STATUSES, PACKAGES, formatVND } from "@/lib/config";
import { LINH_VUC } from "@/lib/luan";

export default function TraCuuPage() {
  const [code, setCode] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOrder(null);
    setBusy(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, contact }),
      });
      const data = await res.json();
      if (res.status === 503 && data.configured === false) {
        setNotConfigured(true);
      } else if (!res.ok || !data.ok) {
        setErr(data.error || "Không tra cứu được, vui lòng thử lại.");
      } else {
        setOrder(data.order);
      }
    } catch {
      setErr("Lỗi kết nối, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  const topicLabel = order
    ? (LINH_VUC[order.topic] ? LINH_VUC[order.topic].nhan : order.topic)
    : "";

  return (
    <div>
      <section className="hero">
        <div className="han-bg">查</div>
        <h1>Tra cứu đơn luận sâu</h1>
        <p className="lead">Nhập mã đơn và đúng thông tin liên hệ đã dùng khi đặt để xem trạng thái và nhận bài luận.</p>
      </section>

      {notConfigured ? (
        <div className="notice warn">
          <b>Hệ thống tra cứu chưa được cấu hình.</b> Chủ trang chưa kết nối Supabase nên chưa tra cứu trực
          tuyến được. Vui lòng liên hệ qua trang <Link href="/lien-he">Liên hệ</Link> kèm mã đơn của bạn.
        </div>
      ) : null}

      <form className="card" onSubmit={submit}>
        <label className="flabel" htmlFor="code">Mã đơn</label>
        <input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="Ví dụ: GQ-AB3K9Q" />
        <label className="flabel" htmlFor="contact">Thông tin liên hệ đã dùng khi đặt đơn</label>
        <input id="contact" type="text" value={contact} onChange={(e) => setContact(e.target.value)} required placeholder="Số Zalo hoặc email đã điền ở đơn" />
        {err ? <p className="form-err">{err}</p> : null}
        <button className="btn block" type="submit" disabled={busy} style={{ marginTop: 14 }}>
          {busy ? "Đang tra cứu…" : "Tra cứu"}
        </button>
      </form>

      {order ? (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div className="big-title">Đơn {order.code}</div>
            <span className="status-badge">{ORDER_STATUSES[order.status] || order.status}</span>
          </div>
          <p className="mut">
            {(PACKAGES.find((p) => p.id === order.package) || {}).name} · {formatVND(order.price)} · Lĩnh vực:{" "}
            {topicLabel} · Đặt lúc {new Date(order.created_at).toLocaleString("vi-VN")}
          </p>
          <p>
            <b>Câu hỏi:</b> {order.question}
          </p>
          {order.status === "cho_thanh_toan" ? (
            <p className="mut">
              Đơn đang chờ thanh toán. Nếu bạn đã chuyển khoản, vui lòng chờ xác nhận — hoặc liên hệ kèm mã đơn
              nếu quá lâu chưa đổi trạng thái.
            </p>
          ) : null}
          {order.status === "da_thanh_toan" || order.status === "dang_luan" ? (
            <p className="mut">Đơn đã được xác nhận, bài luận đang được soạn. Quay lại trang này sau để nhận bài.</p>
          ) : null}
          {order.status === "da_gui" && order.reading ? (
            <div>
              <h3 className="serif" style={{ color: "var(--gold-soft)" }}>Bài luận sâu của bạn</h3>
              <div className="reading-text">{order.reading}</div>
              <p className="mut small" style={{ marginTop: 10 }}>
                Nội dung luận giải chỉ mang tính tham khảo và chiêm nghiệm, không thay thế tư vấn chuyên môn.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
