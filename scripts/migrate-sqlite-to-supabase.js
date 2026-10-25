// One-time copy of all data from the old SQLite file (prisma/dev.db) into Supabase.
// Usage: set DATABASE_URL (Supabase) in .env, run `npx prisma db push`, then
//        npm run db:migrate-from-sqlite [path/to/dev.db] [--replace]
// Refuses to run if Supabase already contains data, unless --replace is given
// (which deletes everything in Supabase first).
require('dotenv').config();
const path = require('path');
const Database = require('better-sqlite3');
const { PrismaClient, Prisma } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Parents before children so foreign keys are satisfied
const MODEL_ORDER = [
  'User', 'Category', 'Subcategory', 'Product', 'ProductOption', 'Order', 'StockItem',
  'PushSubscription', 'CtaCard', 'ChatMessage', 'DepositSetting', 'CarouselSlide',
  'DepositTransaction', 'SiteSetting', 'SlipVerification', 'EmailImapSetting',
  'OtpApp', 'OtpProvider', 'ApiKey', 'ApiRequest',
];

const args = process.argv.slice(2);
const REPLACE = args.includes('--replace');
const sqlitePath = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'prisma', 'dev.db'));
const sqlite = new Database(sqlitePath, { readonly: true });
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const delegate = (model) => prisma[model.charAt(0).toLowerCase() + model.slice(1)];

function convert(value, field) {
  if (value === null || value === undefined) return null;
  switch (field.type) {
    case 'DateTime':
      return new Date(typeof value === 'number' ? value : String(value));
    case 'Boolean':
      return value === 1 || value === true || value === '1' || value === 'true';
    case 'Int':
      return Number.parseInt(value, 10);
    case 'Float':
      return Number(value);
    default:
      return value;
  }
}

async function main() {
  const models = Object.fromEntries(Prisma.dmmf.datamodel.models.map((m) => [m.name, m]));
  const missing = Object.keys(models).filter((name) => !MODEL_ORDER.includes(name));
  if (missing.length) throw new Error(`Add these models to MODEL_ORDER: ${missing.join(', ')}`);

  if (REPLACE) {
    // Children first so foreign keys don't block the deletes
    for (const name of [...MODEL_ORDER].reverse()) await delegate(name).deleteMany();
    console.log('--replace: existing Supabase data deleted');
  }

  for (const name of MODEL_ORDER) {
    const count = await delegate(name).count();
    if (count > 0) throw new Error(`Supabase table "${name}" already has ${count} rows — aborting so nothing is duplicated (use --replace to overwrite).`);
  }

  console.log(`Copying from ${sqlitePath}`);
  for (const name of MODEL_ORDER) {
    const scalarFields = models[name].fields.filter((f) => f.kind === 'scalar' || f.kind === 'enum');
    const rows = sqlite.prepare(`SELECT * FROM "${name}"`).all();
    const data = rows.map((row) =>
      Object.fromEntries(scalarFields.filter((f) => f.name in row).map((f) => [f.name, convert(row[f.name], f)]))
    );

    for (let i = 0; i < data.length; i += 500) {
      await delegate(name).createMany({ data: data.slice(i, i + 500) });
    }

    const copied = await delegate(name).count();
    console.log(`${copied === rows.length ? 'OK  ' : 'DIFF'} ${name.padEnd(20)} ${rows.length} -> ${copied}`);
    if (copied !== rows.length) throw new Error(`Row count mismatch for ${name}`);
  }
  console.log('Done.');
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
