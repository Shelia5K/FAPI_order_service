/**
 * Prisma Database Seed Script
 *
 * Populates the database with initial sample data for development.
 * Run with: npm run db:seed (or npx tsx prisma/seed.ts)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (optional, for clean seeding)
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  // Create sample products
  // Prices are in CZK WITHOUT VAT
  const products = await prisma.product.createMany({
    data: [
      {
        title: 'Základní balíček',
        description:
          'Základní balíček služeb pro malé firmy. Zahrnuje základní fakturaci a správu kontaktů.',
        priceCzk: 1990.0,
        quantity: 100,
      },
      {
        title: 'Standardní balíček',
        description:
          'Standardní balíček služeb s rozšířenými funkcemi. Zahrnuje pokročilou fakturaci, správu skladu a reporting.',
        priceCzk: 4990.0,
        quantity: 50,
      },
      {
        title: 'Premium balíček',
        description:
          'Premium balíček s plnou podporou a všemi funkcemi. Zahrnuje neomezenou fakturaci, API přístup a prioritní podporu.',
        priceCzk: 9990.0,
        quantity: 25,
      },
    ],
  });

  console.log(`✅ Created ${products.count} products`);

  // Fetch and display created products
  const allProducts = await prisma.product.findMany();
  console.log('\n📦 Products in database:');
  for (const p of allProducts) {
    console.log(`   - ${p.title}: ${p.priceCzk} CZK (qty: ${p.quantity})`);
  }

  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

