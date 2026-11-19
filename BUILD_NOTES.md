# BUILD NOTES — Web Gieo Quẻ Kinh Dịch (Next.js + Supabase)

Trạng thái: **build production xanh** (`npm run build` — 80 trang, gồm 64 trang quẻ SSG),
đã smoke-test bằng server production. Chưa deploy, chưa push GitHub — chờ chủ sở hữu quyết định.

## 1. Cấu trúc thư mục

```
app/
  page.js                  Trang chủ: hero + công cụ gieo (2 tab) + giới thiệu + lưới 64 quẻ + bảng giá + FAQ
  64-que/page.js           Mục lục 64 quẻ (đổ dữ liệu nhẹ xuống HexGrid có tìm kiếm)
  que/[slug]/page.js       64 trang quẻ tĩnh: cổ văn (Thoán/Hào/Đại tượng) + 11 trường ghi chú + CTA gieo quẻ
  luan-sau/page.js         Form đặt luận sâu → tạo đơn → mã đơn + VietQR
  tra-cuu/page.js          Tra cứu đơn bằng mã đơn + liên hệ, đọc bài luận khi đã gửi
  admin/page.js            Bọc server cho trang quản trị (chỉ truyền URL + anon key công khai)
  dieu-khoan/ · chinh-sach-thanh-toan/ · lien-he/   Trang tĩnh
  sitemap.js · robots.js   SEO (sitemap gồm 7 route tĩnh + 64 trang quẻ)
  api/casts/route.js       POST ghi log quẻ đã gieo (đo nhu cầu Giai đoạn 0)
  api/orders/route.js      GET kiểm tra cấu hình · POST tạo đơn + sinh VietQR
  api/orders/lookup/       POST tra cứu đơn cho khách
  api/admin/orders/        GET/PATCH quản trị đơn (bắt buộc token admin)
components/
  CastTool.js              Công cụ gieo: tung xu hoạt họa 6 hào / gieo nhanh / Mai Hoa giờ hiện tại hoặc giờ chọn
  CastResult.js            Bảng an quẻ đầy đủ (Trường Sinh ngày·tháng, phục thần) + luận cơ bản + quẻ biến/hỗ
  HexFigure.js · HexGrid.js · AdminClient.js
lib/
  engine.js · luan.js · amlich.js · tietkhi.js   Engine port ESM nguyên văn từ gieo-que-engine
  engine-data.js           DATA sinh tự động (bảng quái/cung/nạp giáp + hexInfo + bộ câu luận) — KHÔNG sửa tay
  hexagrams.js             64 quẻ + slug + ghi chú (sinh tự động)
  config.js                TÊN SITE, GIÁ (79.000đ / 99.000đ), gói, trạng thái đơn — sửa giá tại đây
  supabaseServer.js        Client service-role + kiểm tra quyền admin (chỉ chạy phía server)
scripts/
  port-engine.mjs          Sinh lại lib/ từ ../gieo-que-engine/demo (chạy khi engine gốc thay đổi)
  check-parity.mjs         Đối chiếu bản port với engine gốc của demo — phải in "PARITY OK"
supabase/schema.sql        Tạo bảng orders + casts (RLS bật, không policy công khai)
```

Engine được port **cơ học** (chỉ đổi import/export), không viết lại luật gieo quẻ.
Kiểm chứng: `node scripts/check-parity.mjs` so sánh toàn bộ object kết quả với engine gốc
trên các ca cố định của bộ test gốc (quẻ Phong, quẻ mẫu Q02 Trường Sinh, 10 ca Mai Hoa,
6 ca luận cơ bản gồm hôn nhân/sức khỏe có tham số phụ) — khớp 100%. Mốc neo độc lập:
19/11/2026 → ngày Đinh Dậu, âm lịch 11/10, chi tháng Hợi.

## 2. Biến môi trường — lấy ở đâu

Sao chép `.env.example` thành `.env.local` khi chạy local; khi deploy Vercel thì khai báo
tại Project → Settings → Environment Variables (Production).

| Biến | Lấy từ đâu | Bắt buộc |
|---|---|---|
| `NEXT_PUBLIC_SITE_NAME` | Tự đặt (mặc định "Gieo Quẻ Kinh Dịch") | Không |
| `NEXT_PUBLIC_SITE_URL` | Tên miền chính thức sau khi gắn domain, vd `https://tenmien.vn` (cho sitemap/metadata) | Nên có khi deploy |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL | Để bật đặt đơn/admin |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cùng trang API → anon public key | Để bật đăng nhập admin |
| `SUPABASE_SERVICE_ROLE_KEY` | Cùng trang API → service_role key. **TUYỆT MẬT** — chỉ ở server/Vercel env, không commit, không đưa ra trình duyệt | Để bật đặt đơn/admin |
| `ADMIN_EMAILS` | Email của bạn, cách nhau dấu phẩy — phải trùng email tài khoản Supabase Auth (xem mục 3) | Để vào /admin |
| `BANK_ID` | Mã ngân hàng theo chuẩn VietQR (MB, VCB, TCB, ACB, BIDV… hoặc mã BIN) | Để hiện mã QR |
| `BANK_ACCOUNT` | Số tài khoản nhận tiền của bạn | Để hiện mã QR |
| `BANK_HOLDER` | Tên chủ tài khoản (hiển thị cho khách đối chiếu) | Nên có |

Thiếu Supabase: trang chủ, gieo quẻ, 64 quẻ vẫn chạy hoàn hảo; form đặt đơn, tra cứu và
/admin tự hiển thị trạng thái "chưa cấu hình Supabase" thay vì lỗi. Thiếu bank: đơn vẫn tạo
được, trang kết quả hiển thị mã đơn + ghi chú chưa có QR thay vì ảnh hỏng.

## 3. Thiết lập Supabase (một lần)

1. Tạo project tại supabase.com (region gần nhất: Singapore).
2. Dashboard → SQL Editor → dán toàn bộ `supabase/schema.sql` → Run.
   (Tạo 2 bảng `orders`, `casts`; RLS bật, không policy — API routes dùng service-role key.)
3. Dashboard → Authentication → Users → Add user: tạo tài khoản bằng email của bạn + mật khẩu.
   Email này phải có trong `ADMIN_EMAILS` thì mới xử lý được đơn ở /admin.
4. Lấy 3 giá trị URL/anon/service_role ở Project Settings → API, điền vào env như bảng trên.

Luồng đơn: khách đặt → `cho_thanh_toan` → admin thấy tiền về thì bấm `da_thanh_toan`
→ `dang_luan` → dán bài luận, bấm "Lưu & đánh dấu đã gửi" → `da_gui` (khách đọc được bài
tại /tra-cuu bằng mã đơn + liên hệ). Chưa có cổng đối soát ngân hàng tự động — admin đối
chiếu chuyển khoản thủ công theo mã đơn trong nội dung chuyển khoản.

## 4. Phần đang là placeholder — chờ giá trị thật của chủ sở hữu

- **Thông tin ngân hàng** (`BANK_ID`, `BANK_ACCOUNT`, `BANK_HOLDER`): chưa có → chưa hiện VietQR.
- **Khóa Supabase + tài khoản admin**: chưa tạo project.
- **Tên site & tên miền**: đang dùng mặc định "Gieo Quẻ Kinh Dịch"; sitemap tạm dùng
  `http://localhost:3000` khi chưa đặt `NEXT_PUBLIC_SITE_URL`.
- **Kênh liên hệ** ở trang /lien-he: đang để dạng hướng dẫn chung, chờ Zalo/email chính thức để điền.
- **Giá luận sâu**: 79.000đ / 99.000đ là hằng số trong `lib/config.js` (mảng `PACKAGES`/`PRICES`) — đổi một chỗ, toàn site cập nhật.

## 5. Chạy local

```bash
npm install
cp .env.example .env.local   # điền giá trị (để trống vẫn chạy được phần gieo quẻ)
npm run dev                  # http://localhost:3000
npm run build && npm run start   # bản production
```

Khi engine ở `gieo-que-engine` thay đổi: `npm run port-engine && npm run check-parity` rồi build lại.

## 6. Deploy lên Vercel (khi chủ sở hữu sẵn sàng)

1. Đưa thư mục này thành một repo GitHub (hoặc `vercel` CLI từ thư mục gốc dự án).
2. Vercel → Add New Project → Import repo → Framework tự nhận Next.js, Root Directory = thư mục dự án này. Không cần cấu hình build command/output gì thêm.
3. Khai báo toàn bộ biến môi trường ở mục 2 (Production) **trước** lần deploy đầu để tránh bản build thiếu cấu hình phía client (`NEXT_PUBLIC_*` được nhúng lúc build — thêm sau thì phải redeploy).
4. Deploy → kiểm tra: trang chủ gieo được quẻ, /que/1-thuan-can mở được, /api/orders trả `configured:true`, đặt thử 1 đơn và thấy trong /admin.
5. Gắn tên miền riêng (Settings → Domains) rồi cập nhật `NEXT_PUBLIC_SITE_URL` và redeploy để sitemap/metadata dùng đúng domain.
