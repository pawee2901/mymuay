import { notFound } from 'next/navigation';
import { prisma } from '@/db';
import { findGameBySlug } from '@/lib/gameCatalog';
import GameTopupView from '@/components/GameTopupView';

export const revalidate = 0;

function parseOptionDisplay(option) {
  const [pointLabel, originalPriceText] = option.name.split('|').map((part) => part.trim());
  let originalPrice;

  if (originalPriceText) {
    originalPrice = Number(originalPriceText);
  } else {
    // Estimate original price from price with ~5.5% discount
    const estimated = option.price / 0.945;
    originalPrice = Math.round(estimated);
    if (originalPrice === 67) originalPrice = 69;
    if (originalPrice === 33) originalPrice = 35;
  }

  return {
    id: option.id,
    name: option.name,
    pointLabel: pointLabel || option.name,
    originalPrice: Number.isFinite(originalPrice) ? originalPrice : option.price,
    price: option.price,
    agentPrice: option.agentPrice || 0,
  };
}

export default async function GameDetailPage({ params }) {
  const resolvedParams = await params;
  const staticGame = findGameBySlug(resolvedParams.slug);

  if (!staticGame) {
    notFound();
  }

  const dbCat = await prisma.category.findUnique({
    where: { id: staticGame.id }
  });

  const game = {
    ...staticGame,
    name: dbCat?.name || staticGame.name,
    image: dbCat?.image || staticGame.image
  };

  const product = await prisma.product.findFirst({
    where: {
      type: 'TOPUP',
      categoryId: game.id,
    },
    include: {
      options: {
        orderBy: [
          { position: 'asc' },
          { price: 'asc' }
        ],
      },
    },
  });

  if (!product) {
    notFound();
  }

  const serializedProduct = {
    id: product.id,
    name: product.name,
    options: product.options.map(parseOptionDisplay),
  };

  return (
    <div className="flex-1 bg-white">
      <GameTopupView game={game} product={serializedProduct} />
    </div>
  );
}
