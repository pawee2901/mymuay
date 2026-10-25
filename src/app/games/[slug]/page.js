import { notFound } from 'next/navigation';
import { prisma } from '@/db';
import { findGameBySlug } from '@/lib/gameCatalog';
import { getWepayCatalog } from '@/lib/wepay';
import GameTopupView from '@/components/GameTopupView';

export const revalidate = 0;

const include = {
  category: true,
  options: { orderBy: [{ position: 'asc' }, { price: 'asc' }] },
};

async function findProduct(slug) {
  const byId = await prisma.product.findUnique({ where: { id: slug }, include });
  if (byId) return byId;

  // Old URLs such as /games/rov still work
  const legacy = findGameBySlug(slug);
  if (legacy) {
    return prisma.product.findFirst({ where: { categoryId: legacy.id, type: { in: ['TOPUP', 'CASHCARD'] } }, include });
  }
  return prisma.product.findFirst({ where: { wepayCompany: slug.toUpperCase() }, include });
}

// Packages that wePAY reports as temporarily unavailable
async function unavailableAmounts(product) {
  try {
    const catalog = await getWepayCatalog();
    const company = (catalog[product.wepayType] || []).find((c) => c.company_id === product.wepayCompany);
    return new Set((company?.denomination || []).filter((d) => d.product_availability === false).map((d) => d.price));
  } catch {
    return new Set();
  }
}

export default async function GameDetailPage({ params }) {
  const { slug } = await params;
  const product = await findProduct(decodeURIComponent(slug));

  if (!product || !product.isActive || !product.wepayCompany || product.options.length === 0) {
    notFound();
  }

  const unavailable = await unavailableAmounts(product);

  const serialized = {
    id: product.id,
    name: product.name,
    description: product.description,
    image: product.category?.image || product.image,
    wepayType: product.wepayType,
    wepayCompany: product.wepayCompany,
    wepayRefFormat: product.wepayRefFormat,
    wepayServers: product.wepayServers,
    options: product.options.map((option) => ({
      id: option.id,
      name: option.name,
      price: option.price,
      agentPrice: option.agentPrice || 0,
      available: !unavailable.has(option.wepayAmount),
    })),
  };

  return <GameTopupView product={serialized} />;
}
