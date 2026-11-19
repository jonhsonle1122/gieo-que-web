"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PACKAGES, formatVND } from "@/lib/config";
import { LINH_VUC } from "@/lib/luan";

const TOPICS = Object.entries(LINH_VUC).map(([key, v]) => ({
  key,
  label: v.nhan.charAt(0).toUpperCase() + v.nhan.slice(1),
}));

export default function LuanSauPage() {
  const [cfg, setCfg] = useState(null); // { configured, bankConfigured, ... }
  const [snapshot, setSnapshot] = useState(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState("cong_danh");
  const [pkg, setPkg] = useState("standard");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null); // { order, vietqrUrl, bankHolder, bankId, bankAccount }

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg({ configured: false }));
    try {
      const raw = sessionStorage.getItem("gq_last_cast");
      if (raw) {
        const s = JSON.parse(raw);
        setSnapshot(s);
        if (s.question) setQuestion(s.question);
        if (s.topic) setTopic(s.topic);
      }
    } catch {}
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, contact, question, topic, package: pkg,
          cast_json: snapshot || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Không tạo được đơn, vui lòng thử lại.");
      } else {
        setDone(data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setErr("Lỗi kết nối, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const o = done.order;
    return (
      <div>
        <section className="hero">
          <div className="han-bg">訂</div>
          <h1>Đã tạo đơn luận sâu</h1>
          <p className="lead">Giữ lại mã đơn dưới đây — bạn sẽ dùng nó để tra cứu bài luận.</p>
        </section>
        <div className="card center">
          <div className="mut">Mã đơn của bạn</div>
          <div className="order-code">{o.code}</div>
          <p>
            Gói: <b>{(PACKAGES.find((p) => p.id === o.package) || {}).name}</b> · Số tiền cần chuyển:{" "}
            <b>{formatVND(o.price)}</b>
          </p>
          {done.vietqrUrl ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="qr-img" src={done.vietqrUrl} alt="Mã VietQR thanh toán" />
              <p className="mut">
                Quét mã bằng app ngân hàng, kiểm tra đúng số tiền và <b>nội dung chuyển khoản là mã đơn {o.code}</b>
                {done.bankHolder ? `, người nhận ${done.bankHolder}` : ""}. Không sửa nội dung chuyển khoản.
              </p>
            </div>
          ) : (
            <div className="notice warn">
              <b>Chưa cấu hình tài khoản nhận tiền.</b> Chủ trang chưa khai báo thông tin ngân hàng (BANK_ID /
              BANK_ACCOUNT) nên chưa hiển thị được mã VietQR. Đơn của bạn đã được ghi nhận với mã{" "}
              <b>{o.code}</b> — vui lòng liên hệ qua trang <Link href="/lien-he">Liên hệ</Link> kèm mã đơn để
              được hướng dẫn thanh toán.
            </div>
          )}
          <p className="mut">
            Sau khi chuyển khoản, đơn sẽ được xác nhận và luận trong thời hạn của gói. Tra cứu trạng thái và
            nhận bài tại <Link href="/tra-cuu">trang Tra cứu đơn</Link> bằng mã đơn + thông tin liên hệ đã điền.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="hero">
        <div className="han-bg">論</div>
        <h1>Đặt luận sâu</h1>
        <p className="lead">
          Một bài luận riêng cho đúng câu hỏi của bạn — xét Dụng thần, vượng suy, hào động, phục thần và quẻ
          biến theo khung Lục Hào, có người duyệt trước khi gửi.
        </p>
      </section>

      {cfg && !cfg.configured ? (
        <div className="notice warn">
          <b>Hệ thống đặt đơn chưa được cấu hình.</b> Chủ trang chưa kết nối Supabase nên tạm thời chưa nhận
          đơn trực tuyến được. Bạn vẫn có thể <Link href="/">gieo quẻ và đọc luận cơ bản miễn phí</Link> như
          bình thường.
        </div>
      ) : null}

      {snapshot ? (
        <div className="notice">
          <b>Đơn này gắn với quẻ bạn vừa gieo:</b>{" "}
          {snapshot.result && snapshot.result.que_chu
            ? `Quẻ ${snapshot.result.que_chu.number} · ${snapshot.result.que_chu.name}` +
              (snapshot.result.que_bien ? ` → biến ${snapshot.result.que_bien.name}` : "")
            : snapshot.method === "mai-hoa"
              ? "Quẻ Mai Hoa theo giờ"
              : "Quẻ Lục Hào"}
          {snapshot.topicLabel ? ` · Lĩnh vực: ${snapshot.topicLabel}` : ""}. Ảnh chụp quẻ sẽ được gửi kèm đơn
          để người luận đối chiếu.{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setSnapshot(null);
            }}
          >
            Bỏ gắn quẻ này
          </a>
        </div>
      ) : (
        <p className="mut">
          Chưa có quẻ gắn kèm — bạn có thể <Link href="/">gieo quẻ trước</Link> rồi quay lại, hoặc cứ mô tả câu
          hỏi thật chi tiết, người luận sẽ lập quẻ theo giờ nhận đơn.
        </p>
      )}

      <form className="card" onSubmit={submit}>
        <label className="flabel" htmlFor="name">Họ tên</label>
        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ví dụ: Nguyễn Văn A" />
        <label className="flabel" htmlFor="contact">Thông tin liên hệ (số Zalo hoặc email — dùng để tra cứu bài luận)</label>
        <input id="contact" type="text" value={contact} onChange={(e) => setContact(e.target.value)} required placeholder="Ví dụ: 0901234567 hoặc email@example.com" />
        <label className="flabel" htmlFor="question">Câu hỏi cần luận</label>
        <textarea id="question" value={question} onChange={(e) => setQuestion(e.target.value)} required placeholder="Một việc cụ thể, kèm bối cảnh ngắn gọn và khoảng thời gian bạn quan tâm…" />
        <label className="flabel" htmlFor="topic">Lĩnh vực</label>
        <select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
        <label className="flabel">Gói luận sâu</label>
        <div className="price-grid">
          {PACKAGES.map((p) => (
            <label
              key={p.id}
              className="card price-card"
              style={{ margin: 0, cursor: "pointer", borderColor: pkg === p.id ? "var(--gold)" : undefined }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="radio" name="pkg" value={p.id} checked={pkg === p.id}
                  onChange={() => setPkg(p.id)} style={{ width: "auto" }}
                />
                <b className="serif" style={{ color: "var(--gold-soft)" }}>{p.name}</b>
              </div>
              <div className="price" style={{ fontSize: "1.5rem" }}>{formatVND(p.price)}</div>
              <div className="mut small">{p.eta}</div>
              <ul>
                {p.points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </label>
          ))}
        </div>
        {err ? <p className="form-err">{err}</p> : null}
        <button className="btn block" type="submit" disabled={busy || (cfg && !cfg.configured)}>
          {busy ? "Đang tạo đơn…" : "Tạo đơn và lấy mã thanh toán"}
        </button>
        <p className="mut small">
          Tạo đơn xong bạn sẽ nhận mã đơn + mã VietQR. Đơn chỉ được luận sau khi xác nhận đã chuyển khoản đúng
          mã đơn. Xem thêm <Link href="/chinh-sach-thanh-toan">chính sách thanh toán</Link>.
        </p>
      </form>
    </div>
  );
}
