"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ORDER_STATUSES, formatVND } from "@/lib/config";
import { LINH_VUC } from "@/lib/luan";
import { AnQueTable, MiniHexCard, HexMeaning } from "@/components/CastResult";
import HexFigure from "@/components/HexFigure";

const STATUS_KEYS = Object.keys(ORDER_STATUSES);

const EVENT_LABELS = {
  created: "Tạo đơn",
  status_changed: "Đổi trạng thái",
  paid_marked: "Đánh dấu đã thanh toán",
  draft_requested: "Yêu cầu Muse soạn nháp",
  draft_written: "Muse đã ghi nháp",
  reading_attached: "Gắn bài luận",
  delivered: "Đã gửi bài cho khách",
  customer_notified: "Đã báo khách",
};

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

// Khối xem quẻ đầy đủ trong chi tiết đơn (GĐ1): dùng lại AnQueTable /
// MiniHexCard / HexMeaning của CastResult + bài luận cơ bản từ cast_json.luan.
// cast_json không có kết quả engine (đơn không gắn quẻ) thì lùi về tóm tắt chữ.
function OrderCastView({ cj }) {
  const r = cj && typeof cj === "object" ? cj.result : null;
  if (!r || !r.que_chu || !r.que_chu.an_que) {
    return <pre className="snapshot">{castSummary(cj)}</pre>;
  }
  const aq = r.que_chu.an_que;
  const luan = cj.luan || null;
  const diem = luan ? (luan.diem && typeof luan.diem === "object" ? luan.diem.tong : luan.diem_tong) : null;
  return (
    <div>
      <p className="mut small">
        {cj.method === "mai-hoa" ? "Mai Hoa theo giờ" : "Lục Hào 3 xu"}
        {r.day_stem ? ` · Ngày ${r.day_stem} ${r.day_branch || ""}` : ""}
        {r.month_branch ? ` · Tháng ${r.month_branch}` : ""}
        {r.tuan_khong ? ` · Tuần Không: ${r.tuan_khong.join(", ")}` : ""}
      </p>
      <div className="big-title" style={{ fontSize: "1.15rem" }}>
        Quẻ {r.que_chu.number} · {r.que_chu.name}
      </div>
      <HexFigure bits={r.que_chu.bits} dongList={r.hao_dong || []} />
      <p className="mut small center">
        Cung {aq.palace} ({aq.palace_element}) · {aq.loai} · Thế hào {aq.the} · Ứng hào {aq.ung}
      </p>
      <AnQueTable aq={aq} dongList={r.hao_dong || []} />
      <HexMeaning number={r.que_chu.number} />
      {luan ? (
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 10 }}>
          <div className="big-title" style={{ fontSize: "1.05rem" }}>Luận cơ bản</div>
          <p className="mut">
            Kết luận tầng cơ bản: <b>{luan.ket_luan}</b>
            {diem !== null && diem !== undefined ? ` · Điểm tổng hợp: ${diem}` : ""}
          </p>
          {(luan.van_ban || "").split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {luan.ghi_chu && luan.ghi_chu.length ? <p className="mut small">{luan.ghi_chu.join(" ")}</p> : null}
        </div>
      ) : null}
      <div className="mini-cards">
        {r.que_bien ? <MiniHexCard title="Quẻ biến" hex={r.que_bien} /> : null}
        {r.que_ho ? <MiniHexCard title="Quẻ hỗ" hex={r.que_ho} /> : null}
      </div>
      {r.que_bien && r.que_bien.an_que ? (
        <details>
          <summary className="mut" style={{ cursor: "pointer" }}>Bảng an quẻ của quẻ biến</summary>
          <AnQueTable aq={r.que_bien.an_que} dongList={[]} />
        </details>
      ) : null}
    </div>
  );
}

// Dòng thời gian nhật ký thao tác của đơn (bảng order_events).
function OrderTimeline({ events }) {
  if (!events || events.length === 0) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <label className="flabel">Nhật ký thao tác</label>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {events.map((ev, i) => (
          <li key={i} className="mut" style={{ marginBottom: 4 }}>
            {new Date(ev.created_at).toLocaleString("vi-VN")} · <b>{ev.actor_label}</b> ·{" "}
            {EVENT_LABELS[ev.action] || ev.action}
            {ev.detail && ev.detail.from_status
              ? ` (${ORDER_STATUSES[ev.detail.from_status] || ev.detail.from_status} → ${
                  ORDER_STATUSES[ev.detail.to_status] || ev.detail.to_status
                })`
              : ""}
            {ev.detail && ev.detail.from_draft ? " (từ bài nháp)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
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
      setMsg(data.warning || "Đã cập nhật đơn " + data.order.code + ".");
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
            <b>Quẻ của khách:</b>
          </p>
          <OrderCastView cj={selected.cast_json} />
          <details>
            <summary className="mut" style={{ cursor: "pointer" }}>Dữ liệu gốc (JSON quẻ đầy đủ)</summary>
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

          {selected.status === "da_thanh_toan" || selected.status === "dang_luan" ? (
            <div style={{ borderTop: "1px solid var(--line)", marginTop: 16, paddingTop: 12 }}>
              <label className="flabel">Bài nháp của Muse (hàng chờ soạn — duyệt trong chat với Muse)</label>
              {selected.draft_reading ? (
                <div>
                  <textarea value={selected.draft_reading} readOnly style={{ minHeight: 180 }} />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <button className="btn small" disabled={busy} onClick={() => setReading(selected.draft_reading)}>
                      Chép nháp vào ô bài luận
                    </button>
                    <button
                      className="btn small ghost"
                      disabled={busy}
                      onClick={() => patch({ id: selected.id, draft_request: true })}
                    >
                      Yêu cầu soạn lại
                    </button>
                  </div>
                  <p className="mut small">
                    Nháp chỉ hiển thị tại đây — khách không thấy được. Duyệt bài vẫn thực hiện trong chat với
                    Muse như quy trình hiện nay.
                  </p>
                </div>
              ) : selected.draft_requested_at ? (
                <p className="mut">
                  Đã yêu cầu lúc {new Date(selected.draft_requested_at).toLocaleString("vi-VN")} — chờ Muse
                  soạn. Bộ canh chạy mỗi 15 phút, khung soạn 07:00–22:45; ngoài khung giờ, sáng hôm sau mới có
                  nháp.
                </p>
              ) : (
                <button
                  className="btn small"
                  disabled={busy}
                  onClick={() => patch({ id: selected.id, draft_request: true })}
                >
                  Yêu cầu Muse soạn nháp
                </button>
              )}
            </div>
          ) : null}

          <OrderTimeline events={selected.events} />
        </div>
      ) : null}
    </div>
  );
}
