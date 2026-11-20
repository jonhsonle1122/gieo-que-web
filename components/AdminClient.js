"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ORDER_STATUSES, formatVND, ETA_HOURS, STUCK_HOURS, LOOKUP_URL, zaloNotifyMessage } from "@/lib/config";
import { LINH_VUC } from "@/lib/luan";
import { AnQueTable, MiniHexCard, HexMeaning } from "@/components/CastResult";
import HexFigure from "@/components/HexFigure";

const STATUS_KEYS = Object.keys(ORDER_STATUSES);

// Vai quản trị (GĐ3): owner = Chủ, reader = Luận viên, viewer = Chỉ xem.
const ROLE_LABELS = { owner: "Chủ", reader: "Luận viên", viewer: "Chỉ xem" };
const ROLE_KEYS = ["owner", "reader", "viewer"];

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

// Hạn giao tính từ lúc TẠO ĐƠN (quyết định đã chốt): standard 24 giờ,
// priority 6 giờ. Đơn chưa giao bài: trả thông tin đếm ngược + cờ "treo"
// (chờ thanh toán quá 48 giờ). Đơn đã gửi: null (không còn hạn).
function deadlineInfo(o, nowMs) {
  if (!o || o.status === "da_gui") return null;
  const etaH = ETA_HOURS[o.package] || ETA_HOURS.standard;
  const created = new Date(o.created_at).getTime();
  const remainMs = created + etaH * 3600000 - nowMs;
  return {
    remainMs,
    overdue: remainMs < 0,
    warn: remainMs >= 0 && remainMs < 2 * 3600000,
    stuck: o.status === "cho_thanh_toan" && nowMs - created > STUCK_HOURS * 3600000,
  };
}

function fmtDuration(ms) {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  if (h >= 1) return `${h} giờ ${m} phút`;
  return `${Math.max(m, 1)} phút`;
}

function DeadlineBadge({ info }) {
  if (!info) return null;
  const color = info.overdue ? "var(--red)" : info.warn ? "var(--gold)" : "var(--green)";
  return (
    <>
      {" · "}
      <span style={{ color, fontWeight: 600 }}>
        {info.overdue ? `QUÁ HẠN ${fmtDuration(info.remainMs)}` : `còn ${fmtDuration(info.remainMs)}`}
      </span>
      {info.stuck ? (
        <span style={{ color: "var(--red)", fontWeight: 600 }}> · treo — chờ thanh toán lâu</span>
      ) : null}
    </>
  );
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

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

// Tab Thống kê (Khối 3 — GĐ2): số liệu từ /api/admin/stats + /api/admin/casts.
function StatsView({ token }) {
  const [stats, setStats] = useState(null);
  const [casts, setCasts] = useState([]);
  const [err, setErr] = useState("");
  const [days, setDays] = useState(14);

  const load = useCallback(async () => {
    setErr("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [rs, rc] = await Promise.all([
        fetch(`/api/admin/stats?days=${days}`, { headers }),
        fetch(`/api/admin/casts?limit=50`, { headers }),
      ]);
      const ds = await rs.json();
      const dc = await rc.json();
      if (!rs.ok || !ds.ok) setErr(ds.error || "Không tải được thống kê.");
      else setStats(ds);
      if (rc.ok && dc.ok) setCasts(dc.casts || []);
    } catch {
      setErr("Lỗi kết nối khi tải thống kê.");
    }
  }, [token, days]);

  useEffect(() => {
    load();
  }, [load]);

  if (err) return <p className="form-err">{err}</p>;
  if (!stats) return <p className="mut">Đang tải thống kê…</p>;

  const gateBar = (g) => Math.min(100, Math.round((g.current / g.target) * 100));
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
        {[14, 30].map((d) => (
          <button key={d} className={"btn small" + (days === d ? "" : " ghost")} onClick={() => setDays(d)}>
            {d} ngày
          </button>
        ))}
        <button className="btn small ghost" onClick={load}>Tải lại</button>
      </div>

      <div className="card">
        <div className="big-title" style={{ fontSize: "1.1rem" }}>Cổng Phase 0</div>
        {[
          ["Tổng lượt gieo", stats.gates.casts],
          ["Tổng đơn luận sâu", stats.gates.orders],
        ].map(([label, g]) => (
          <div key={label} style={{ margin: "10px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{label}</span>
              <b>
                {g.current} / {g.target}
              </b>
            </div>
            <div style={{ height: 10, background: "var(--panel2)", borderRadius: 6, overflow: "hidden", marginTop: 4 }}>
              <div style={{ height: "100%", width: gateBar(g) + "%", background: "var(--gold)" }} />
            </div>
          </div>
        ))}
        <p className="mut">
          Trong {stats.days} ngày gần nhất: {stats.casts_in_window} lượt gieo · {stats.orders_in_window} đơn ·
          tỉ lệ gieo → đơn{" "}
          {stats.conversion_window === null ? "—" : (stats.conversion_window * 100).toFixed(1) + "%"}{" "}
          <span className="small">(chỉ số tương đối — một khách gieo nhiều lần rồi mới đặt 1 đơn)</span>
        </p>
      </div>

      <div className="card">
        <div className="big-title" style={{ fontSize: "1.1rem" }}>Doanh thu &amp; đơn theo trạng thái</div>
        <p>
          Đã xác nhận: <b>{formatVND(stats.revenue_confirmed)}</b> (tiêu chuẩn{" "}
          {formatVND(stats.revenue_by_package.standard)} · ưu tiên {formatVND(stats.revenue_by_package.priority)})
          <br />
          Đang chờ thanh toán: <b>{formatVND(stats.revenue_pending)}</b>
        </p>
        <p className="mut">
          {Object.entries(stats.orders_by_status)
            .map(([s, n]) => `${ORDER_STATUSES[s] || s}: ${n}`)
            .join(" · ")}
        </p>
      </div>

      <div className="card">
        <div className="big-title" style={{ fontSize: "1.1rem" }}>Lượt gieo theo ngày</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Ngày</th>
              <th style={{ textAlign: "right", padding: "4px 6px" }}>Tổng</th>
              <th style={{ textAlign: "right", padding: "4px 6px" }}>Lục Hào</th>
              <th style={{ textAlign: "right", padding: "4px 6px" }}>Mai Hoa</th>
            </tr>
          </thead>
          <tbody>
            {stats.casts_by_day.map((d) => (
              <tr key={d.date} style={{ borderTop: "1px solid var(--line-soft)" }}>
                <td style={{ padding: "4px 6px" }}>{d.date}</td>
                <td style={{ textAlign: "right", padding: "4px 6px" }}>{d.total}</td>
                <td style={{ textAlign: "right", padding: "4px 6px" }}>{d.luc_hao}</td>
                <td style={{ textAlign: "right", padding: "4px 6px" }}>{d.mai_hoa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="big-title" style={{ fontSize: "1.1rem" }}>50 lượt gieo gần nhất</div>
        {casts.length === 0 ? <p className="mut">Chưa có lượt gieo nào.</p> : null}
        {casts.map((c) => (
          <p key={c.id} className="mut" style={{ margin: "6px 0" }}>
            {new Date(c.created_at).toLocaleString("vi-VN")} ·{" "}
            {(LINH_VUC[c.topic] || {}).nhan || c.topic || "—"} ·{" "}
            {c.method === "mai-hoa" ? "Mai Hoa" : "Lục Hào"} · {c.question || "(không có câu hỏi)"}
          </p>
        ))}
      </div>
    </div>
  );
}

// Tab Người dùng (Khối 4 — GĐ3): chỉ Chủ (owner) mở được — server cũng
// chặn riêng ở /api/admin/users, ẩn tab ở đây chỉ là lớp trình bày.
function UsersView({ token, myUserId }) {
  const [users, setUsers] = useState(null);
  const [err, setErr] = useState("");
  const [needsMigration, setNeedsMigration] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("reader");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr("");
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.needs_migration) {
        setNeedsMigration(true);
        setErr(data.error || "");
        return;
      }
      if (!res.ok || !data.ok) {
        setErr(data.error || "Không tải được danh sách người dùng.");
        return;
      }
      setUsers(data.users || []);
    } catch {
      setErr("Lỗi kết nối khi tải danh sách người dùng.");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function invite(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg(data.error || "Gửi lời mời thất bại.");
        return;
      }
      setMsg(data.message || "Đã thêm người dùng.");
      setInviteEmail("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function patchUser(userId, changes) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, ...changes }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg(data.error || "Cập nhật thất bại.");
        return;
      }
      setMsg("Đã cập nhật tài khoản " + data.user.email + ".");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (needsMigration) {
    return (
      <div className="notice warn" style={{ marginTop: 12 }}>
        <b>Chưa chạy migration GĐ3.</b> {err} Tính năng phân quyền chưa bật — admin vẫn chạy theo cơ
        chế cũ (chỉ email trong ADMIN_EMAILS vào được, vai Chủ).
      </div>
    );
  }
  if (err) return <p className="form-err">{err}</p>;
  if (!users) return <p className="mut">Đang tải danh sách người dùng…</p>;

  return (
    <div>
      <form className="card" onSubmit={invite} style={{ marginTop: 12 }}>
        <div className="big-title" style={{ fontSize: "1.1rem" }}>Mời người dùng mới</div>
        <p className="mut small">
          Hệ thống gửi email mời qua Supabase Auth. Người được mời bấm link trong email để vào trang
          quản trị (đã đăng nhập sẵn), rồi đặt mật khẩu ở mục “Đổi mật khẩu” trên đầu trang. Không
          cần chia sẻ mật khẩu với ai.
        </p>
        <label className="flabel" htmlFor="invite-email">Email người được mời</label>
        <input
          id="invite-email"
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          required
          placeholder="ten@vidu.com"
        />
        <label className="flabel" htmlFor="invite-role">Vai</label>
        <select id="invite-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
          {ROLE_KEYS.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        {msg ? <p className="mut">{msg}</p> : null}
        <button className="btn" type="submit" disabled={busy} style={{ marginTop: 12 }}>
          Gửi lời mời
        </button>
      </form>

      <div className="card">
        <div className="big-title" style={{ fontSize: "1.1rem" }}>Tài khoản quản trị ({users.length})</div>
        {users.map((u) => {
          const isSelf = u.user_id === myUserId;
          return (
            <div
              key={u.user_id}
              style={{ borderTop: "1px solid var(--line-soft)", padding: "10px 0" }}
            >
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <b>{u.email}</b>
                {isSelf ? <span className="status-badge">Bạn</span> : null}
                <span className="status-badge" style={u.active ? undefined : { color: "var(--red)" }}>
                  {u.active ? "Đang hoạt động" : "Đã khóa"}
                </span>
              </div>
              <p className="mut small" style={{ margin: "4px 0" }}>
                Tạo lúc {new Date(u.created_at).toLocaleString("vi-VN")}
                {u.last_sign_in_at
                  ? ` · Đăng nhập gần nhất ${new Date(u.last_sign_in_at).toLocaleString("vi-VN")}`
                  : " · Chưa đăng nhập lần nào"}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <select
                  value={u.role}
                  disabled={busy || isSelf}
                  title={isSelf ? "Không tự đổi vai của chính mình" : "Đổi vai"}
                  onChange={(e) => patchUser(u.user_id, { role: e.target.value })}
                >
                  {ROLE_KEYS.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <button
                  className="btn small ghost"
                  disabled={busy || isSelf}
                  title={isSelf ? "Không tự khóa tài khoản của chính mình" : u.active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                  onClick={() => patchUser(u.user_id, { active: !u.active })}
                >
                  {u.active ? "Khóa tài khoản" : "Mở khóa"}
                </button>
              </div>
            </div>
          );
        })}
        <p className="mut small">
          Tài khoản bị khóa không xử lý được gì trong admin (mọi API đều từ chối), nhật ký thao tác
          cũ của họ vẫn giữ nguyên. Không thể tự hạ vai/tự khóa chính mình, không hạ vai hoặc khóa
          được Chủ cuối cùng đang hoạt động, và tài khoản Chủ gốc chỉ do chính chủ tài khoản thay đổi.
        </p>
      </div>
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
  const [view, setView] = useState("orders"); // orders | stats | users
  const [priorityMode, setPriorityMode] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  // Vai của chính mình (GĐ3) — lấy từ /api/admin/me sau khi đăng nhập.
  // Quyền thật do server chốt; ở đây chỉ để hiện vai + ẩn nút cho gọn.
  const [me, setMe] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  // Đồng hồ chạy cho nhãn đếm ngược hạn giao (cập nhật mỗi 30 giây).
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Chế độ "Ưu tiên xử lý": đơn quá hạn lên đầu, rồi sắp hết hạn, đã gửi xuống cuối.
  const displayOrders = useMemo(() => {
    if (!priorityMode) return orders;
    const key = (o) => {
      const info = deadlineInfo(o, nowMs);
      if (!info) return Number.MAX_SAFE_INTEGER;
      return info.remainMs;
    };
    return [...orders].sort((a, b) => key(a) - key(b));
  }, [orders, priorityMode, nowMs]);

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

  // Lấy vai của chính mình để hiện ở đầu trang + khóa thao tác sửa đơn
  // với vai Chỉ xem (server vẫn chặn riêng ở từng API).
  useEffect(() => {
    if (!session) {
      setMe(null);
      return;
    }
    let cancelled = false;
    fetch("/api/admin/me", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d && d.ok) setMe({ email: d.email, role: d.role, userId: d.userId });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session]);

  const myRole = me ? me.role : null;
  const canEdit = myRole !== "viewer"; // viewer: chỉ xem, khóa mọi nút sửa đơn

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg("");
    if (newPw.length < 6) {
      setPwMsg("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }
    const { error } = await sb.auth.updateUser({ password: newPw });
    if (error) {
      setPwMsg("Đổi mật khẩu thất bại: " + error.message);
    } else {
      setPwMsg("Đã đặt mật khẩu mới. Lần sau đăng nhập bằng email + mật khẩu này.");
      setNewPw("");
      setShowPw(false);
    }
  }

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
          <p className="lead">Chỉ tài khoản quản trị đã được cấp vai (Chủ / Luận viên / Chỉ xem) mới xem và xử lý được đơn.</p>
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
          Đăng nhập: {session.user.email}
          {myRole ? (
            <>
              {" "}· Vai: <b>{ROLE_LABELS[myRole] || myRole}</b>
            </>
          ) : null}{" "}
          ·{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); setShowPw((v) => !v); setPwMsg(""); }}>
            Đổi mật khẩu
          </a>{" "}
          ·{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); sb.auth.signOut(); }}>
            Đăng xuất
          </a>
        </p>
        {showPw ? (
          <form onSubmit={changePassword} style={{ maxWidth: 440, margin: "10px auto" }}>
            <label className="flabel" htmlFor="newpw">Mật khẩu mới (ít nhất 6 ký tự)</label>
            <input
              id="newpw"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              autoComplete="new-password"
            />
            {pwMsg ? <p className="mut">{pwMsg}</p> : null}
            <button className="btn small" type="submit" style={{ marginTop: 8 }}>Lưu mật khẩu mới</button>
          </form>
        ) : pwMsg ? (
          <p className="mut">{pwMsg}</p>
        ) : null}
      </section>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
        <button className={"btn small" + (view === "orders" ? "" : " ghost")} onClick={() => setView("orders")}>
          Đơn hàng
        </button>
        <button className={"btn small" + (view === "stats" ? "" : " ghost")} onClick={() => setView("stats")}>
          Thống kê
        </button>
        {myRole === "owner" ? (
          <button className={"btn small" + (view === "users" ? "" : " ghost")} onClick={() => setView("users")}>
            Người dùng
          </button>
        ) : null}
      </div>

      {view === "users" && myRole === "owner" ? (
        <UsersView token={session.access_token} myUserId={session.user.id} />
      ) : view === "stats" ? (
        <StatsView token={session.access_token} />
      ) : (
        <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
        <button className={"btn small" + (filter === "" ? "" : " ghost")} onClick={() => setFilter("")}>
          Tất cả
        </button>
        {STATUS_KEYS.map((s) => (
          <button key={s} className={"btn small" + (filter === s ? "" : " ghost")} onClick={() => setFilter(s)}>
            {ORDER_STATUSES[s]}
          </button>
        ))}
        <button
          className={"btn small" + (priorityMode ? "" : " ghost")}
          onClick={() => setPriorityMode((v) => !v)}
          title="Đơn quá hạn và sắp đến hạn giao lên đầu"
        >
          Ưu tiên xử lý
        </button>
        <button className="btn small ghost" onClick={loadOrders}>Tải lại</button>
      </div>
      {msg ? <p className="mut">{msg}</p> : null}

      <div className="admin-list">
        {displayOrders.length === 0 ? <p className="mut">Chưa có đơn nào ở trạng thái này.</p> : null}
        {displayOrders.map((o) => (
          <button
            key={o.id}
            className={"admin-item" + (selected && selected.id === o.id ? " on" : "")}
            onClick={() => setSelected(o)}
          >
            <b>{o.code}</b> · {o.name} · {o.contact} · {formatVND(o.price)} ·{" "}
            <span className="status-badge">{ORDER_STATUSES[o.status] || o.status}</span>
            <DeadlineBadge info={deadlineInfo(o, nowMs)} />
            <br />
            <span className="mut">
              {(LINH_VUC[o.topic] || {}).nhan || o.topic} · {new Date(o.created_at).toLocaleString("vi-VN")} ·{" "}
              {o.question.slice(0, 90)}
              {o.question.length > 90 ? "…" : ""}
            </span>
          </button>
        ))}
      </div>
        </>
      )}

      {selected ? (
        <div className="card">
          <div className="big-title">Đơn {selected.code}</div>
          {!canEdit ? (
            <p className="mut" style={{ color: "var(--gold)" }}>
              Bạn đang ở vai <b>Chỉ xem</b> — xem được đơn và thống kê nhưng không thay đổi được đơn
              (server cũng chặn mọi thao tác sửa với vai này).
            </p>
          ) : null}
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
                disabled={busy || !canEdit || selected.status === s}
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
            readOnly={!canEdit}
            style={{ minHeight: 220 }}
            placeholder="Soạn bài luận theo khung: kết luận → căn cứ (Dụng thần, vượng suy, hào động, phục thần) → ứng kỳ → nên làm / nên tránh…"
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button className="btn" disabled={busy || !canEdit} onClick={() => patch({ id: selected.id, reading })}>
              Lưu bài luận
            </button>
            <button
              className="btn"
              disabled={busy || !canEdit || !reading.trim()}
              onClick={() => patch({ id: selected.id, reading, status: "da_gui" })}
            >
              Lưu &amp; đánh dấu đã gửi
            </button>
          </div>

          {selected.status === "da_gui" ? (
            <div style={{ borderTop: "1px solid var(--line)", marginTop: 16, paddingTop: 12 }}>
              <label className="flabel">Báo khách nhận bài (Zalo — gửi tay)</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="btn small"
                  onClick={async () => {
                    const ok = await copyToClipboard(zaloNotifyMessage(selected));
                    setMsg(ok ? "Đã chép mẫu tin nhắn Zalo — dán vào Zalo của khách để gửi." : "Không chép được, hãy thử lại.");
                  }}
                >
                  Copy mẫu tin nhắn Zalo
                </button>
                <button
                  className="btn small ghost"
                  onClick={async () => {
                    const ok = await copyToClipboard(LOOKUP_URL);
                    setMsg(ok ? "Đã chép link tra cứu." : "Không chép được, hãy thử lại.");
                  }}
                >
                  Copy link tra cứu
                </button>
                <button
                  className="btn small ghost"
                  disabled={busy || !canEdit}
                  onClick={() => patch({ id: selected.id, customer_notified: true })}
                >
                  Đã báo khách
                </button>
              </div>
              <p className="mut small">
                Mẫu tin gồm tên khách, mã đơn và link tra cứu kèm hướng dẫn nhập mã + liên hệ. Nút “Đã báo
                khách” chỉ ghi vào nhật ký thao tác, không đổi trạng thái đơn.
              </p>
            </div>
          ) : null}

          {selected.status === "da_thanh_toan" || selected.status === "dang_luan" ? (
            <div style={{ borderTop: "1px solid var(--line)", marginTop: 16, paddingTop: 12 }}>
              <label className="flabel">Bài nháp của Muse (hàng chờ soạn — duyệt trong chat với Muse)</label>
              {selected.draft_reading ? (
                <div>
                  <textarea value={selected.draft_reading} readOnly style={{ minHeight: 180 }} />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <button className="btn small" disabled={busy || !canEdit} onClick={() => setReading(selected.draft_reading)}>
                      Chép nháp vào ô bài luận
                    </button>
                    <button
                      className="btn small ghost"
                      disabled={busy || !canEdit}
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
                  disabled={busy || !canEdit}
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
