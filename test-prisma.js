const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking EmailImapSetting on Prisma...");
  if (prisma.emailImapSetting) {
    console.log("It exists!");
    const count = await prisma.emailImapSetting.count();
    console.log("Count:", count);
  } else {
    console.log("It DOES NOT exist!");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
