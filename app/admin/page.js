import AdminClient from "@/components/AdminClient";

export const metadata = { title: "Quản trị đơn luận sâu", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Chỉ truyền cấu hình công khai (URL + anon key) xuống trình duyệt cho
// Supabase Auth; service-role key không bao giờ rời server.
export default function AdminPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return <AdminClient supabaseUrl={url} anonKey={anon} configured={Boolean(url && anon && service)} />;
}
