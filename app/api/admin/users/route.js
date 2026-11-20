import { NextResponse } from "next/server";
import {
  supabaseAdmin,
  supabaseConfigured,
  getAuthedAdmin,
  hasRole,
  isMissingTableError,
  ADMIN_ROLES,
} from "@/lib/supabaseServer";

// Quản lý người dùng quản trị (Khối 4 — GĐ3) — CHỈ vai Chủ (owner).
// Dữ liệu: bảng admin_users (user_id = auth.users.id, email, role, active).
// Mời người mới qua Supabase Auth Admin API (inviteUserByEmail) — email mời
// do hệ thống mail của Supabase gửi; dòng admin_users được ghi ngay với
// user_id mà lời mời trả về, nên người được mời đăng nhập lần đầu là có
// đúng vai ngay, không cần bước gắn tay.
//
// Khi bảng admin_users chưa tồn tại (chưa chạy migration GĐ3) mọi method
// trả needs_migration để giao diện hiện đúng thông báo cần chạy SQL.
const MIGRATION_HINT =
  "Cần chạy migration GĐ3 trước: dán file supabase/migration-2026-11-20-admin-gd3.sql vào Supabase Dashboard → SQL Editor → Run.";

// Tài khoản Chủ gốc của Thanh — chỉ chính Thanh mới sửa được dòng này.
const ROOT_OWNER_ID = "cde163ae-a092-4ecb-bc52-eb440faa4a2c";
const ROOT_OWNER_EMAIL = "jonhsonle1122@gmail.com";

const COLS = "user_id, email, role, active, created_at, updated_at";

async function ownerGuard(req) {
  if (!supabaseConfigured()) {
    return { error: NextResponse.json({ ok: false, configured: false, error: "Chưa cấu hình Supabase." }, { status: 503 }) };
  }
  const admin = await getAuthedAdmin(req);
  if (!admin) {
    return { error: NextResponse.json({ ok: false, error: "Chưa đăng nhập hoặc email không có quyền admin." }, { status: 403 }) };
  }
  if (!hasRole(admin, "owner")) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Chỉ vai Chủ mới quản lý được người dùng." },
        { status: 403 }
      ),
    };
  }
  return { admin };
}

function migrationResponse() {
  return NextResponse.json({ ok: false, needs_migration: true, error: MIGRATION_HINT }, { status: 503 });
}

async function listRows(sb) {
  const { data, error } = await sb.from("admin_users").select(COLS).order("created_at", { ascending: true });
  if (error) return { error };
  return { rows: data || [] };
}

// Lần đăng nhập gần nhất lấy từ Supabase Auth (nếu lấy được — lỗi thì bỏ qua).
async function lastSignIns(sb) {
  try {
    const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error || !data || !Array.isArray(data.users)) return new Map();
    return new Map(data.users.map((u) => [u.id, u.last_sign_in_at || null]));
  } catch {
    return new Map();
  }
}

async function findAuthUserByEmail(sb, email) {
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data || !Array.isArray(data.users) || data.users.length === 0) return null;
    const found = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) return null;
  }
  return null;
}

export async function GET(req) {
  const g = await ownerGuard(req);
  if (g.error) return g.error;
  const sb = supabaseAdmin();
  const { rows, error } = await listRows(sb);
  if (error) {
    if (isMissingTableError(error)) return migrationResponse();
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  const signs = await lastSignIns(sb);
  const users = rows.map((r) => ({ ...r, last_sign_in_at: signs.get(r.user_id) || null }));
  return NextResponse.json({ ok: true, users });
}

export async function POST(req) {
  const g = await ownerGuard(req);
  if (g.error) return g.error;
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  const email = String(body.email || "").trim().toLowerCase();
  const role = String(body.role || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Email không hợp lệ." }, { status: 400 });
  }
  if (!ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ ok: false, error: "Vai không hợp lệ (owner | reader | viewer)." }, { status: 400 });
  }

  const sb = supabaseAdmin();
  // Bảng chưa có → báo cần migration trước khi đụng tới Auth.
  const pre = await listRows(sb);
  if (pre.error) {
    if (isMissingTableError(pre.error)) return migrationResponse();
    return NextResponse.json({ ok: false, error: pre.error.message }, { status: 500 });
  }
  if ((pre.rows || []).some((r) => r.email === email)) {
    return NextResponse.json(
      { ok: false, error: "Email này đã có trong danh sách người dùng quản trị." },
      { status: 409 }
    );
  }

  // Mời qua Supabase Auth: tạo tài khoản + gửi email mời (mail của Supabase).
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const inviteOpts = siteUrl ? { redirectTo: `${siteUrl}/admin` } : {};
  let userId = null;
  let invited = false;
  const inv = await sb.auth.admin.inviteUserByEmail(email, inviteOpts);
  if (inv.error) {
    const msg = String(inv.error.message || "");
    const already =
      inv.error.code === "email_exists" || /already.*(registered|exists|been)/i.test(msg);
    if (!already) {
      return NextResponse.json({ ok: false, error: "Gửi lời mời thất bại: " + msg }, { status: 400 });
    }
    // Email đã có tài khoản Supabase Auth từ trước: không gửi mời mới,
    // chỉ cấp quyền quản trị cho tài khoản sẵn có đó.
    const existing = await findAuthUserByEmail(sb, email);
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Email đã đăng ký nhưng không tìm thấy tài khoản để cấp quyền." },
        { status: 400 }
      );
    }
    userId = existing.id;
  } else {
    userId = inv.data.user.id;
    invited = true;
  }

  const { data, error } = await sb
    .from("admin_users")
    .insert({ user_id: userId, email, role, active: true })
    .select(COLS)
    .single();
  if (error) {
    if (isMissingTableError(error)) return migrationResponse();
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    user: data,
    invited,
    message: invited
      ? `Đã gửi email mời tới ${email}. Người được mời bấm link trong email, vào trang quản trị và đặt mật khẩu ở mục “Đổi mật khẩu”.`
      : `${email} đã có tài khoản đăng nhập sẵn — đã cấp vai, người đó đăng nhập bằng mật khẩu hiện tại của họ.`,
  });
}

export async function PATCH(req) {
  const g = await ownerGuard(req);
  if (g.error) return g.error;
  const admin = g.admin;
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  const userId = String(body.user_id || "");
  if (!userId) return NextResponse.json({ ok: false, error: "Thiếu user_id." }, { status: 400 });
  const hasRoleChange = body.role !== undefined;
  const hasActiveChange = body.active !== undefined;
  if (!hasRoleChange && !hasActiveChange) {
    return NextResponse.json({ ok: false, error: "Không có thay đổi nào (cần role hoặc active)." }, { status: 400 });
  }
  if (hasRoleChange && !ADMIN_ROLES.includes(String(body.role))) {
    return NextResponse.json({ ok: false, error: "Vai không hợp lệ (owner | reader | viewer)." }, { status: 400 });
  }
  if (hasActiveChange && typeof body.active !== "boolean") {
    return NextResponse.json({ ok: false, error: "active phải là true/false." }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: target, error: loadErr } = await sb
    .from("admin_users")
    .select(COLS)
    .eq("user_id", userId)
    .single();
  if (loadErr) {
    if (isMissingTableError(loadErr)) return migrationResponse();
    return NextResponse.json({ ok: false, error: "Không tìm thấy người dùng này." }, { status: 404 });
  }

  const isSelf = target.user_id === admin.userId;
  const isRoot = target.user_id === ROOT_OWNER_ID || target.email === ROOT_OWNER_EMAIL;
  const demoting =
    (hasRoleChange && String(body.role) !== "owner") || (hasActiveChange && body.active === false);

  // Chốt an toàn 1: tài khoản Chủ gốc chỉ chính Thanh mới sửa được.
  if (isRoot && !isSelf) {
    return NextResponse.json(
      { ok: false, error: "Tài khoản Chủ gốc chỉ do chính chủ tài khoản thay đổi." },
      { status: 403 }
    );
  }
  // Chốt an toàn 2: không tự hạ vai / tự khóa chính mình.
  if (isSelf && demoting) {
    return NextResponse.json(
      { ok: false, error: "Không thể tự hạ vai hoặc tự khóa tài khoản của chính mình." },
      { status: 403 }
    );
  }
  // Chốt an toàn 3: không hạ vai/khóa Chủ cuối cùng đang hoạt động.
  if (demoting && target.role === "owner" && target.active) {
    const { count, error: countErr } = await sb
      .from("admin_users")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "owner")
      .eq("active", true);
    if (!countErr && (count || 0) <= 1) {
      return NextResponse.json(
        { ok: false, error: "Đây là tài khoản Chủ cuối cùng đang hoạt động — không thể hạ vai hoặc khóa." },
        { status: 403 }
      );
    }
  }

  const patch = { updated_at: new Date().toISOString() };
  if (hasRoleChange) patch.role = String(body.role);
  if (hasActiveChange) patch.active = body.active;
  const { data, error } = await sb.from("admin_users").update(patch).eq("user_id", userId).select(COLS).single();
  if (error) {
    if (isMissingTableError(error)) return migrationResponse();
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, user: data });
}
