-- Migration 2026-11-20 — Nâng cấp Admin GIAI ĐOẠN 3 (quản lý người dùng + phân quyền).
-- Chạy trong Supabase Dashboard > SQL Editor (dán toàn bộ file này > Run).
-- An toàn khi chạy lại nhiều lần (if not exists / on conflict).
--
-- Sau khi chạy xong: trang /admin có tab "Người dùng" (chỉ Chủ thấy) để mời
-- thêm tài khoản và phân vai. Nếu CHƯA chạy migration này, web vẫn chạy
-- bình thường theo cơ chế cũ: chỉ email trong ADMIN_EMAILS vào được admin
-- (vai Chủ) — code phía server tự lùi về cơ chế đó khi chưa thấy bảng.

-- 1) admin_users: tài khoản quản trị gắn với Supabase Auth + vai trò.
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  role       text not null check (role in ('owner', 'reader', 'viewer')),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
-- Không tạo policy: anon/authenticated không đọc/ghi trực tiếp được.
-- API routes dùng service-role key nên vẫn hoạt động bình thường.

-- 2) Seed: tài khoản của Thanh = Chủ (owner) ngay từ đầu, TRƯỚC khi cơ chế
--    kiểm tra quyền mới có hiệu lực — tránh tự khóa tài khoản Chủ.
--    (ADMIN_EMAILS vẫn giữ vĩnh viễn làm cửa khẩn cấp: email nằm trong
--     ADMIN_EMAILS luôn được coi là Chủ bất kể bảng này nói gì.)
insert into public.admin_users (user_id, email, role, active)
values ('cde163ae-a092-4ecb-bc52-eb440faa4a2c', 'jonhsonle1122@gmail.com', 'owner', true)
on conflict (user_id) do update
  set email = excluded.email, role = 'owner', active = true, updated_at = now();
