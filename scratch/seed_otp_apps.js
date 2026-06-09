const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({
  url: 'file:./prisma/dev.db'
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_APPS = [
  { id: 'chatgpt', name: 'ChatGPT', senderEmails: 'openai.com, chatgpt.com', logoUrl: null, isActive: true },
  { id: 'netflix', name: 'Netflix', senderEmails: 'netflix.com', logoUrl: null, isActive: true },
  { id: 'disney', name: 'Disney+', senderEmails: 'disneyplus.com', logoUrl: null, isActive: true },
  { id: 'trueid', name: 'TrueID', senderEmails: 'trueid.net, true.th', logoUrl: null, isActive: true },
  { id: 'prime', name: 'Prime Video', senderEmails: 'amazon.com, primevideo.com', logoUrl: null, isActive: true },
  { id: 'spotify', name: 'Spotify', senderEmails: 'spotify.com', logoUrl: null, isActive: true },
  { id: 'youtube', name: 'YouTube', senderEmails: 'youtube.com, google.com', logoUrl: null, isActive: true },
  { id: 'other', name: 'ทุกอีเมล', senderEmails: '', logoUrl: null, isActive: true },
];

async function seed() {
  for (const app of DEFAULT_APPS) {
    await prisma.otpApp.upsert({
      where: { id: app.id },
      update: {
        name: app.name,
        senderEmails: app.senderEmails,
      },
      create: app
    });
    console.log(`Seeded OTP app: ${app.name}`);
  }
}

seed()
  .then(() => console.log('Seed completed successfully!'))
  .catch(err => console.error('Seed failed:', err));
