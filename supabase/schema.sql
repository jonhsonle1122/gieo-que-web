-- Schema cho web Gieo Quẻ Kinh Dịch — chạy trong Supabase Dashboard > SQL Editor.
-- Mọi truy cập đều qua Next.js API routes bằng service-role key nên RLS bật
-- và KHÔNG tạo policy công khai nào (service role tự vượt RLS).

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,            -- mã đơn cho khách, ví dụ GQ-AB3K9Q
  name        text not null,                   -- họ tên khách
  contact     text not null,                   -- Zalo/SĐT hoặc email (dùng để tra cứu)
  question    text not null,                   -- câu hỏi cần luận
  topic       text not null,                   -- khóa lĩnh vực của engine (cau_tai, cong_danh, ...)
  package     text not null default 'standard',-- standard | priority
  price       integer not null,                -- giá tại thời điểm đặt (VND)
  status      text not null default 'cho_thanh_toan'
              check (status in ('cho_thanh_toan', 'da_thanh_toan', 'dang_luan', 'da_gui')),
  cast_json   jsonb,                           -- ảnh chụp quẻ khách đã gieo (nếu có)
  reading     text,                            -- bài luận sâu (admin dán vào)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_code_idx on public.orders (code);

create table if not exists public.casts (
  id          uuid primary key default gen_random_uuid(),
  cast_json   jsonb not null,                  -- toàn bộ kết quả engine (quẻ chủ/biến/hỗ, an quẻ...)
  question    text,
  topic       text,
  method      text,                            -- luc-hao | mai-hoa
  created_at  timestamptz not null default now()
);

create index if not exists casts_created_idx on public.casts (created_at desc);

alter table public.orders enable row level security;
alter table public.casts enable row level security;
-- Không tạo policy: anon/authenticated không đọc/ghi trực tiếp được.
-- API routes dùng service-role key nên vẫn hoạt động bình thường.

-- ── Bổ sung 2026-11-20: Nâng cấp Admin GĐ1 (bàn luận quẻ + ghi vết) ──────
-- (Bản đã chạy schema gốc thì dùng file migration-2026-11-20-admin-gd1.sql.)

-- orders: hàng chờ nháp luận sâu (Khối 1)
alter table public.orders add column if not exists draft_requested_at timestamptz;
alter table public.orders add column if not exists draft_reading text;

-- order_events: nhật ký thao tác theo đơn (Khối 5)
create table if not exists public.order_events (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  actor_type    text not null check (actor_type in ('user', 'claude', 'system')),
  actor_label   text not null,   -- email người dùng | 'Muse — trợ lý' | 'Hệ thống'
  actor_user_id uuid,            -- auth user id, chỉ có khi actor_type = 'user'
  action        text not null,   -- created | status_changed | paid_marked |
                                 -- draft_requested | draft_written |
                                 -- reading_attached | delivered | customer_notified
  detail        jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists order_events_order_idx
  on public.order_events (order_id, created_at);

alter table public.order_events enable row level security;
-- Không tạo policy — cùng khuôn với orders/casts.

-- ── Bổ sung 2026-11-20: Nâng cấp Admin GĐ3 (người dùng + phân quyền) ────
-- (Bản đã chạy schema gốc thì dùng file migration-2026-11-20-admin-gd3.sql.)

-- admin_users: tài khoản quản trị gắn với Supabase Auth + vai trò.
-- Vai: owner (Chủ) | reader (Luận viên) | viewer (Chỉ xem).
-- ADMIN_EMAILS vẫn giữ làm cửa khẩn cấp: email trong danh sách đó luôn
-- được coi là owner bất kể bảng này nói gì.
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  role       text not null check (role in ('owner', 'reader', 'viewer')),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
-- Không tạo policy — cùng khuôn với orders/casts.

-- Seed tài khoản của Thanh = owner (thay user_id/email nếu cài cho người khác).
insert into public.admin_users (user_id, email, role, active)
values ('cde163ae-a092-4ecb-bc52-eb440faa4a2c', 'jonhsonle1122@gmail.com', 'owner', true)
on conflict (user_id) do update
  set email = excluded.email, role = 'owner', active = true, updated_at = now();

-- ── Bổ sung 2026-11-21: Mô hình tùy hỷ (web Gieo Quẻ v2) ──────────────
-- (Bản đã chạy schema gốc thì dùng file migration-2026-11-21-mo-hinh-tuy-hy.sql.)

-- Nới CHECK trạng thái đơn: thêm cho_luan + da_tu_choi, giữ trạng thái cũ.
do $$
declare c text;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%cho_thanh_toan%'
  loop
    execute 'alter table public.orders drop constraint ' || quote_ident(c);
  end loop;
end $$;

alter table public.orders
  add constraint orders_status_check
  check (status in (
    'cho_thanh_toan', 'da_thanh_toan',
    'cho_luan', 'dang_luan', 'da_gui', 'da_tu_choi'
  ));

-- Cột ghi nhận tùy hỷ (nội bộ — khách không thấy, không phải công nợ).
alter table public.orders add column if not exists tuy_hy_amount   bigint;
alter table public.orders add column if not exists tuy_hy_noted_at timestamptz;
