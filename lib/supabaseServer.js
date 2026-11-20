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

// ── Phân quyền (GĐ3 — 2026-11-20) ─────────────────────────────────────
// Ba vai: owner (Chủ) > reader (Luận viên) > viewer (Chỉ xem).
export const ADMIN_ROLES = ["owner", "reader", "viewer"];
export const ROLE_LABELS = { owner: "Chủ", reader: "Luận viên", viewer: "Chỉ xem" };

export function hasRole(admin, ...roles) {
  return Boolean(admin) && roles.includes(admin.role);
}

// Lỗi PostgREST/Postgres khi bảng chưa tồn tại (chưa chạy migration GĐ3).
export function isMissingTableError(error) {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  const msg = String(error.message || "");
  return /admin_users/.test(msg) && /(does not exist|could not find|not find)/i.test(msg);
}

// Tra vai trong bảng admin_users theo user_id (ưu tiên) hoặc email.
// Trả { row } khi có dòng, { missing: true } khi bảng chưa tồn tại,
// { row: null } khi bảng có nhưng người dùng không có dòng / đã khóa xử lý ở ngoài.
async function lookupAdminUser(sb, userId, email) {
  const { data, error } = await sb
    .from("admin_users")
    .select("user_id, email, role, active")
    .or(`user_id.eq.${userId},email.eq.${email}`)
    .limit(5);
  if (error) {
    if (isMissingTableError(error)) return { missing: true };
    // Lỗi lạ khác: coi như không tra được — không cấp quyền theo bảng.
    return { row: null };
  }
  const rows = data || [];
  const row = rows.find((r) => r.user_id === userId) || rows.find((r) => r.email === email) || null;
  return { row };
}

// Kiểm tra Bearer token + phân giải vai. Thứ tự phân giải (đã chốt):
//   1) Email nằm trong ADMIN_EMAILS → role 'owner' — CỬA KHẨN CẤP, luôn
//      thắng bất kể bảng admin_users nói gì (kể cả chưa có bảng / bị khóa).
//   2) Tra bảng admin_users: có dòng + active → role theo bảng.
//   3) Không có dòng / active = false / chưa có bảng → null (không phải admin).
// Trả { email, userId, role } hoặc null.
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
  const userId = data.user.id;

  // (1) Cửa khẩn cấp ADMIN_EMAILS — luôn là Chủ.
  if (adminEmails().includes(email)) {
    return { email, userId, role: "owner" };
  }

  // (2) Bảng phân quyền admin_users.
  if (!supabaseConfigured()) return null;
  const sb = supabaseAdmin();
  const { row } = await lookupAdminUser(sb, userId, email);
  if (!row || !row.active || !ADMIN_ROLES.includes(row.role)) return null;
  return { email, userId, role: row.role };
}
