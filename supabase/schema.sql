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
