const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

async function main() {
  try {
    const setting = await prisma.depositSetting.findUnique({
      where: { id: 'default' }
    });
    console.log('--- Database Settings ---');
    console.log('SlipOk API Key:', JSON.stringify(setting?.slipOkApiKey));
    console.log('SlipOk Branch ID:', JSON.stringify(setting?.slipOkBranchId));
    console.log('--- Env Settings ---');
    console.log('SLIPOK_API_KEY:', JSON.stringify(process.env.SLIPOK_API_KEY));
    console.log('SLIPOK_BRANCH_ID:', JSON.stringify(process.env.SLIPOK_BRANCH_ID));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
