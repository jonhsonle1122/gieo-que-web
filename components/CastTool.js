"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DATA, COIN_MAP, lapQueLucHao, lapQueMaiHoa } from "@/lib/engine";
import { luanCoBan, LINH_VUC } from "@/lib/luan";
import { dayCanChi, solar2lunar, yearCanChi, hourBranch } from "@/lib/amlich";
import { monthBranchFromDate } from "@/lib/tietkhi";
import CastResult, { HexMeaning, MiniHexCard } from "./CastResult";
import HexFigure from "./HexFigure";

const TOPICS = Object.entries(LINH_VUC).map(([key, v]) => ({
  key,
  label: v.nhan.charAt(0).toUpperCase() + v.nhan.slice(1),
}));
const REL_OPTIONS = [
  ["minh", "Chính mình"], ["vo", "Vợ"], ["chong", "Chồng"], ["cha", "Cha"], ["me", "Mẹ"],
  ["cha_me", "Cha mẹ"], ["con", "Con cái"], ["chau", "Cháu"], ["anh_em", "Anh em"],
  ["em_trai", "Em trai"], ["anh_trai", "Anh trai"], ["chi_em", "Chị em"], ["ban", "Bạn bè"],
  ["nguoi_la", "Người lạ / không thân thích"], ["vat_nuoi", "Vật nuôi"],
  ["ton_thuong", "Tổn thương của chính mình"],
];
const REL_TOPICS = ["suc_khoe", "hanh_nhan", "xuat_hanh", "kien_tung"];

function logCast(payload) {
  try {
    fetch("/api/casts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

function saveSnapshotAndGo(router, snapshot) {
  try {
    sessionStorage.setItem("gq_last_cast", JSON.stringify(snapshot));
  } catch {}
  router.push("/luan-sau");
}

export default function CastTool() {
  const router = useRouter();
  const [tab, setTab] = useState("luc-hao");

  // ---------- Ngữ cảnh ngày (tự tính theo hôm nay, sửa được) ----------
  const [ctx, setCtx] = useState(null); // { stem, branch, monthBranch, todayText }
  useEffect(() => {
    const now = new Date();
    const dc = dayCanChi(now.getDate(), now.getMonth() + 1, now.getFullYear());
    const lu = solar2lunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
    const yc = yearCanChi(lu.year);
    const mb = monthBranchFromDate(now);
    setCtx({
      stem: dc.stem,
      branch: dc.branch,
      monthBranch: mb,
      todayText:
        `Hôm nay ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} dương lịch = ngày ${lu.day} ` +
        `tháng ${lu.month}${lu.leap ? " nhuận" : ""} năm ${yc.stem} ${yc.branch} âm lịch, ngày ${dc.stem} ${dc.branch}. ` +
        `Tháng theo tiết khí: tháng ${mb}.`,
    });
  }, []);

  // ---------- Lục Hào ----------
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState("cong_danh");
  const [gender, setGender] = useState("nam");
  const [relation, setRelation] = useState("minh");
  const [phenomenon, setPhenomenon] = useState("mua");
  const [itemType, setItemType] = useState("vat_dung");
  const [sums, setSums] = useState([]);
  const [coins, setCoins] = useState(null); // [2|3, 2|3, 2|3]
  const [flipping, setFlipping] = useState(false);
  const [lhResult, setLhResult] = useState(null); // { result, luan, luanErr, meta }
  const flippingRef = useRef(false);

  const topicLabel = useMemo(
    () => (TOPICS.find((t) => t.key === topic) || {}).label || topic,
    [topic]
  );

  function buildOpts(key) {
    const opts = {};
    if (key === "hon_nhan") opts.gioiTinh = gender;
    if (REL_TOPICS.includes(key) && relation) opts.quanHe = relation;
    if (key === "thoi_tiet") opts.hienTuong = phenomenon;
    if (key === "tim_vat_mat") opts.loaiVat = itemType;
    return opts;
  }

  function finishCast(finalSums) {
    if (!ctx) return;
    const r = lapQueLucHao(finalSums, ctx.stem, ctx.branch, ctx.monthBranch);
    let luan = null,
      luanErr = "";
    try {
      luan = luanCoBan(r, topic, buildOpts(topic));
    } catch (e) {
      luanErr = (e && e.message) || String(e);
    }
    const snapshot = {
      method: "luc-hao",
      question: question.trim(),
      topic,
      topicLabel,
      castAt: new Date().toISOString(),
      dayStem: ctx.stem,
      dayBranch: ctx.branch,
      monthBranch: ctx.monthBranch,
      result: r,
      luan: luan
        ? { ket_luan: luan.ket_luan, diem_tong: luan.diem.tong, van_ban: luan.van_ban }
        : null,
    };
    setLhResult({ result: r, luan, luanErr, meta: { question: question.trim(), topicLabel } });
    logCast({ method: "luc-hao", question: question.trim(), topic, cast_json: snapshot });
    setTimeout(() => {
      const el = document.getElementById("ket-qua-luc-hao");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 60);
  }

  function oneTossValues() {
    const c = [0, 0, 0].map(() => (Math.random() < 0.5 ? 2 : 3)); // 2 = âm, 3 = dương
    return { coins: c, sum: c.reduce((a, b) => a + b, 0) };
  }

  function toss() {
    if (!ctx || sums.length >= 6 || flippingRef.current) return;
    flippingRef.current = true;
    setFlipping(true);
    const t = oneTossValues();
    window.setTimeout(() => {
      setCoins(t.coins);
      const next = [...sums, t.sum];
      setSums(next);
      setFlipping(false);
      flippingRef.current = false;
      if (next.length === 6) finishCast(next);
    }, 560);
  }

  function tossFast() {
    if (!ctx || flippingRef.current) return;
    const next = [];
    let last = null;
    while (next.length < 6) {
      last = oneTossValues();
      next.push(last.sum);
    }
    setCoins(last.coins);
    setSums(next);
    finishCast(next);
  }

  function resetCast() {
    setSums([]);
    setCoins(null);
    setLhResult(null);
  }

  // ---------- Mai Hoa ----------
  const [mhQuestion, setMhQuestion] = useState("");
  const [mhTopic, setMhTopic] = useState("cong_danh");
  const [mhWhen, setMhWhen] = useState(""); // datetime-local
  const [mhResult, setMhResult] = useState(null); // { result, metaText, snapshot }
  const mhTopicLabel = useMemo(
    () => (TOPICS.find((t) => t.key === mhTopic) || {}).label || mhTopic,
    [mhTopic]
  );

  function castMaiHoa(date) {
    const lu = solar2lunar(date.getDate(), date.getMonth() + 1, date.getFullYear());
    const yc = yearCanChi(lu.year);
    const hb = hourBranch(date.getHours());
    const r = lapQueMaiHoa(yc.branchNum, lu.month, lu.day, hb.branchNum);
    const metaText =
      `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ngày ` +
      `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} dương lịch = ngày ${lu.day} tháng ` +
      `${lu.month}${lu.leap ? " nhuận" : ""} năm ${yc.stem} ${yc.branch} âm lịch, giờ ${hb.branch} — ` +
      `số lập quẻ: năm ${yc.branchNum} + tháng ${lu.month} + ngày ${lu.day} + giờ ${hb.branchNum}`;
    const snapshot = {
      method: "mai-hoa",
      question: mhQuestion.trim(),
      topic: mhTopic,
      topicLabel: mhTopicLabel,
      castAt: date.toISOString(),
      metaText,
      result: r,
      luan: null,
    };
    setMhResult({ result: r, metaText, snapshot });
    logCast({ method: "mai-hoa", question: mhQuestion.trim(), topic: mhTopic, cast_json: snapshot });
    setTimeout(() => {
      const el = document.getElementById("ket-qua-mai-hoa");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 60);
  }

  function castMaiHoaPicked() {
    if (!mhWhen) return;
    const [dPart, tPart] = mhWhen.split("T");
    const [y, mo, d] = dPart.split("-").map(Number);
    const [hh, mi] = (tPart || "00:00").split(":").map(Number);
    castMaiHoa(new Date(y, mo - 1, d, hh || 0, mi || 0));
  }

  return (
    <div id="gieo-que">
      <div className="tabs" role="tablist">
        <button className={tab === "luc-hao" ? "on" : ""} onClick={() => setTab("luc-hao")}>
          Gieo 3 xu · Lục Hào
        </button>
        <button className={tab === "mai-hoa" ? "on" : ""} onClick={() => setTab("mai-hoa")}>
          Mai Hoa theo giờ
        </button>
      </div>

      {tab === "luc-hao" ? (
        <div className="tool-panel">
          <label className="flabel" htmlFor="q">Câu hỏi của bạn (một việc, một câu — càng rõ càng tốt)</label>
          <input
            id="q" type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ví dụ: Công việc sắp tới của tôi thế nào?"
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            <div>
              <label className="flabel" htmlFor="field">Lĩnh vực</label>
              <select id="field" value={topic} onChange={(e) => setTopic(e.target.value)}>
                {TOPICS.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
            {topic === "hon_nhan" ? (
              <div>
                <label className="flabel" htmlFor="exGender">Người hỏi là</label>
                <select id="exGender" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                  <option value="xem_ho">Xem hộ người khác</option>
                </select>
              </div>
            ) : null}
            {REL_TOPICS.includes(topic) ? (
              <div>
                <label className="flabel" htmlFor="exRelation">Hỏi cho ai</label>
                <select id="exRelation" value={relation} onChange={(e) => setRelation(e.target.value)}>
                  {REL_OPTIONS.map(([v, t]) => (
                    <option key={v} value={v}>{t}</option>
                  ))}
                </select>
              </div>
            ) : null}
            {topic === "thoi_tiet" ? (
              <div>
                <label className="flabel" htmlFor="exPhenomenon">Hiện tượng hỏi</label>
                <select id="exPhenomenon" value={phenomenon} onChange={(e) => setPhenomenon(e.target.value)}>
                  <option value="mua">Mưa</option>
                  <option value="nang">Nắng / tạnh</option>
                  <option value="sam">Sấm sét</option>
                  <option value="gio">Gió / mây</option>
                </select>
              </div>
            ) : null}
            {topic === "tim_vat_mat" ? (
              <div>
                <label className="flabel" htmlFor="exItemType">Loại vật bị mất</label>
                <select id="exItemType" value={itemType} onChange={(e) => setItemType(e.target.value)}>
                  <option value="van_thu">Văn thư / giấy tờ / xe cộ</option>
                  <option value="vat_nuoi">Vật nuôi / gia súc</option>
                  <option value="tien">Tiền bạc</option>
                  <option value="vat_dung">Vật dụng thường ngày</option>
                </select>
              </div>
            ) : null}
            <div>
              <label className="flabel" htmlFor="dayStem">Can ngày</label>
              <select id="dayStem" value={ctx ? ctx.stem : ""} disabled={!ctx}
                onChange={(e) => setCtx({ ...ctx, stem: e.target.value })}>
                {DATA.stems.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flabel" htmlFor="dayBranch">Chi ngày</label>
              <select id="dayBranch" value={ctx ? ctx.branch : ""} disabled={!ctx}
                onChange={(e) => setCtx({ ...ctx, branch: e.target.value })}>
                {DATA.branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
          {ctx ? <p className="mut small">{ctx.todayText}</p> : <p className="mut small">Đang tính Can Chi hôm nay…</p>}

          <div className="coins">
            {(coins || [null, null, null]).map((v, i) => (
              <div key={i} className={"coin" + (v === null ? " unknown" : v === 2 ? " am" : "") + (flipping ? " flipping" : "")}>
                {v === null ? "?" : v === 3 ? "Dương" : "Âm"}
              </div>
            ))}
          </div>
          <div style={{ maxWidth: 300, margin: "0 auto" }}>
            <HexFigure bits={sums.map((s) => COIN_MAP[s][0])} dongList={sums.map((s, i) => (COIN_MAP[s][1] ? i + 1 : 0)).filter(Boolean)} />
          </div>
          <p className="center mut small">
            {sums.length ? `Đã gieo ${sums.length}/6 hào` : "Tung xu 6 lần để dựng quẻ — hào 1 ở dưới cùng."}
          </p>
          <div className="toss-actions">
            <button className="btn" onClick={toss} disabled={!ctx || sums.length >= 6 || flipping}>
              {sums.length < 6 ? `Tung hào ${sums.length + 1}` : "Đã đủ 6 hào"}
            </button>
            <button className="btn ghost" onClick={tossFast} disabled={!ctx || flipping}>
              Gieo nhanh cả quẻ
            </button>
            {sums.length ? (
              <button className="btn ghost" onClick={resetCast}>Gieo lại</button>
            ) : null}
          </div>

          <div id="ket-qua-luc-hao" style={{ marginTop: 18 }}>
            {lhResult ? (
              <CastResult
                result={lhResult.result}
                luan={lhResult.luan}
                luanErr={lhResult.luanErr}
                meta={lhResult.meta}
                onOrder={() =>
                  saveSnapshotAndGo(router, {
                    method: "luc-hao",
                    question: question.trim(),
                    topic,
                    topicLabel,
                    castAt: new Date().toISOString(),
                    dayStem: ctx.stem,
                    dayBranch: ctx.branch,
                    monthBranch: ctx.monthBranch,
                    result: lhResult.result,
                    luan: lhResult.luan
                      ? { ket_luan: lhResult.luan.ket_luan, diem_tong: lhResult.luan.diem.tong, van_ban: lhResult.luan.van_ban }
                      : null,
                  })
                }
              />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="tool-panel">
          <label className="flabel" htmlFor="mhQ">Câu hỏi của bạn</label>
          <input
            id="mhQ" type="text" value={mhQuestion} onChange={(e) => setMhQuestion(e.target.value)}
            placeholder="Ví dụ: Việc này có nên làm ngay không?"
          />
          <label className="flabel" htmlFor="mhField">Lĩnh vực</label>
          <select id="mhField" value={mhTopic} onChange={(e) => setMhTopic(e.target.value)}>
            {TOPICS.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <p className="mut small">
            Mai Hoa lập quẻ từ thời điểm động tâm: số năm + tháng + ngày âm lịch cho quái trên,
            cộng thêm số giờ cho quái dưới và hào động. Dùng giờ hiện tại, hoặc chọn một thời điểm khác.
          </p>
          <div className="toss-actions" style={{ justifyContent: "flex-start" }}>
            <button className="btn" onClick={() => castMaiHoa(new Date())}>Gieo theo giờ hiện tại</button>
          </div>
          <label className="flabel" htmlFor="mhWhen">Hoặc chọn ngày giờ (dương lịch)</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input id="mhWhen" type="datetime-local" value={mhWhen} onChange={(e) => setMhWhen(e.target.value)} style={{ flex: "1 1 220px" }} />
            <button className="btn ghost" onClick={castMaiHoaPicked} disabled={!mhWhen}>Gieo theo giờ đã chọn</button>
          </div>

          <div id="ket-qua-mai-hoa" style={{ marginTop: 18 }}>
            {mhResult ? (
              <div>
                <div className="card">
                  <div className="mut small">{mhTopicLabel}{mhQuestion.trim() ? " · " + mhQuestion.trim() : ""} · {mhResult.metaText}</div>
                  <div className="big-title">
                    Quẻ {mhResult.result.que_chu.number} · {mhResult.result.que_chu.name}
                  </div>
                  <HexFigure bits={mhResult.result.que_chu.bits} dongList={[mhResult.result.hao_dong]} />
                  <p>
                    Hào động: <b>hào {mhResult.result.hao_dong}</b> · Thể: <b>{mhResult.result.the_quai}</b> ·
                    Dụng: <b>{mhResult.result.dung_quai}</b> · Quan hệ Thể–Dụng: <b>{mhResult.result.the_dung_relation}</b>
                  </p>
                  <p className="mut">
                    Thể là phía người hỏi, Dụng là phía sự việc. Dụng sinh Thể = có lợi; Thể sinh Dụng = hao sức;
                    Dụng khắc Thể = bất lợi; Thể khắc Dụng = được việc nhưng vất vả; Tỷ hòa = bình ổn.
                  </p>
                  <HexMeaning number={mhResult.result.que_chu.number} />
                  <p className="center" style={{ marginTop: 18 }}>
                    <button className="btn" onClick={() => saveSnapshotAndGo(router, mhResult.snapshot)}>
                      Gửi yêu cầu luận sâu cho quẻ này — miễn phí
                    </button>
                  </p>
                </div>
                <div className="mini-cards">
                  <MiniHexCard title="Quẻ biến" hex={mhResult.result.que_bien} />
                  <MiniHexCard title="Quẻ hỗ" hex={mhResult.result.que_ho} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
