-- Migration 2026-11-20 — Nâng cấp Admin GIAI ĐOẠN 1 (bàn luận quẻ + ghi vết).
-- Chạy trong Supabase Dashboard > SQL Editor (dán toàn bộ file này > Run).
-- An toàn khi chạy lại nhiều lần (if not exists / điều kiện tồn tại).
-- Sau khi chạy xong, các tính năng GĐ1 trong /admin tự hoạt động đầy đủ;
-- nếu CHƯA chạy, web vẫn chạy bình thường (code phía server bỏ qua lặng lẽ
-- các cột/bảng chưa có).

-- 1) orders: cột hàng chờ nháp (Khối 1)
-- (Không thêm paid_at: hạn giao tính từ lúc tạo đơn; thời điểm xác nhận
--  thanh toán đã nằm trong order_events qua sự kiện chuyển trạng thái.)
alter table public.orders add column if not exists draft_requested_at timestamptz;
alter table public.orders add column if not exists draft_reading text;

-- 2) order_events: nhật ký thao tác theo đơn (Khối 5 — ghi vết)
create table if not exists public.order_events (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  actor_type    text not null check (actor_type in ('user', 'claude', 'system')),
  actor_label   text not null,   -- email người dùng | 'Muse — trợ lý' | 'Hệ thống'
  actor_user_id uuid,            -- auth user id, chỉ có khi actor_type = 'user'
  action        text not null,   -- created | status_changed | paid_marked |
                                 -- draft_requested | draft_written |
                                 -- reading_attached | delivered | customer_notified
  detail        jsonb,           -- { from_status, to_status, ... } tùy hành động
  created_at    timestamptz not null default now()
);

create index if not exists order_events_order_idx
  on public.order_events (order_id, created_at);

alter table public.order_events enable row level security;
-- Không tạo policy: anon/authenticated không đọc/ghi trực tiếp được.
-- API routes dùng service-role key nên vẫn hoạt động bình thường.

-- 3) Backfill: sinh dòng sự kiện 'created' cho các đơn có trước migration,
--    lấy mốc created_at của chính đơn để timeline không bị trống.
insert into public.order_events (order_id, actor_type, actor_label, action, detail, created_at)
select o.id, 'system', 'Hệ thống', 'created',
       jsonb_build_object('backfilled', true), o.created_at
from public.orders o
where not exists (
  select 1 from public.order_events e
  where e.order_id = o.id and e.action = 'created'
);
