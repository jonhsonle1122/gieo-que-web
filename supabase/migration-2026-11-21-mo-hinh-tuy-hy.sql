-- Migration 2026-11-21 — Mô hình TÙY HỶ (web Gieo Quẻ v2).
-- Chạy trong Supabase Dashboard > SQL Editor (dán toàn bộ file này > Run).
-- An toàn khi chạy lại nhiều lần (idempotent — xem giải thích từng mục).
--
-- Nội dung:
--   1) Nới CHECK constraint của orders.status: THÊM 'cho_luan' và
--      'da_tu_choi' của mô hình tùy hỷ, đồng thời GIỮ NGUYÊN hai trạng
--      thái cũ 'cho_thanh_toan' / 'da_thanh_toan' để không viết lại
--      lịch sử đơn thời mô hình giá (quyết định D7).
--   2) Thêm 2 cột ghi nhận tùy hỷ trên orders (phương án A — quyết định
--      D5): tuy_hy_amount + tuy_hy_noted_at. Đây là số liệu NỘI BỘ để đo
--      mô hình, khách không thấy, không phải công nợ.
--
-- Nếu CHƯA chạy migration này, web vẫn chạy bình thường: code tự lùi về
-- trạng thái/cột cũ và bỏ qua lặng lẽ phần tùy hỷ (tiền lệ GĐ1/GĐ3).

-- ── 1) Nới CHECK constraint của orders.status ─────────────────────────
-- Bỏ mọi CHECK constraint hiện có trên bảng orders mà định nghĩa nhắc
-- tới 'cho_thanh_toan' (bắt được cả tên mặc định 'orders_status_check'
-- lẫn bất kỳ tên nào khác), rồi gắn lại MỘT constraint duy nhất gồm cả
-- trạng thái cũ + mới. Chạy lại lần hai: constraint mới gắn ở lần một
-- cũng chứa 'cho_thanh_toan' nên lại được bỏ ra và gắn lại y hệt —
-- kết quả không đổi (idempotent).
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
    'cho_thanh_toan', 'da_thanh_toan',              -- mô hình giá cũ — giữ cho lịch sử
    'cho_luan', 'dang_luan', 'da_gui', 'da_tu_choi' -- mô hình tùy hỷ ('dang_luan'/'da_gui' dùng chung)
  ));

-- ── 2) Cột ghi nhận tùy hỷ (D5 — phương án A: 2 cột trên orders) ─────
alter table public.orders add column if not exists tuy_hy_amount   bigint;
alter table public.orders add column if not exists tuy_hy_noted_at timestamptz;

-- ── Kiểm chứng sau khi chạy (tùy chọn — bỏ dấu -- ở đầu để chạy) ─────
-- Lệnh 1 phải trả về định nghĩa chứa đủ 6 trạng thái ở trên;
-- lệnh 2 phải liệt kê 2 cột tuy_hy_amount và tuy_hy_noted_at.
-- select pg_get_constraintdef(oid) as dinh_nghia_trang_thai
--   from pg_constraint
--   where conrelid = 'public.orders'::regclass and conname = 'orders_status_check';
-- select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'orders'
--     and column_name like 'tuy_hy%';
