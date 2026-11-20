// Phát tín hiệu Supabase Realtime Broadcast cho một đơn — dùng cho các đường
// gắn bài NGOÀI web admin (quy trình concierge: Muse gắn bài qua REST sau
// khi Thanh duyệt trong chat). Trang tra cứu của khách đang mở sẽ nhận tín
// hiệu và tự nạp lại, bài luận tự hiện khi đơn đã ở trạng thái da_gui.
//
// Cách dùng:
//   node scripts/notify-order-update.mjs <MÃ ĐƠN>
// Khóa đọc từ biến môi trường (NEXT_PUBLIC_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY) hoặc từ file .env.local cạnh repo.
// Tín hiệu chỉ chứa trạng thái đơn — không chứa nội dung bài luận.
import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const code = String(process.argv[2] || "").trim().toUpperCase();
if (!code) {
  console.error("Cách dùng: node scripts/notify-order-update.mjs <MÃ ĐƠN>");
  process.exit(2);
}

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = loadEnv();
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!URL_ || !SERVICE) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  apikey: SERVICE,
  Authorization: `Bearer ${SERVICE}`,
};

// Lấy contact + status hiện tại của đơn để suy ra đúng kênh và trạng thái.
const q = await fetch(
  `${URL_}/rest/v1/orders?select=code,contact,status&code=eq.${encodeURIComponent(code)}`,
  { headers }
);
if (!q.ok) {
  console.error("Không đọc được đơn:", q.status, await q.text());
  process.exit(1);
}
const rows = await q.json();
if (!rows.length) {
  console.error("Không tìm thấy đơn", code);
  process.exit(1);
}
const order = rows[0];

const topic =
  "order-" +
  order.code +
  "-" +
  createHash("sha256").update(String(order.contact || "").trim()).digest("hex").slice(0, 16);

const res = await fetch(`${URL_}/realtime/v1/api/broadcast`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    messages: [
      {
        topic,
        event: "order-updated",
        payload: { status: order.status, at: new Date().toISOString() },
        private: false,
      },
    ],
  }),
});
if (!res.ok) {
  console.error("Broadcast thất bại:", res.status, await res.text());
  process.exit(1);
}
console.log(`Đã phát tín hiệu realtime cho đơn ${order.code} (trạng thái: ${order.status}, kênh: ${topic}).`);
