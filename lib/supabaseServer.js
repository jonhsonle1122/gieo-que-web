// Supabase phía server — CHỈ dùng trong API routes (service-role key).
// Trình duyệt không bao giờ chạm service-role key; trang admin đăng nhập
// bằng Supabase Auth (anon key) rồi gửi access token cho API kiểm tra.
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function supabaseConfigured() {
  return Boolean(URL && SERVICE);
}

export function supabaseAdmin() {
  if (!supabaseConfigured()) return null;
  return createClient(URL, SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// Kiểm tra Bearer token của admin: token hợp lệ (Supabase Auth) + email
// nằm trong ADMIN_EMAILS. Trả { email, userId } hoặc null.
export async function getAuthedAdmin(req) {
  if (!URL || !ANON) return null;
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const client = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data || !data.user || !data.user.email) return null;
  const email = data.user.email.toLowerCase();
  if (!adminEmails().includes(email)) return null;
  return { email, userId: data.user.id };
}
