import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured, getAuthedAdmin } from "@/lib/supabaseServer";
import { ORDER_STATUSES, TUY_HY_PACKAGE } from "@/lib/config";

// Thống kê vận hành (Khối 3 — GĐ2; đo lại theo mô hình tùy hỷ 2026-11-21)
// — bắt buộc token admin như mọi route admin. Phân quyền (GĐ3): cả 3 vai
// owner/reader/viewer đều xem được thống kê.
// Cổng Phase 0 mới (thiết kế mục 4): ≥100 lượt gieo + ≥20 yêu cầu luận
// sâu ĐÃ HOÀN TẤT ở mô hình tùy hỷ (status da_gui + package 'tuy_hy') —
// đơn cũ thời mô hình giá KHÔNG tính vào cổng mới. Tỉ lệ tùy hỷ chỉ là
// chỉ số quan sát sức khỏe mô hình, cố ý không đặt ngưỡng đậu/rớt.
// Ngày/giờ quy về Asia/Ho_Chi_Minh.
const TZ = "Asia/Ho_Chi_Minh";
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

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
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

  // Cột tuy_hy_amount chỉ có sau migration 2026-11-21: thử select kèm
  // cột mới trước, lỗi thì lùi về cột gốc (số liệu tùy hỷ coi như trống).
  let ordersRes = await sb
    .from("orders")
    .select("status, package, price, created_at, tuy_hy_amount")
    .limit(10000);
  let hasTuyHyCol = !ordersRes.error;
  if (ordersRes.error) {
    ordersRes = await sb.from("orders").select("status, package, price, created_at").limit(10000);
  }

  const [castsRes, totalCastsRes, totalOrdersRes] = await Promise.all([
    sb.from("casts").select("created_at, method").gte("created_at", windowStart).limit(10000),
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

  // Đơn theo trạng thái (mọi trạng thái cũ + mới) + số liệu mô hình tùy hỷ.
  const ordersByStatus = {};
  for (const s of Object.keys(ORDER_STATUSES)) ordersByStatus[s] = 0;
  let ordersInWindow = 0;
  let tuyHyDelivered = 0; // yêu cầu mô hình mới đã giao bài (mẫu số cổng + tỉ lệ)
  let tuyHyWithAmount = 0; // trong số đó, số đơn có ghi nhận tùy hỷ
  let tuyHyTotal = 0;
  const tuyHyAmounts = [];
  for (const o of ordersRes.data || []) {
    if (o.status in ordersByStatus) ordersByStatus[o.status] += 1;
    else ordersByStatus[o.status] = 1;
    if (new Date(o.created_at) >= new Date(windowStart) && byDay.has(vnDateKey(new Date(o.created_at)))) {
      ordersInWindow += 1;
    }
    if (o.package === TUY_HY_PACKAGE && o.status === "da_gui") {
      tuyHyDelivered += 1;
      const amt = hasTuyHyCol ? o.tuy_hy_amount : null;
      if (amt !== null && amt !== undefined) {
        tuyHyWithAmount += 1;
        tuyHyTotal += Number(amt) || 0;
        tuyHyAmounts.push(Number(amt) || 0);
      }
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
    // Số liệu tùy hỷ (chỉ số quan sát — không phải cổng cứng).
    tuy_hy: {
      delivered_new: tuyHyDelivered,
      with_amount: tuyHyWithAmount,
      total_amount: tuyHyTotal,
      median_amount: median(tuyHyAmounts),
      ratio: tuyHyDelivered > 0 ? tuyHyWithAmount / tuyHyDelivered : null,
      recorded: hasTuyHyCol,
    },
    // Chỉ số tương đối: một khách gieo nhiều lần rồi mới gửi 1 yêu cầu.
    conversion_window: castsInWindow > 0 ? ordersInWindow / castsInWindow : null,
    gates: {
      casts: { current: totalCasts, target: GATE_CASTS },
      // Cổng mới: yêu cầu luận sâu hoàn tất Ở MÔ HÌNH TÙY HỶ (không trộn đơn cũ).
      orders: { current: tuyHyDelivered, target: GATE_ORDERS },
    },
    total_orders_all: totalOrders,
  });
}
