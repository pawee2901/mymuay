import { prisma } from '@/db';
import GameGrid from '@/components/GameGrid';

export const revalidate = 0;

export default async function GamesPage() {
  const products = await prisma.product.findMany({
    where: { type: { in: ['TOPUP', 'CASHCARD'] }, isActive: true, wepayCompany: { not: '' } },
    include: { category: true, options: { select: { price: true } } },
    orderBy: [{ createdAt: 'asc' }],
  });

  const items = products
    .filter((p) => p.options.length > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      image: p.category?.image || p.image,
      wepayType: p.wepayType,
      minPrice: Math.min(...p.options.map((o) => o.price)),
    }));

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 flex-1 font-sans">
      <h1 className="text-xl font-black text-slate-900">เติมเกม & บัตรเติมเงิน</h1>
      <p className="text-sm text-slate-500 mt-1">เลือกเกม → ใส่ ID → เลือกแพ็กเกจ → จ่าย ระบบเติมอัตโนมัติ 24 ชม.</p>
      <GameGrid items={items} />
    </div>
  );
}
