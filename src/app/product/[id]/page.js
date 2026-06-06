import { notFound } from 'next/navigation';
import { prisma } from '@/db';
import ProductView from '@/components/ProductView';

export const revalidate = 0; // Disable cache to keep stock live

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  // Fetch product from SQLite database with category, orders, and options with stock
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      stockItems: { where: { isUsed: false } },
      orders: { where: { status: 'COMPLETED' } },
      options: {
        include: {
          stockItems: { where: { isUsed: false } }
        },
        orderBy: { price: 'asc' }
      }
    }
  });

  if (!product) {
    notFound();
  }

  // Calculate total stock (sum of options stock, or main stock if no options exist)
  const totalStockCount = product.options.length > 0
    ? product.options.reduce((sum, opt) => sum + opt.stockItems.length, 0)
    : product.stockItems.length;

  // Sanitize product object to pass to client component safely
  const serializedProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    type: product.type,
    categoryName: product.category.name,
    categoryId: product.categoryId,
    stockCount: totalStockCount,
    soldCount: product.orders.reduce((sum, order) => sum + order.quantity, 0),
    options: product.options.map(opt => ({
      id: opt.id,
      name: opt.name,
      price: opt.price,
      stockCount: opt.stockItems.length
    }))
  };

  return (
    <div className="flex-1 bg-slate-50/50">
      <ProductView product={serializedProduct} />
    </div>
  );
}
