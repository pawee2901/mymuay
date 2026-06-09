import Link from 'next/link';
import { GAME_CATALOG } from '@/lib/gameCatalog';
import { prisma } from '@/db';

export const revalidate = 0;

export default async function GamesPage() {
  const dbCategories = await prisma.category.findMany();

  const games = GAME_CATALOG.map((game) => {
    const dbCat = dbCategories.find((c) => c.id === game.id);
    return {
      ...game,
      name: dbCat?.name || game.name,
      image: dbCat?.image || game.image,
    };
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 flex-1 font-sans">
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
          🎮 เติมเกมออนไลน์
        </h1>
        <p className="text-xs text-slate-400 mt-1">เลือกเกมที่ต้องการเติม ระบบเติมออโต้ 24 ชั่วโมง</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.slug}`}
            className="group block bg-white border border-slate-200/60 rounded-2xl overflow-hidden hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className="aspect-square w-full overflow-hidden bg-slate-100">
              <img
                src={game.image}
                alt={game.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="p-3 text-center">
              <div className={`text-sm font-bold ${game.accent || 'text-blue-600'} group-hover:text-blue-700 transition-colors truncate`}>
                {game.name}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">ระบบเติมออโต้</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
