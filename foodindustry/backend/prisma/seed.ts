import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const categories = await Promise.all(
    [
      { name: 'Rice & Grains', sortOrder: 1 },
      { name: 'Spices & Condiments', sortOrder: 2 },
      { name: 'Fresh Produce', sortOrder: 3 },
      { name: 'Dairy & Chilled', sortOrder: 4 },
    ].map((c) => prisma.category.upsert({ where: { name: c.name }, update: {}, create: c }))
  );

  const [rice, spices, produce, dairy] = categories;

  const products: Parameters<typeof prisma.product.upsert>[0]['create'][] = [
    {
      sku: 'RICE-BASMATI-5KG',
      name: 'Premium Basmati Rice 5kg',
      description: 'Long-grain aromatic basmati rice.',
      unit: 'bag',
      price: 14.99,
      vatRate: 0.06,
      allergens: JSON.stringify([]),
      imageEmoji: '🌾',
      stockQty: 40,
      categoryId: rice.id,
    },
    {
      sku: 'SPICE-GARAM-200G',
      name: 'Garam Masala 200g',
      description: 'Traditional spice blend.',
      unit: 'pack',
      price: 3.49,
      vatRate: 0.06,
      allergens: JSON.stringify([]),
      imageEmoji: '🌶️',
      stockQty: 60,
      categoryId: spices.id,
    },
    {
      sku: 'PULSE-TOORDAL-1KG',
      name: 'Toor Dal 1kg',
      description: 'Split pigeon peas.',
      unit: 'bag',
      price: 4.25,
      vatRate: 0.06,
      allergens: JSON.stringify([]),
      imageEmoji: '🫘',
      stockQty: 55,
      categoryId: rice.id,
    },
    {
      sku: 'FRUIT-MANGO-BOX',
      name: 'Alphonso Mangoes (Box)',
      description: 'Seasonal Alphonso mangoes.',
      unit: 'box',
      price: 18.0,
      vatRate: 0.06,
      allergens: JSON.stringify([]),
      imageEmoji: '🥭',
      stockQty: 15,
      categoryId: produce.id,
    },
    {
      sku: 'DAIRY-PANEER-400G',
      name: 'Paneer 400g',
      description: 'Fresh Indian cottage cheese.',
      unit: 'pack',
      price: 5.99,
      vatRate: 0.06,
      allergens: JSON.stringify(['milk']),
      imageEmoji: '🧀',
      stockQty: 25,
      categoryId: dairy.id,
    },
    {
      sku: 'HERB-CURRYLEAF',
      name: 'Fresh Curry Leaves',
      description: 'Aromatic fresh curry leaves.',
      unit: 'bunch',
      price: 1.5,
      vatRate: 0.06,
      allergens: JSON.stringify([]),
      imageEmoji: '🍃',
      stockQty: 30,
      categoryId: produce.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@foodindustry.local' },
    update: {},
    create: {
      email: 'admin@foodindustry.local',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  const customerPasswordHash = await bcrypt.hash('Customer123!', 12);
  await prisma.user.upsert({
    where: { email: 'customer@foodindustry.local' },
    update: {},
    create: {
      email: 'customer@foodindustry.local',
      passwordHash: customerPasswordHash,
      firstName: 'Test',
      lastName: 'Customer',
      role: 'CUSTOMER',
    },
  });

  await prisma.promoCode.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 20,
      usageLimit: 100,
    },
  });

  console.log('Seed complete.');
  console.log('  Admin login:    admin@foodindustry.local / Admin123!');
  console.log('  Customer login: customer@foodindustry.local / Customer123!');
  console.log('  Promo code:     WELCOME10 (10% off orders over €20)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
