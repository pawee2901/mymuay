import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/db';
import { getWepayBalance, getWepayCatalog, denominationLabel, WepayError } from '@/lib/wepay';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';
const SUPPORTED_TYPES = ['gtopup', 'cashcard', 'mtopup'];

function verifyAdmin(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === 'ADMIN' ? decoded : null;
  } catch {
    return null;
  }
}

const roundPrice = (amount, markup, roundUp) => {
  const value = amount * (1 + (Number(markup) || 0) / 100);
  return roundUp ? Math.ceil(value) : Math.round(value * 100) / 100;
};

async function findCompany(type, companyId) {
  if (!SUPPORTED_TYPES.includes(type)) throw new Error('ประเภทบริการไม่รองรับ');
  const catalog = await getWepayCatalog({ force: true });
  const company = (catalog[type] || []).find((c) => c.company_id === companyId);
  if (!company) throw new Error(`ไม่พบบริการ ${companyId} ใน wePAY`);
  return company;
}

function wepayFields(type, company) {
  return {
    type: type === 'cashcard' ? 'CASHCARD' : 'TOPUP',
    wepayType: type,
    wepayCompany: company.company_id,
    wepayRefFormat: typeof company.refs_format?.ref1 === 'string' ? company.refs_format.ref1 : '',
    wepayServers: JSON.stringify(company.gameservers || []),
  };
}

/**
 * Make the product's options mirror the wePAY denominations.
 * Existing options keep their selling price unless `reprice` is set; options that wePAY
 * no longer offers (and legacy WonDD options) are removed.
 */
async function syncOptions(productId, type, company, { markup = 0, roundUp = false, reprice = false } = {}) {
  const existing = await prisma.productOption.findMany({ where: { productId } });
  const denominations = company.denomination || [];
  const keep = new Set();

  for (const [index, denomination] of denominations.entries()) {
    const name = denominationLabel(denomination, type);
    const match = existing.find((opt) => opt.wepayAmount === denomination.price && !keep.has(opt.id));
    if (match) {
      keep.add(match.id);
      await prisma.productOption.update({
        where: { id: match.id },
        data: { name, position: index, ...(reprice ? { price: roundPrice(denomination.price, markup, roundUp) } : {}) },
      });
    } else {
      const created = await prisma.productOption.create({
        data: {
          productId,
          name,
          price: roundPrice(denomination.price, markup, roundUp),
          wepayAmount: denomination.price,
          position: index,
        },
      });
      keep.add(created.id);
    }
  }

  const stale = existing.filter((opt) => !keep.has(opt.id)).map((opt) => opt.id);
  if (stale.length > 0) await prisma.productOption.deleteMany({ where: { id: { in: stale } } });

  const options = await prisma.productOption.findMany({ where: { productId } });
  if (options.length > 0) {
    await prisma.product.update({ where: { id: productId }, data: { price: Math.min(...options.map((o) => o.price)) } });
  }
  return { total: denominations.length, removed: stale.length };
}

// Games that existed before wePAY (WonDD) => matching wePAY company_id
const LEGACY_GAME_LINKS = {
  rov_cat_topup: 'ROV-M',
  freefire_cat_topup: 'FREEFIRE',
  undawn_cat_topup: 'UNDAWN',
  codm_cat_topup: 'COD-M',
  deltaforce_cat_topup: 'GRN-DTF',
  haikyu_cat_topup: 'HAIKYUFH',
  pubg_cat_topup: 'PUBGM',
  mlbb_cat_topup: 'MLBB',
  valorant_cat_topup: 'VALORANT-D',
  heartopia_cat_topup: 'HEARTOPIA',
};

// Create (or re-enable) the product for a wePAY company and mirror its packages
async function importCompany(type, company, { markup, roundUp } = {}) {
  let product = await prisma.product.findFirst({ where: { wepayType: type, wepayCompany: company.company_id } });

  if (!product) {
    const slug = company.company_id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const placeholder = `https://placehold.co/320x320/e0ecff/2563eb?text=${encodeURIComponent(company.company_name)}`;
    const category = await prisma.category.upsert({
      where: { id: `wp_${slug}_cat` },
      update: {},
      create: { id: `wp_${slug}_cat`, name: `${company.company_name} (${company.company_id})`, image: placeholder },
    });
    product = await prisma.product.create({
      data: {
        name: company.company_name,
        description: '',
        price: 0,
        image: placeholder,
        categoryId: category.id,
        ...wepayFields(type, company),
      },
    });
  } else {
    product = await prisma.product.update({
      where: { id: product.id },
      data: { ...wepayFields(type, company), isActive: true },
    });
  }

  const result = await syncOptions(product.id, type, company, { markup, roundUp, reprice: true });
  return { productId: product.id, ...result };
}

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 403 });

  const action = new URL(request.url).searchParams.get('action') || 'catalog';

  try {
    if (action === 'balance') {
      const balance = await getWepayBalance();
      return NextResponse.json({ success: true, balance });
    }

    const catalog = await getWepayCatalog({ force: action === 'refresh' });
    const companies = SUPPORTED_TYPES.flatMap((type) =>
      (catalog[type] || []).map((c) => ({
        type,
        companyId: c.company_id,
        name: c.company_name,
        packages: (c.denomination || []).length,
        minPrice: Math.min(...(c.denomination || []).map((d) => d.price)),
      }))
    );
    return NextResponse.json({ success: true, companies });
  } catch (error) {
    const status = error instanceof WepayError ? 502 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 403 });

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'import') {
      const company = await findCompany(body.type, body.companyId);
      const result = await importCompany(body.type, company, body);
      return NextResponse.json({ success: true, ...result });
    }

    // Link the legacy (WonDD) games first so they keep their images/URLs, then add every remaining service
    if (action === 'import-all') {
      const catalog = await getWepayCatalog({ force: true });
      const pricing = { markup: body.markup, roundUp: body.roundUp };
      let linked = 0;
      let added = 0;

      for (const [productId, companyId] of Object.entries(LEGACY_GAME_LINKS)) {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        const company = (catalog.gtopup || []).find((c) => c.company_id === companyId);
        if (!product || product.wepayCompany || !company) continue;
        await prisma.product.update({ where: { id: productId }, data: wepayFields('gtopup', company) });
        await syncOptions(productId, 'gtopup', company, { ...pricing, reprice: true });
        linked++;
      }

      for (const type of SUPPORTED_TYPES) {
        for (const company of catalog[type] || []) {
          if (type === 'mtopup' && company.company_id.endsWith('-AOP')) continue; // add-on data packs
          const exists = await prisma.product.findFirst({ where: { wepayType: type, wepayCompany: company.company_id } });
          if (exists) continue;
          await importCompany(type, company, pricing);
          added++;
        }
      }
      return NextResponse.json({ success: true, linked, added });
    }

    if (action === 'link' || action === 'sync') {
      const product = await prisma.product.findUnique({ where: { id: body.productId || '' } });
      if (!product) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });

      const type = action === 'link' ? body.type : product.wepayType;
      const companyId = action === 'link' ? body.companyId : product.wepayCompany;
      const company = await findCompany(type, companyId);

      await prisma.product.update({ where: { id: product.id }, data: wepayFields(type, company) });
      const result = await syncOptions(product.id, type, company, {
        markup: body.markup,
        roundUp: body.roundUp,
        reprice: action === 'link' || Boolean(body.reprice),
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'update') {
      const data = {};
      for (const key of ['name', 'image', 'description']) {
        if (typeof body[key] === 'string') data[key] = body[key].trim();
      }
      if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

      const product = await prisma.product.update({ where: { id: body.productId }, data });
      // Game list/detail pages show the category image first
      if (data.image) await prisma.category.update({ where: { id: product.categoryId }, data: { image: data.image } });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const orderCount = await prisma.order.count({ where: { productId: body.productId } });
      if (orderCount > 0) {
        await prisma.product.update({ where: { id: body.productId }, data: { isActive: false } });
        return NextResponse.json({ success: true, hidden: true, message: 'สินค้านี้มีประวัติการขาย จึงซ่อนแทนการลบ' });
      }
      await prisma.product.delete({ where: { id: body.productId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'ไม่รู้จักคำสั่งนี้' }, { status: 400 });
  } catch (error) {
    console.error('[ADMIN WEPAY ERROR]:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
