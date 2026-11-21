import "./globals.css";
import Link from "next/link";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/config";

export const metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: { default: `${SITE_NAME} — Gieo quẻ Lục Hào & Mai Hoa online`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: { title: SITE_NAME, description: SITE_DESCRIPTION, type: "website", locale: "vi_VN" },
  // File gốc nằm trong app/ (favicon.ico, icon.svg, apple-icon.png — Next phục vụ
  // tại /favicon.ico, /icon.svg, /apple-icon.png); khai báo tường minh ở đây vì
  // khi có metadata.icons, Next không tự chèn link cho icon.svg/apple-icon nữa.
  // icon-192/512 ở public/ phục vụ PWA/Android.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Be+Vietnam+Pro:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="logo">
              <span className="han">易</span>
              <span>{SITE_NAME}</span>
            </Link>
            <nav className="main-nav">
              <Link href="/">Gieo quẻ</Link>
              <Link href="/64-que">64 quẻ</Link>
              <Link href="/luan-sau">Luận sâu</Link>
              <Link href="/tra-cuu">Tra cứu đơn</Link>
              <Link href="/lien-he">Liên hệ</Link>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <nav>
              <Link href="/64-que">Tra cứu 64 quẻ</Link>
              <Link href="/luan-sau">Đặt luận sâu</Link>
              <Link href="/tra-cuu">Tra cứu đơn</Link>
              <Link href="/dieu-khoan">Điều khoản</Link>
              <Link href="/chinh-sach-thanh-toan">Chính sách tùy hỷ</Link>
              <Link href="/lien-he">Liên hệ</Link>
            </nav>
            <p className="mut small">
              {SITE_NAME} — gieo quẻ Kinh Dịch theo phép Lục Hào và Mai Hoa để tham khảo, chiêm nghiệm.
              Mọi nội dung luận giải chỉ mang tính tham khảo và giải trí, không thay thế tư vấn chuyên môn
              về y tế, pháp lý hay tài chính.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
