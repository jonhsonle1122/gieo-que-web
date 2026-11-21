"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TUY_HY_PAGE_TITLE, TUY_HY_PAGE_PARAS } from "@/lib/config";
import { LINH_VUC } from "@/lib/luan";

const TOPICS = Object.entries(LINH_VUC).map(([key, v]) => ({
  key,
  label: v.nhan.charAt(0).toUpperCase() + v.nhan.slice(1),
}));

// Hiển thị đoạn chữ cấu hình: **...** trong config = in đậm.
function RichText({ text }) {
  const parts = text.split("**");
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>
      )}
    </>
  );
}

export default function LuanSauPage() {
  const [cfg, setCfg] = useState(null); // { configured, queue: { pending, etaDays, closed } | null }
  const [snapshot, setSnapshot] = useState(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState("cong_danh");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null); // { order, queue }

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg({ configured: false, queue: null }));
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

  const queueClosed = Boolean(cfg && cfg.queue && cfg.queue.closed);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!snapshot) {
      setErr("Yêu cầu luận sâu cần gắn với một quẻ đã gieo. Vui lòng gieo quẻ trước rồi quay lại gửi yêu cầu.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, contact, question, topic,
          cast_json: snapshot || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Không gửi được yêu cầu, vui lòng thử lại.");
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
    const eta = done.queue ? done.queue.etaDays : null;
    return (
      <div>
        <section className="hero">
          <div className="han-bg">訂</div>
          <h1>Đã nhận yêu cầu luận sâu</h1>
          <p className="lead">Giữ lại mã yêu cầu dưới đây — bạn sẽ dùng nó để tra cứu bài luận.</p>
        </section>
        <div className="card center">
          <div className="mut">Mã yêu cầu của bạn</div>
          <div className="order-code">{o.code}</div>
          <p>
            Yêu cầu của bạn đã vào hàng đợi luận.{" "}
            {eta
              ? `Thời gian trả bài dự kiến khoảng ${eta} ngày, tính theo số yêu cầu đang chờ hiện tại.`
              : "Chúng tôi sẽ luận theo thứ tự hàng đợi."}{" "}
            Bạn không cần trả bất cứ khoản nào trước.
          </p>
          <p className="mut">
            Theo dõi trạng thái và nhận bài tại <Link href="/tra-cuu">trang Tra cứu</Link> bằng mã yêu cầu +
            thông tin liên hệ đã điền. Sau khi đọc bài, nếu thấy hữu ích, bạn có thể gửi tùy hỷ tự nguyện
            ngay tại trang tra cứu — không gửi cũng hoàn toàn được.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="hero">
        <div className="han-bg">論</div>
        <h1>Luận sâu theo yêu cầu</h1>
        <p className="lead">
          Một bài luận riêng cho đúng câu hỏi của bạn — xét Dụng thần, vượng suy, hào động, phục thần và quẻ
          biến theo khung Lục Hào, có người duyệt trước khi gửi.
        </p>
      </section>

      <div className="card">
        <div className="big-title" style={{ fontSize: "1.15rem" }}>{TUY_HY_PAGE_TITLE}</div>
        {TUY_HY_PAGE_PARAS.map((p, i) => (
          <p key={i}>
            <RichText text={p} />
          </p>
        ))}
        {cfg && cfg.queue && !cfg.queue.closed ? (
          <p className="mut">
            Hiện có <b>{cfg.queue.pending} yêu cầu đang chờ</b> — thời gian trả bài dự kiến khoảng{" "}
            {cfg.queue.etaDays} ngày.
          </p>
        ) : null}
      </div>

      {cfg && !cfg.configured ? (
        <div className="notice warn">
          <b>Hệ thống nhận yêu cầu chưa được cấu hình.</b> Chủ trang chưa kết nối Supabase nên tạm thời chưa
          nhận yêu cầu trực tuyến được. Bạn vẫn có thể <Link href="/">gieo quẻ và đọc luận cơ bản miễn phí</Link> như
          bình thường.
        </div>
      ) : null}

      {queueClosed ? (
        <div className="notice warn">
          <b>Hiện hàng đợi đã đầy, mời bạn quay lại sau.</b> Chúng tôi chỉ nhận một số lượng yêu cầu nhất
          định để giữ chất lượng bài luận. Khi hàng đợi vơi bớt, trang này sẽ mở nhận yêu cầu trở lại.
        </div>
      ) : null}

      {snapshot ? (
        <div className="notice">
          <b>Yêu cầu này gắn với quẻ bạn vừa gieo:</b>{" "}
          {snapshot.result && snapshot.result.que_chu
            ? `Quẻ ${snapshot.result.que_chu.number} · ${snapshot.result.que_chu.name}` +
              (snapshot.result.que_bien ? ` → biến ${snapshot.result.que_bien.name}` : "")
            : snapshot.method === "mai-hoa"
              ? "Quẻ Mai Hoa theo giờ"
              : "Quẻ Lục Hào"}
          {snapshot.topicLabel ? ` · Lĩnh vực: ${snapshot.topicLabel}` : ""}. Ảnh chụp quẻ sẽ được gửi kèm yêu
          cầu để người luận đối chiếu.
        </div>
      ) : (
        <div className="notice warn">
          <b>Yêu cầu luận sâu bắt buộc phải gắn với một quẻ đã gieo.</b> Bạn chưa có quẻ nào trong phiên này —
          hãy <Link href="/">gieo quẻ cho câu hỏi của bạn trước</Link>, xem luận cơ bản miễn phí, rồi quay lại
          đây gửi yêu cầu; quẻ vừa gieo sẽ tự gắn vào yêu cầu. Muốn đổi quẻ khác, cứ gieo lại quẻ mới ở trang chủ.
        </div>
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
        {err ? <p className="form-err">{err}</p> : null}
        <button
          className="btn block"
          type="submit"
          disabled={busy || (cfg && !cfg.configured) || !snapshot || queueClosed}
        >
          {busy
            ? "Đang gửi yêu cầu…"
            : queueClosed
              ? "Hàng đợi đã đầy — mời quay lại sau"
              : !snapshot
                ? "Hãy gieo quẻ trước khi gửi yêu cầu"
                : "Gửi yêu cầu luận sâu — miễn phí"}
        </button>
        <p className="mut small">
          Gửi yêu cầu xong bạn sẽ nhận mã yêu cầu để tra cứu. Luận sâu không thu phí và không cần trả trước
          bất cứ khoản nào. Xem thêm <Link href="/chinh-sach-thanh-toan">chính sách tùy hỷ</Link>.
        </p>
      </form>
    </div>
  );
}
