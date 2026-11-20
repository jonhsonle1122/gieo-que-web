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
| `RESEND_API_KEY` | resend.com → API Keys. **TUYỆT MẬT** — chỉ ở server/Vercel env | Để web tự gửi mail báo đơn mới tức thì (mục 9) |
| `ORDER_NOTIFY_EMAIL` | Email nhận thông báo đơn mới (trống = mặc định jonhsonle1122@gmail.com) | Không |

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

## 7. Tính năng chọn ngày (chế độ Điểm Khiếu [TCK]) — thêm 2026-11-20

Spec: `~/workspace/your_files/ban-phac-chon-ngay/spec-trien-khai-chon-ngay.md`
(5 quyết định đã chốt: chỉ chế độ Điểm Khiếu; miễn phí; 3 việc khai trương /
xây nhà / kết hôn; giờ mặc định Thìn 07:00–09:00 công khai, khách đổi được;
tạo táng + chuyển nhà ngoài phạm vi — chỉ hiện dòng "sắp có", không route).

**File mới:**
- `lib/daycast.js` — cầu nối an quẻ: lắp `anQue`/`anPhucThan`/`tuanKhong`/
  Trường Sinh lên quẻ Mai Hoa đúng trình tự `lapQueLucHao` (không sửa engine).
  Điểm vào: `lapQueNgay(date, hourBranchNum)`, `lapQueNgayTuSo(...)` cho ca mẫu.
- `lib/daychecklists.js` — vị từ dùng chung (spec mục 4) + 51 mục checklist
  của 3 việc (spec mục 5) + `danhGiaNgay(result, viec, ctx)`. Tiến/Thoái thần
  dùng bản đồ TIEN_THAN của `lib/luan.js` (Tuệ Minh tr.74) — cùng chuẩn với
  tầng luận cơ bản; sách [TCK] cũng gọi Mùi Thổ hóa Tuất là "hóa tiến thần".
- `lib/dayrank.js` — pipeline `chamNgay`/`chamKhoang`, điểm/nhãn/xếp hạng
  (spec mục 6), dòng công khai giờ + disclaimer nguyên văn (spec mục 8.2/8.3).
- `components/DayRankTool.js` (công cụ tùy chọn phía client),
  `components/DayRankTable.js` (bảng xếp hạng dùng chung server/client).
- `app/chon-ngay/page.js`, `app/chon-ngay/[viec]/page.js` (bảng tháng render
  phía server), `app/chon-ngay/[viec]/[ngay]/page.js` (chi tiết ngày: quẻ đầy
  đủ qua `AnQueTable` của CastResult + 4 nhóm checklist Đạt/Phạm/Không đạt/Bỏ qua).

**File sửa (chỉ thêm, không đổi hành vi cũ):** `app/page.js` (thẻ liên kết
/chon-ngay sau công cụ gieo), `app/sitemap.js` (+4 URL), `app/globals.css`
(khối CSS "Chọn ngày" ở cuối file). Engine giữ nguyên: `node scripts/check-parity.mjs`
vẫn in PARITY OK. Không thêm biến môi trường, không ghi database.

**Kiểm chứng:** `node scripts/test-daycast.mjs` gồm 3 phần —
A. parity cầu nối: 1152 tổ hợp (64 quẻ × 6 hào động × 3 ngữ cảnh ngày), khớp
từng trường với `lapQueLucHao` — **đạt 100%**;
B. 7 ca mẫu sách (spec mục 9.2); C. test đơn vị phạm/không phạm cho mọi mục
xấu của 3 việc — đạt toàn bộ.

**Mục checklist bỏ qua khi chấm** (hiện minh bạch ở trang chi tiết):
- XN-H1: trạng thái "cần đối chiếu ca mẫu" — luôn bỏ qua (sách tự mâu thuẫn).
- Bỏ qua một phần: phần "lập cục cát hung" của KT-T9/XN-C8; phạm vi vế
  "Lục Thân không gặp phá" của KH-L1 (áp cho Thế/Ứng); vế tĩnh/động của
  KH-L6 (chỉ hiện cảnh báo, không tính điểm); vế phụ của KH-L8; vế hóa
  thoái của KH-H2.
- KT-T9 / XN-C8 / XN-H7: bỏ qua khi khách chưa nhập tọa sơn.

**TRẠNG THÁI CỔNG CHẤT LƯỢNG (2026-11-20): 4/7 — ĐÃ CHỐT THEO PHƯƠNG ÁN A, DEPLOY.**
Phần B đạt **4/7 ca** (KT-2, KT-3, XN-1, KH-1 đúng nhóm). Ba ca lệch:
- **KT-1 (hiệu sách)** — hệ thống chấm +0 "Trung bình", sách kết luận cát.
  Căn cứ cát của sách nằm NGOÀI danh sách in: Phụ Mẫu làm dụng theo ngành
  (spec đã loại vì sách không có bảng ngành), "Thế khắc Ứng = đại cát"
  (không có trong 17 tiêu chí), phi sinh phục Tài tính dương (danh sách chỉ
  có chiều ngược ở KT-X8). Chiều xấu trong danh sách lại phạm thật:
  KT-X2 (Quan lâm Ứng), KT-X4 (Huynh lâm Trường Sinh tại Nguyệt).
- **XN-2 (nhà họ Hàn)** — hệ thống chấm +1 "Trung bình", sách kết luận hung.
  Căn cứ hung của sách: Thế Tử Tôn lâm Tuần Không + "tử địa" tại Nhật (hiểu
  theo mùa, không phải vòng Trường Sinh), Ứng khắc Thế, hào Thế ở quẻ biến
  hồi đầu khắc — không mục nào nằm trong 8 mẫu hung in trong sách. Các mẫu
  cát đạt (XN-C1(c), XN-C7) và mẫu hung phạm (XN-H3) đều đúng mặt chữ.
- **KH-2 (ông Bành)** — hệ thống chấm −1 "Trung bình", sách kết luận cát.
  Sách dựa vào "Thế vượng khắc Ứng" (ngoài danh sách) và "Kiếp thần hóa
  thoái = cát" — điểm này MÂU THUẪN với chính danh sách in của sách (phần
  ngược của tiêu chí lành 7 đọc hóa thoái theo hướng xấu; spec đã theo
  danh sách). Các mục hung phạm đều theo danh sách in: KH-H5 (Tài Nhật
  phá), KH-H7 (Huynh được Nhật sinh), KH-H9 (Tài lưỡng hiện).
Không tự ý chỉnh luật để ép đạt (theo spec mục 9.2 + chỉ thị triển khai).

**Quyết định của Thanh 2026-11-20 — Phương án A:** chấp nhận số học danh
sách in làm hành vi sản phẩm; KT-1, XN-2, KH-2 là ĐỘ LỆCH ĐÃ BIẾT (phán
đoán trong ví dụ của sách dùng thêm tín hiệu ngoài danh sách tiêu chí in
của chính sách — lớp kinh nghiệm không mã hóa sạch được); cổng ca mẫu
chốt ở 4/7 cho bản đầu. Không sửa luật chấm, không sửa code tính năng.
Code đã build xanh + smoke local đạt; deploy lên GitHub
jonhsonle1122/gieo-que-web (nhánh main) → Vercel tự build.

## 8. Favicon (2026-11-20)

Icon quẻ Càn (6 vạch liền) vàng kim `--gold #d9ab3c` trên nền `--bg #0c0a07`
bo góc, không chữ — đọc rõ ở 16px. Nguồn: `app/icon.svg` (vẽ bằng rect);
các bản raster xuất bằng sharp từ chính SVG đó.
- `app/favicon.ico` — ICO chứa PNG 16/32/48.
- `app/icon.svg`, `app/apple-icon.png` (180×180) — quy ước file của Next.
- `public/icon-192.png`, `public/icon-512.png` — PWA/Android.
- Khai báo: `metadata.icons` trong `app/layout.js` liệt kê tường minh cả
  icon.svg + apple-icon, vì khi có metadata.icons thì Next không tự chèn
  link cho hai file đó nữa (favicon.ico vẫn được tự chèn).

## 9. Email báo đơn mới tức thì qua Resend (2026-11-20)

Trước đây đơn mới chỉ được phát hiện bởi bộ canh định kỳ 15 phút (cron
`gieo-que-order-watch` quét bảng orders rồi gửi mail). Nay web **tự gửi
email ngay trong luồng tạo đơn**:

- `lib/orderNotify.js` — hàm `notifyNewOrder(order)`: POST
  `https://api.resend.com/emails` bằng fetch server-side, header
  `Authorization: Bearer <RESEND_API_KEY>` + User-Agent dạng trình duyệt
  (tránh lỗi Cloudflare 1010 từng gặp với client mặc định). From:
  `Gieo Que Kinh Dich <onboarding@resend.dev>` (sender sandbox của Resend
  — chỉ gửi được tới email chủ tài khoản Resend, đúng hộp thư cần báo).
  To: `ORDER_NOTIFY_EMAIL`, trống thì mặc định `jonhsonle1122@gmail.com`.
- `app/api/orders/route.js`: sau khi insert đơn THÀNH CÔNG mới gọi
  `await notifyNewOrder(...)`. Toàn bộ việc gửi mail bọc try/catch —
  mail lỗi hoặc thiếu khóa thì bỏ qua lặng lẽ (chỉ `console.error` phía
  server), **không bao giờ làm hỏng việc tạo đơn của khách**. Thiếu
  `RESEND_API_KEY` = không gửi (môi trường local).
- Nội dung khớp bản bộ canh gửi: subject `[Gieo Quẻ] Đơn mới <MÃ ĐƠN>`;
  body gồm mã đơn, tên khách, liên hệ, gói + giá, lĩnh vực, câu hỏi,
  thời gian đặt (giờ Asia/Ho_Chi_Minh) và dòng
  "Xử lý tại: https://gieo-que-web-deploy.vercel.app/admin".

**Lưu ý vận hành:**
- Biến môi trường trên Vercel chỉ có hiệu lực **sau khi deploy lại** —
  thêm `RESEND_API_KEY` vào Project → Settings → Environment Variables
  (Production) xong phải redeploy thì bản live mới gửi được mail tức thì.
- Bộ canh 15 phút vẫn chạy song song (quét đơn + soạn nháp luận sâu cho
  đơn `da_thanh_toan`); nó dùng mốc `last_notified_created_at` riêng nên
  có thể gửi trùng một email báo đơn với kênh tức thì — chấp nhận được ở
  giai đoạn này, ưu tiên không sót đơn.

## 10. Nâng cấp Admin GIAI ĐOẠN 1 — bàn luận quẻ + ghi vết (2026-11-20)

Spec: `~/workspace/your_files/nang-cap-admin/spec-nang-cap-admin.md`
(Khối 1 + Khối 5; quyết định đã khóa: nháp theo phương án A — Muse soạn,
duyệt trong chat; hạn giao tính từ lúc tạo đơn nên GĐ1 KHÔNG thêm cột
paid_at — thời điểm xác nhận thanh toán nằm trong order_events).

**⚠️ CẦN HÀNH ĐỘNG CỦA CHỦ WEB — chạy migration:** dán toàn bộ file
`supabase/migration-2026-11-20-admin-gd1.sql` vào Supabase Dashboard →
SQL Editor → Run (thêm cột `orders.draft_requested_at`,
`orders.draft_reading`; tạo bảng `order_events` + index + RLS; backfill
sự kiện `created` cho đơn cũ). Tính đến lúc deploy GĐ1, DB live CHƯA có
các cột/bảng này (đã kiểm bằng REST: lỗi 42703/PGRST205). Code đã viết
chịu được trạng thái chưa migration: admin cũ chạy bình thường, các ghi
nháp/sự kiện bỏ qua lặng lẽ, PATCH tự lùi về cột gốc kèm cảnh báo trong
phản hồi. `supabase/schema.sql` cũng đã nối thêm các thay đổi này cho
cài mới.

**Thay đổi code:**
- `lib/orderEvents.js` (mới) — `logOrderEvent` + `fetchOrderEvents`,
  mọi thao tác bọc try/catch, không bao giờ ném lỗi ra ngoài.
- `app/api/admin/orders/route.js` — GET trả thêm cột nháp + `events`
  (timeline) cho từng đơn, tự lùi cột gốc khi chưa migration. PATCH hỗ
  trợ `draft_request: true` (vào hàng chờ, xóa nháp cũ, tự chuyển
  da_thanh_toan → dang_luan) và `approve_draft: true` (chép nháp →
  reading); mọi thao tác ghi order_events với actor = email admin đang
  đăng nhập (action: paid_marked / delivered / status_changed /
  reading_attached / draft_requested).
- `app/api/orders/route.js` — tạo đơn xong ghi sự kiện `created`
  (actor "Hệ thống").
- `lib/supabaseServer.js` — `getAuthedAdmin` trả thêm `userId` (ghi vào
  `actor_user_id` của sự kiện).
- `components/AdminClient.js` — chi tiết đơn hiển thị **bảng an quẻ đầy
  đủ** (dùng lại `AnQueTable`/`MiniHexCard`/`HexMeaning` từ CastResult
  + luận cơ bản từ `cast_json.luan`, bảng an quẻ quẻ biến trong mục thu
  gọn; JSON gốc giữ ở "Dữ liệu gốc"); khu vực **bài nháp của Muse**:
  nút "Yêu cầu Muse soạn nháp" / trạng thái chờ kèm thời gian yêu cầu /
  nháp chỉ-đọc + nút chép vào ô bài luận + "Yêu cầu soạn lại" (duyệt vẫn
  ở chat theo quyết định); **timeline nhật ký thao tác** cuối panel.
- Cron `gieo-que-order-watch`: thêm mục HÀNG CHỜ NHÁP (đơn có
  `draft_requested_at`, chưa có `draft_reading`, khung 07:00–22:45) —
  soạn theo chuẩn cũ, ghi `draft_reading` qua REST, ghi sự kiện
  `draft_written` với actor "Muse — trợ lý", trình nháp trong chat chờ
  duyệt, đánh dấu drafted_codes chống trùng; mục soạn nháp tự động cũng
  ghi nháp + sự kiện tương tự. Lịch 15 phút và các hành vi cũ giữ
  nguyên. **Lưu ý: cron đang tạm dừng vì credential Resend bị 401 —
  chờ Thanh nối lại Resend thì mới chạy tiếp.** (Đã nối lại sau đó cùng
  ngày — xem mục 11.)

## 11. Nâng cấp Admin GIAI ĐOẠN 2 + Realtime tra cứu (2026-11-20)

Spec: `~/workspace/your_files/nang-cap-admin/spec-nang-cap-admin.md`
(mục 8 + Khối 2 + Khối 3). Realtime tra cứu do Thanh duyệt riêng cùng ngày.
Không thay đổi dữ liệu (không migration): mọi tính năng chạy trên bảng/cột
hiện có.

**A. Hạn giao + đơn treo (admin):**
- `lib/config.js`: `ETA_HOURS` (standard 24h / priority 6h — tính từ
  `orders.created_at`, quyết định đã chốt), `STUCK_HOURS = 48`.
- `components/AdminClient.js`: mỗi đơn chưa giao bài hiện nhãn đếm ngược
  ("còn X giờ Y phút" — vàng khi < 2 giờ, đỏ "QUÁ HẠN …" khi trễ; đồng hồ
  tự chạy mỗi 30 giây); đơn `cho_thanh_toan` quá 48 giờ thêm nhãn "treo —
  chờ thanh toán lâu". Nút lọc **"Ưu tiên xử lý"**: sắp xếp quá hạn →
  sắp hết hạn → đã gửi xuống cuối.

**B. Gửi bài qua Zalo (chi tiết đơn, khi đơn `da_gui`):**
- Mẫu tin trong `lib/config.js`: `ZALO_MESSAGE_TEMPLATE` + hàm
  `zaloNotifyMessage(order)` (tên khách, mã đơn, link tra cứu
  `PUBLIC_SITE_URL + /tra-cuu`, hướng dẫn nhập mã + liên hệ).
- Nút "Copy mẫu tin nhắn Zalo", "Copy link tra cứu", "Đã báo khách" —
  nút cuối gọi PATCH `{ customer_notified: true }`, chỉ ghi sự kiện
  `order_events` action `customer_notified` (actor = admin), không đổi
  trạng thái đơn. KHÔNG làm gửi email khách (chưa có tên miền).

**C. Thống kê (admin):**
- `GET /api/admin/stats?days=14|30` (mặc định 14, tối đa 60): lượt gieo
  theo ngày theo giờ Asia/Ho_Chi_Minh tách Lục Hào/Mai Hoa, đơn theo 4
  trạng thái, doanh thu đã xác nhận (da_thanh_toan trở đi, tách theo gói)
  + đang chờ, tỉ lệ gieo → đơn trong kỳ (kèm ghi chú chỉ số tương đối),
  hai bộ đếm cổng Phase 0 toàn thời gian (100 lượt gieo / 20 đơn).
- `GET /api/admin/casts?limit=50`: 50 lượt gieo gần nhất (thời gian, lĩnh
  vực, cách gieo, câu hỏi) — chỉ sau đăng nhập admin.
- AdminClient thêm tab "Thống kê" (thanh tiến độ cổng, bảng ngày, danh
  sách lượt gieo). Cả hai API đều qua `getAuthedAdmin` như route admin
  hiện có (không token → 403, đã kiểm chứng).

**D. Realtime cho trang tra cứu (Supabase Realtime Broadcast):**
- Kênh riêng theo đơn: topic `order-<MÃ ĐƠN>-<sha256(liên hệ) 16 ký tự>`
  (`lib/orderRealtime.js` — `orderChannelTopic`). Người lạ không đoán
  được kênh; tín hiệu CHỈ gồm trạng thái mới, KHÔNG chứa bài luận.
- API tra cứu trả thêm trường `channel` sau khi đã xác thực mã đơn +
  liên hệ như cũ — trình duyệt không tự băm, không lộ thêm dữ liệu.
- Phía phát: `broadcastOrderUpdate()` POST tới Realtime HTTP API bằng
  service-role key, bọc try/catch. Gắn trong `PATCH /api/admin/orders`:
  sau mỗi cập nhật thành công (đổi trạng thái, gắn bài, duyệt nháp, báo
  khách…) đều phát tín hiệu cho đơn đó.
- Đường concierge ngoài web: `scripts/notify-order-update.mjs <MÃ ĐƠN>`
  (đọc khóa từ env hoặc `.env.local`, tự tra contact/status của đơn rồi
  phát đúng kênh). Cron `gieo-que-order-watch` đã thêm mục 6: sau khi
  Thanh duyệt nháp trong chat và Muse gắn bài qua REST, chạy script này
  để khách đang mở trang tra cứu thấy bài ngay.
- Phía nhận (`app/tra-cuu/page.js`): sau tra cứu thành công, hiện **thanh
  bước trạng thái sống** (Đã nhận đơn → Đã xác nhận thanh toán → Đang
  luận → Đã gửi bài luận); lấy URL + anon key công khai qua
  `GET /api/public-config`, đăng ký nghe kênh của đơn bằng supabase-js;
  nhận tín hiệu thì tự tra cứu lại và cập nhật — bài tự hiện khi đơn
  chuyển `da_gui`. Thiếu cấu hình công khai / nghe lỗi → tự lùi về hỏi
  lại mỗi 30 giây khi trang đang mở (và polling tự tắt khi realtime đã
  SUBSCRIBED). Đơn đã giao thì ngừng nghe.
- **Trạng thái kiểm chứng:** phía PHÁT đã kiểm chứng thật trên Supabase
  production (HTTP broadcast API trả 200; topic do helper/lookup/CLI suy
  ra khớp nhau). Phía NHẬN chưa kiểm chứng được từ VM này: **mọi kết nối
  WebSocket ra ngoài từ VM đều bị chặn** (thử cả máy chủ echo công khai
  đều timeout, trong khi HTTPS bình thường) — lỗi "transport failure" là
  giới hạn môi trường kiểm thử, không phải lỗi code; trình duyệt khách
  dùng WebSocket gốc như mọi site Supabase. Nhờ cơ chế fallback polling
  30 giây, khách vẫn tự thấy bài kể cả khi realtime không lên. Biến môi
  trường cần cho realtime thật: `NEXT_PUBLIC_SUPABASE_URL` +
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase Dashboard → Settings → API)
  — cả hai ĐÃ có trong `.env.local` và production (trang /admin dùng
  chính cặp này để đăng nhập), nên không cần Thanh thêm gì.

## 12. Nâng cấp Admin GIAI ĐOẠN 3 — người dùng + phân quyền (2026-11-20)

Spec: `~/workspace/your_files/nang-cap-admin/spec-nang-cap-admin.md`
(Khối 4; quyết định đã khóa: `ADMIN_EMAILS` giữ VĨNH VIỄN làm cửa khẩn cấp;
Luận viên ĐƯỢC đánh dấu đã thanh toán; duyệt nháp vẫn ở chat.)

**⚠️ CẦN HÀNH ĐỘNG CỦA CHỦ WEB — chạy migration:** dán toàn bộ file
`supabase/migration-2026-11-20-admin-gd3.sql` vào Supabase Dashboard →
SQL Editor → Run (tạo bảng `admin_users` + RLS, seed sẵn tài khoản của
Thanh = owner). Tính đến lúc deploy GĐ3, DB live CHƯA có bảng này (đã
kiểm bằng REST: lỗi PGRST205). Code chạy an toàn khi chưa migration:
phân giải quyền tự lùi về cơ chế `ADMIN_EMAILS` như trước GĐ3 (Thanh
vẫn là Chủ duy nhất, mọi thao tác đơn chạy bình thường); riêng API/tab
"Người dùng" trả `needs_migration` kèm hướng dẫn thay vì lỗi. Sau khi
chạy migration, vào /admin → tab **Người dùng** → nhập email + chọn vai
→ "Gửi lời mời" để mời người đầu tiên. `supabase/schema.sql` đã nối
thêm bảng này cho cài mới.

**Cơ chế phân giải quyền (phía server — `lib/supabaseServer.js`):**
`getAuthedAdmin` nay trả `{ email, userId, role }`, thứ tự phân giải:
1. Email nằm trong `ADMIN_EMAILS` → **owner** (cửa khẩn cấp, luôn thắng
   — kể cả khi bảng chưa có hoặc dòng bị khóa; chỉ chứa email của Thanh).
2. Tra `admin_users` theo `user_id` (ưu tiên) hoặc email: có dòng +
   `active = true` → vai theo bảng (`owner` | `reader` | `viewer`).
3. Không có dòng / đã khóa / chưa có bảng → không phải admin (403).

**Ma trận áp dụng tại từng route (server là chốt chặn thật, UI chỉ ẩn nút):**
- `GET /api/admin/orders`, `/stats`, `/casts` — cả 3 vai.
- `PATCH /api/admin/orders` — chỉ owner + reader; viewer nhận 403 riêng
  ("Vai Chỉ xem không được thay đổi đơn"). Reader làm được mọi thao tác
  đơn gồm đánh dấu đã thanh toán, gắn bài, yêu cầu nháp, báo khách.
- `GET /api/admin/me` (mới) — trả email + vai của chính người đang đăng
  nhập, cho giao diện hiện vai và ẩn khu vực theo vai.
- `GET/POST/PATCH /api/admin/users` (mới) — **chỉ owner**.

**Mời người dùng:** POST dùng Supabase Auth Admin API
`inviteUserByEmail` (service-role) — **email mời do hệ thống mail của
Supabase gửi** (mẫu + giới hạn gửi mặc định của Supabase, không qua
Resend). Lời mời trả về `user.id` nên dòng `admin_users` được ghi ngay
kèm đúng vai — người được mời bấm link trong email sẽ vào thẳng /admin
trong trạng thái đã đăng nhập (link quay về `/admin` nếu
`NEXT_PUBLIC_SITE_URL` đã đặt), sau đó **đặt mật khẩu ở mục "Đổi mật
khẩu"** trên đầu trang admin (mục này dùng cho mọi tài khoản, cũng là
cách người được mời có mật khẩu để đăng nhập các lần sau). Nếu email đã
có tài khoản Supabase Auth từ trước, hệ thống không gửi mời mới mà tìm
tài khoản sẵn có và chỉ cấp vai. Khóa tài khoản = đặt `active = false`
trong `admin_users` (mọi API admin lập tức từ chối; không ban ở tầng
Auth để cơ chế khóa có một nguồn sự thật duy nhất).

**Chốt an toàn khi đổi vai/khóa (PATCH users, kiểm phía server):**
không sửa được tài khoản Chủ gốc (user_id/email của Thanh) trừ chính
Thanh; không tự hạ vai/tự khóa chính mình; không hạ vai/khóa Chủ cuối
cùng đang hoạt động.

**Giao diện (`components/AdminClient.js`):** đầu trang hiện email + vai
của chính mình; tab "Người dùng" chỉ Chủ thấy (danh sách tài khoản kèm
lần đăng nhập gần nhất lấy từ Supabase Auth, form mời email + vai, đổi
vai/khóa tại chỗ, tự khóa các nút trên dòng của chính mình); vai viewer
bị khóa mọi nút sửa đơn + ô bài luận chỉ đọc (server vẫn chặn độc lập).

**Giới hạn kiểm chứng:** chưa có tài khoản phụ thật để đăng nhập thử
từng vai — phần kiểm chứng đăng nhập theo vai (mời → nhận mail → đăng
nhập → đúng quyền) chờ Thanh tạo/mời tài khoản phụ đầu tiên sau khi
chạy migration. Đã kiểm chứng được: build xanh; smoke local (trang
công khai 200; mọi API admin không token/token giả → 403); mã lỗi
thiếu bảng trên DB live khớp heuristic fallback (PGRST205).

## 13. Đơn luận sâu bắt buộc gắn quẻ đã gieo (2026-11-20, commit 30be3ba)
- Bối cảnh: đơn GQ-T9G6Z9 vào hệ thống mà cast_json trống rỗng (khách vào
  thẳng trang đặt đơn / mất phiên gieo) — không có gì để luận.
- Chặn 2 lớp: (1) trang /luan-sau: chưa có quẻ trong phiên thì hiện hộp
  cảnh báo, khóa nút tạo đơn ("Hãy gieo quẻ trước khi tạo đơn"), bỏ luôn
  liên kết "Bỏ gắn quẻ này"; submit() cũng tự chặn. (2) API POST
  /api/orders: cast_json thiếu hoặc không có result.que_chu → 400 với
  thông báo rõ ràng. Cả Lục Hào lẫn Mai Hoa đều có result.que_chu nên một
  điều kiện phủ cả hai.
- Kiểm chứng live: POST không quẻ → 400 đúng thông báo, không tạo đơn;
  /luan-sau 200. Luồng có quẻ không đổi.
- Ghi chú hạ tầng: push GitHub từ VM phải qua ssh.github.com:443 + HTTP
  CONNECT proxy — helper riêng `~/workspace/tools/ssh-github-connect.py`
  (đọc cổng proxy từ HTTPS_PROXY; helper cũ ssh-proxy-connect.py ghim
  cổng 3130 cho đường Tailscale/MSI, dùng cho GitHub sẽ rớt).
