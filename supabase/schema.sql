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
