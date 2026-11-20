import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured, getAuthedAdmin } from "@/lib/supabaseServer";

// Thống kê vận hành (Khối 3 — GĐ2) — bắt buộc token admin như mọi route admin.
// Phân quyền (GĐ3): cả 3 vai owner/reader/viewer đều xem được thống kê.
// Tính từ hai bảng casts + orders hiện có, gom nhóm phía server (dữ liệu
// Phase 0 còn nhỏ). Ngày/giờ quy về Asia/Ho_Chi_Minh.
const TZ = "Asia/Ho_Chi_Minh";
const CONFIRMED = ["da_thanh_toan", "dang_luan", "da_gui"];
const GATE_CASTS = 100;
const GATE_ORDERS = 20;

function vnDateKey(d) {
  // "2026-11-20" theo giờ Việt Nam
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export async function GET(req) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, configured: false, error: "Chưa cấu hình Supabase." }, { status: 503 });
  }
  const admin = await getAuthedAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập hoặc email không có quyền admin." }, { status: 403 });
  }
  const daysParam = parseInt(new URL(req.url).searchParams.get("days") || "14", 10);
  const days = Number.isFinite(daysParam) ? Math.min(60, Math.max(1, daysParam)) : 14;

  const sb = supabaseAdmin();

  // Khung ngày theo giờ VN: hôm nay và (days-1) ngày trước đó.
  const now = new Date();
  const dayKeys = [];
  for (let i = days - 1; i >= 0; i--) {
    dayKeys.push(vnDateKey(new Date(now.getTime() - i * 86400000)));
  }
  const windowStart = new Date(now.getTime() - days * 86400000).toISOString();

  const [castsRes, ordersRes, totalCastsRes, totalOrdersRes] = await Promise.all([
    sb.from("casts").select("created_at, method").gte("created_at", windowStart).limit(10000),
    sb.from("orders").select("status, package, price, created_at").limit(10000),
    sb.from("casts").select("id", { count: "exact", head: true }),
    sb.from("orders").select("id", { count: "exact", head: true }),
  ]);
  if (castsRes.error) return NextResponse.json({ ok: false, error: castsRes.error.message }, { status: 500 });
  if (ordersRes.error) return NextResponse.json({ ok: false, error: ordersRes.error.message }, { status: 500 });

  // Lượt gieo theo ngày (tách Lục Hào / Mai Hoa).
  const byDay = new Map(dayKeys.map((k) => [k, { date: k, total: 0, luc_hao: 0, mai_hoa: 0 }]));
  let castsInWindow = 0;
  for (const c of castsRes.data || []) {
    const key = vnDateKey(new Date(c.created_at));
    const row = byDay.get(key);
    if (!row) continue;
    row.total += 1;
    castsInWindow += 1;
    if (c.method === "mai-hoa") row.mai_hoa += 1;
    else row.luc_hao += 1;
  }

  // Đơn theo trạng thái + doanh thu.
  const ordersByStatus = { cho_thanh_toan: 0, da_thanh_toan: 0, dang_luan: 0, da_gui: 0 };
  let revenueConfirmed = 0;
  let revenuePending = 0;
  const revenueByPackage = { standard: 0, priority: 0 };
  let ordersInWindow = 0;
  for (const o of ordersRes.data || []) {
    if (o.status in ordersByStatus) ordersByStatus[o.status] += 1;
    if (CONFIRMED.includes(o.status)) {
      revenueConfirmed += o.price || 0;
      if (o.package in revenueByPackage) revenueByPackage[o.package] += o.price || 0;
    } else if (o.status === "cho_thanh_toan") {
      revenuePending += o.price || 0;
    }
    if (new Date(o.created_at) >= new Date(windowStart) && byDay.has(vnDateKey(new Date(o.created_at)))) {
      ordersInWindow += 1;
    }
  }

  const totalCasts = totalCastsRes.count || 0;
  const totalOrders = totalOrdersRes.count || 0;

  return NextResponse.json({
    ok: true,
    days,
    casts_by_day: [...byDay.values()],
    casts_in_window: castsInWindow,
    orders_in_window: ordersInWindow,
    orders_by_status: ordersByStatus,
    revenue_confirmed: revenueConfirmed,
    revenue_pending: revenuePending,
    revenue_by_package: revenueByPackage,
    // Chỉ số tương đối: một khách gieo nhiều lần rồi mới đặt 1 đơn.
    conversion_window: castsInWindow > 0 ? ordersInWindow / castsInWindow : null,
    gates: {
      casts: { current: totalCasts, target: GATE_CASTS },
      orders: { current: totalOrders, target: GATE_ORDERS },
    },
  });
}
