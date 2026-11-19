"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ORDER_STATUSES, formatVND } from "@/lib/config";
import { LINH_VUC } from "@/lib/luan";

const STATUS_KEYS = Object.keys(ORDER_STATUSES);

function castSummary(cj) {
  if (!cj || typeof cj !== "object") return "Không có quẻ gắn kèm.";
  const r = cj.result;
  const lines = [];
  lines.push(`Cách gieo: ${cj.method === "mai-hoa" ? "Mai Hoa theo giờ" : "Lục Hào 3 xu"}`);
  if (cj.question) lines.push(`Câu hỏi lúc gieo: ${cj.question}`);
  if (cj.dayStem) lines.push(`Ngày ${cj.dayStem} ${cj.dayBranch || ""} · Tháng ${cj.monthBranch || ""}`);
  if (r && r.que_chu) {
    lines.push(
      `Quẻ chủ: ${r.que_chu.number} · ${r.que_chu.name}` +
        (r.que_bien ? ` → biến: ${r.que_bien.number} · ${r.que_bien.name}` : "") +
        (r.que_ho ? ` · hỗ: ${r.que_ho.number} · ${r.que_ho.name}` : "")
    );
    if (Array.isArray(r.hao_dong)) lines.push(`Hào động: ${r.hao_dong.length ? r.hao_dong.join(", ") : "không có (quẻ tĩnh)"}`);
    if (r.tuan_khong) lines.push(`Tuần Không: ${r.tuan_khong.join(", ")}`);
  }
  if (cj.luan) lines.push(`Luận cơ bản: ${cj.luan.ket_luan} (điểm ${cj.luan.diem_tong})`);
  return lines.join("\n");
}

export default function AdminClient({ supabaseUrl, anonKey, configured }) {
  const sb = useMemo(
    () => (supabaseUrl && anonKey ? createClient(supabaseUrl, anonKey) : null),
    [supabaseUrl, anonKey]
  );
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [reading, setReading] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  const loadOrders = useCallback(async () => {
    if (!session) return;
    setMsg("");
    const qs = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/orders${qs}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setMsg(data.error || "Không tải được danh sách đơn.");
      setOrders([]);
      return;
    }
    setOrders(data.orders);
  }, [session, filter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (selected) setReading(selected.reading || "");
  }, [selected]);

  async function login(e) {
    e.preventDefault();
    setLoginErr("");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) setLoginErr("Đăng nhập thất bại: " + error.message);
  }

  async function patch(body) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg(data.error || "Cập nhật thất bại.");
        return null;
      }
      setMsg("Đã cập nhật đơn " + data.order.code + ".");
      setSelected(data.order);
      await loadOrders();
      return data.order;
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div>
        <section className="hero">
          <h1>Quản trị</h1>
        </section>
        <div className="notice warn">
          <b>Chưa cấu hình Supabase.</b> Trang quản trị cần các biến môi trường NEXT_PUBLIC_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY và ADMIN_EMAILS. Xem BUILD_NOTES.md để biết
          cách thiết lập.
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <section className="hero">
          <h1>Đăng nhập quản trị</h1>
          <p className="lead">Chỉ tài khoản có email trong danh sách ADMIN_EMAILS mới xem và xử lý được đơn.</p>
        </section>
        <form className="card" onSubmit={login} style={{ maxWidth: 440, margin: "16px auto" }}>
          <label className="flabel" htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="flabel" htmlFor="password">Mật khẩu</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {loginErr ? <p className="form-err">{loginErr}</p> : null}
          <button className="btn block" type="submit" style={{ marginTop: 14 }}>Đăng nhập</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <section className="hero">
        <h1>Đơn luận sâu</h1>
        <p className="lead">
          Đăng nhập: {session.user.email} ·{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); sb.auth.signOut(); }}>
            Đăng xuất
          </a>
        </p>
      </section>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
        <button className={"btn small" + (filter === "" ? "" : " ghost")} onClick={() => setFilter("")}>
          Tất cả
        </button>
        {STATUS_KEYS.map((s) => (
          <button key={s} className={"btn small" + (filter === s ? "" : " ghost")} onClick={() => setFilter(s)}>
            {ORDER_STATUSES[s]}
          </button>
        ))}
        <button className="btn small ghost" onClick={loadOrders}>Tải lại</button>
      </div>
      {msg ? <p className="mut">{msg}</p> : null}

      <div className="admin-list">
        {orders.length === 0 ? <p className="mut">Chưa có đơn nào ở trạng thái này.</p> : null}
        {orders.map((o) => (
          <button
            key={o.id}
            className={"admin-item" + (selected && selected.id === o.id ? " on" : "")}
            onClick={() => setSelected(o)}
          >
            <b>{o.code}</b> · {o.name} · {o.contact} · {formatVND(o.price)} ·{" "}
            <span className="status-badge">{ORDER_STATUSES[o.status] || o.status}</span>
            <br />
            <span className="mut">
              {(LINH_VUC[o.topic] || {}).nhan || o.topic} · {new Date(o.created_at).toLocaleString("vi-VN")} ·{" "}
              {o.question.slice(0, 90)}
              {o.question.length > 90 ? "…" : ""}
            </span>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="card">
          <div className="big-title">Đơn {selected.code}</div>
          <p className="mut">
            {selected.name} · {selected.contact} · {formatVND(selected.price)} · Gói {selected.package} ·
            Đặt lúc {new Date(selected.created_at).toLocaleString("vi-VN")}
          </p>
          <p>
            <b>Câu hỏi:</b> {selected.question}
          </p>
          <p>
            <b>Ảnh chụp quẻ:</b>
          </p>
          <pre className="snapshot">{castSummary(selected.cast_json)}</pre>
          <details>
            <summary className="mut" style={{ cursor: "pointer" }}>JSON quẻ đầy đủ</summary>
            <pre className="snapshot">{JSON.stringify(selected.cast_json, null, 1)}</pre>
          </details>

          <label className="flabel">Chuyển trạng thái</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUS_KEYS.map((s) => (
              <button
                key={s}
                className={"btn small" + (selected.status === s ? "" : " ghost")}
                disabled={busy || selected.status === s}
                onClick={() => patch({ id: selected.id, status: s })}
              >
                {ORDER_STATUSES[s]}
              </button>
            ))}
          </div>

          <label className="flabel" htmlFor="reading">Bài luận sâu (dán vào đây, khách đọc tại trang tra cứu sau khi đơn ở trạng thái “Đã gửi”)</label>
          <textarea
            id="reading"
            value={reading}
            onChange={(e) => setReading(e.target.value)}
            style={{ minHeight: 220 }}
            placeholder="Soạn bài luận theo khung: kết luận → căn cứ (Dụng thần, vượng suy, hào động, phục thần) → ứng kỳ → nên làm / nên tránh…"
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button className="btn" disabled={busy} onClick={() => patch({ id: selected.id, reading })}>
              Lưu bài luận
            </button>
            <button
              className="btn"
              disabled={busy || !reading.trim()}
              onClick={() => patch({ id: selected.id, reading, status: "da_gui" })}
            >
              Lưu &amp; đánh dấu đã gửi
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
