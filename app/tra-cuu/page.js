"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ORDER_STATUSES, PACKAGES, formatVND } from "@/lib/config";
import { LINH_VUC } from "@/lib/luan";

// Các bước trạng thái hiển thị sống cho khách theo dõi đơn của mình.
const STEPS = ["Đã nhận đơn", "Đã xác nhận thanh toán", "Đang luận", "Đã gửi bài luận"];
const STATUS_STEP = { cho_thanh_toan: 0, da_thanh_toan: 1, dang_luan: 2, da_gui: 3 };

function StatusSteps({ status }) {
  const cur = STATUS_STEP[status] ?? 0;
  return (
    <div style={{ display: "flex", gap: 0, margin: "14px 0 6px", flexWrap: "wrap" }}>
      {STEPS.map((label, i) => {
        const done = i < cur || status === "da_gui";
        const active = i === cur && status !== "da_gui";
        return (
          <div key={label} style={{ flex: "1 1 120px", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                flexShrink: 0,
                background: done ? "var(--gold)" : "var(--panel2)",
                color: done ? "#171410" : active ? "var(--gold-soft)" : "var(--muted)",
                border: active ? "1px solid var(--gold)" : "1px solid var(--line)",
                fontWeight: 700,
              }}
            >
              {done ? "✓" : i + 1}
            </span>
            <span style={{ fontSize: 13, color: done || active ? "var(--text)" : "var(--muted)" }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function TraCuuPage() {
  const [code, setCode] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [live, setLive] = useState(false); // đang nghe realtime hoặc đang tự hỏi lại
  const credsRef = useRef(null); // { code, contact } của lần tra cứu thành công gần nhất
  const realtimeRef = useRef(false);

  const doLookup = useCallback(async (codeVal, contactVal, silent = false) => {
    if (!silent) setBusy(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeVal, contact: contactVal }),
      });
      const data = await res.json();
      if (res.status === 503 && data.configured === false) {
        setNotConfigured(true);
        return null;
      }
      if (!res.ok || !data.ok) {
        if (!silent) setErr(data.error || "Không tra cứu được, vui lòng thử lại.");
        return null;
      }
      setOrder(data.order);
      return data.order;
    } catch {
      if (!silent) setErr("Lỗi kết nối, vui lòng thử lại.");
      return null;
    } finally {
      if (!silent) setBusy(false);
    }
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOrder(null);
    realtimeRef.current = false;
    setLive(false);
    const found = await doLookup(code, contact);
    if (found) credsRef.current = { code, contact };
  }

  const delivered = order && order.status === "da_gui";

  // Realtime: đăng ký nghe kênh riêng của đơn (Supabase Realtime Broadcast).
  // Nhận tín hiệu "order-updated" thì tự tra cứu lại để lấy dữ liệu chuẩn.
  // Thiếu cấu hình công khai hoặc nghe lỗi -> lùi về hỏi lại mỗi 30 giây.
  useEffect(() => {
    if (!order || delivered || !order.channel) return;
    let cancelled = false;
    let channel = null;
    let sb = null;
    (async () => {
      try {
        const res = await fetch("/api/public-config");
        const cfg = await res.json();
        if (cancelled || !cfg.supabaseUrl || !cfg.anonKey) return;
        sb = createClient(cfg.supabaseUrl, cfg.anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        channel = sb
          .channel(order.channel)
          .on("broadcast", { event: "order-updated" }, () => {
            const c = credsRef.current;
            if (c) doLookup(c.code, c.contact, true);
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED" && !cancelled) {
              realtimeRef.current = true;
              setLive(true);
            }
          });
      } catch {
        // bỏ qua — polling dự phòng bên dưới vẫn chạy
      }
    })();
    return () => {
      cancelled = true;
      realtimeRef.current = false;
      if (sb && channel) sb.removeChannel(channel);
    };
  }, [order?.channel, delivered, doLookup]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dự phòng: khi chưa có realtime, tự tra cứu lại mỗi 30 giây trong lúc
  // trang đang mở và đơn chưa giao bài.
  useEffect(() => {
    if (!order || delivered) return;
    setLive(true);
    const t = setInterval(() => {
      if (realtimeRef.current) return; // realtime đang chạy thì khỏi hỏi lại
      const c = credsRef.current;
      if (c) doLookup(c.code, c.contact, true);
    }, 30000);
    return () => clearInterval(t);
  }, [order?.code, delivered, doLookup]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <StatusSteps status={order.status} />
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
            <p className="mut">Đơn đã được xác nhận, bài luận đang được soạn. Trang này sẽ tự hiện bài khi soạn xong — bạn cứ để mở trang, không cần tải lại.</p>
          ) : null}
          {!delivered && live ? (
            <p className="mut small">● Trang đang tự cập nhật trạng thái đơn của bạn.</p>
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
