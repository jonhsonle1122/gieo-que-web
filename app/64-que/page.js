import HexGrid from "@/components/HexGrid";
import { HEXAGRAMS } from "@/lib/hexagrams";

export const metadata = {
  title: "Tra cứu 64 quẻ Kinh Dịch",
  description:
    "Danh sách đủ 64 quẻ Kinh Dịch có tìm kiếm: cổ văn Thoán từ, Hào từ, Đại tượng và tượng giải tiếng Việt cho từng quẻ.",
};

export default function HexIndexPage() {
  const items = HEXAGRAMS.map((h) => ({
    number: h.number,
    name: h.name,
    slug: h.slug,
    bits: h.bits,
    tu_khoa: h.info.tu_khoa,
    y_chinh: h.info.y_chinh,
  }));
  return (
    <div>
      <section className="hero">
        <div className="han-bg">卦</div>
        <h1>64 Quẻ Kinh Dịch</h1>
        <p className="lead">
          Tra cứu cổ văn và tượng giải của đủ 64 quẻ. Dùng ô tìm kiếm để lọc theo số quẻ, tên quẻ hoặc từ khóa.
        </p>
      </section>
      <HexGrid items={items} />
    </div>
  );
}
