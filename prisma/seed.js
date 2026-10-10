require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  if (!await db.role.findFirst({ where: { rolename: 'normal' } }))
    await db.role.create({ data: { rolename: 'normal' } });
  if (!await db.memberShip.findFirst({ where: { mname: 'normal', score: 10 } }))
    await db.memberShip.create({ data: { mname: 'normal', score: 10 } });
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
