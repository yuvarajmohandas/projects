import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { categorySchema, productSchema, importSchema, homepageLayoutSchema } from '../schemas/product';

// Reusable Helper Functions
const serialize = <T extends { allergens: string }>(p: T) => ({ ...p, allergens: JSON.parse(p.allergens) as string[] });
const isPrismaError = (err: unknown, code: string) => err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;

export const getCategories = async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json({ categories });
};

export const getProducts = async (req: Request, res: Response) => {
  const { category, search } = req.query as { category?: string; search?: string };
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { categoryId: category } : {}),
      ...(search ? { name: { contains: search } } : {}),
    },
    include: { category: true },
    orderBy: { name: 'asc' },
  });
  res.json({ products: products.map(serialize) });
};

export const getProductById = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: { category: true } });
  if (!product || !product.isActive) return res.status(404).json({ error: 'Product not found' });
  res.json({ product: serialize(product) });
};

export const getHomepageLayout = async (_req: Request, res: Response) => {
  const layoutRecord = await prisma.homepageLayout.findUnique({ where: { id: 'default' } });
  const sections = await prisma.homepageSection.findMany({ where: { layoutId: 'default' }, orderBy: { sortOrder: 'asc' } });
  res.json({
    header: {
      order: layoutRecord ? JSON.parse(layoutRecord.headerOrder) : ['logo', 'name', 'navigation', 'cart'],
      alignment: layoutRecord ? layoutRecord.headerAlignment : 'left',
    },
    sections: sections.map((s) => ({ id: s.id, type: s.type, sortOrder: s.sortOrder, isActive: s.isActive, content: JSON.parse(s.content) })),
  });
};

export const getAdminCategories = async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  res.json({ categories: categories.map(({ _count, ...cat }) => ({ ...cat, productCount: _count.products })) });
};

export const createCategory = async (req: Request, res: Response) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const category = await prisma.category.create({ data: parsed.data });
    res.status(201).json({ category: { ...category, productCount: 0 } });
  } catch (err) {
    if (isPrismaError(err, 'P2002')) return res.status(409).json({ error: 'Category name already exists' });
    throw err;
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const category = await prisma.category.update({ where: { id: req.params.id }, data: parsed.data, include: { _count: { select: { products: true } } } });
    const { _count, ...rest } = category;
    res.json({ category: { ...rest, productCount: _count.products } });
  } catch (err) {
    if (isPrismaError(err, 'P2025')) return res.status(404).json({ error: 'Category not found' });
    if (isPrismaError(err, 'P2002')) return res.status(409).json({ error: 'Category name already exists' });
    throw err;
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  if ((await prisma.product.count({ where: { categoryId: req.params.id } })) > 0) {
    return res.status(409).json({ error: 'Move or deactivate products in this category before deleting' });
  }
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (isPrismaError(err, 'P2025')) return res.status(404).json({ error: 'Category not found' });
    throw err;
  }
};

export const getAdminProducts = async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({ include: { category: true }, orderBy: { name: 'asc' } });
  res.json({ products: products.map(serialize) });
};

export const createProduct = async (req: Request, res: Response) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { allergens, ...rest } = parsed.data;
  try {
    const product = await prisma.product.create({ data: { ...rest, allergens: JSON.stringify(allergens) }, include: { category: true } });
    res.status(201).json({ product: serialize(product) });
  } catch (err) {
    if (isPrismaError(err, 'P2002')) return res.status(409).json({ error: 'Product SKU already exists' });
    if (isPrismaError(err, 'P2003')) return res.status(400).json({ error: 'Selected category does not exist' });
    throw err;
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { allergens, ...rest } = parsed.data;
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: { ...rest, ...(allergens ? { allergens: JSON.stringify(allergens) } : {}) }, include: { category: true } });
    res.json({ product: serialize(product) });
  } catch (err) {
    if (isPrismaError(err, 'P2025')) return res.status(404).json({ error: 'Product not found' });
    if (isPrismaError(err, 'P2002')) return res.status(409).json({ error: 'Product SKU already exists' });
    if (isPrismaError(err, 'P2003')) return res.status(400).json({ error: 'Selected category does not exist' });
    throw err;
  }
};

export const updateStock = async (req: Request, res: Response) => {
  const parsed = prisma.product.update; // Type helper reference
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: { stockQty: req.body.stockQty } });
    res.json({ product });
  } catch (err) {
    if (isPrismaError(err, 'P2025')) return res.status(404).json({ error: 'Product not found' });
    throw err;
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (isPrismaError(err, 'P2025')) return res.status(404).json({ error: 'Product not found' });
    throw err;
  }
};

export const saveHomepageLayout = async (req: Request, res: Response) => {
  const parsed = homepageLayoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { header, sections } = parsed.data;
  try {
    const updatedLayout = await prisma.$transaction(async (tx) => {
      await tx.homepageLayout.upsert({
        where: { id: 'default' },
        update: { headerOrder: JSON.stringify(header.order), headerAlignment: header.alignment },
        create: { id: 'default', headerOrder: JSON.stringify(header.order), headerAlignment: header.alignment },
      });
      await tx.homepageSection.deleteMany({ where: { layoutId: 'default' } });
      for (const s of sections) {
        await tx.homepageSection.create({ data: { id: s.id.startsWith('new-') ? undefined : s.id, layoutId: 'default', type: s.type, sortOrder: s.sortOrder, isActive: s.isActive, content: JSON.stringify(s.content) } });
      }
      const freshSections = await tx.homepageSection.findMany({ where: { layoutId: 'default' }, orderBy: { sortOrder: 'asc' } });
      return { header: { order: header.order, alignment: header.alignment }, sections: freshSections.map((s) => ({ id: s.id, type: s.type, sortOrder: s.sortOrder, isActive: s.isActive, content: JSON.parse(s.content) })) };
    });
    res.json(updatedLayout);
  } catch (err) {
    res.status(500).json({ error: 'Could not save layout' });
  }
};

export const bulkImportProducts = async (req: Request, res: Response) => {
  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const result = await prisma.$transaction(async (tx) => {
      let created = 0, updated = 0;
      for (const item of parsed.data.products) {
        const { allergens, categoryId, categoryName, ...rest } = item;
        let finalCategoryId = categoryId;
        if (!finalCategoryId && categoryName) {
          const cat = await tx.category.upsert({ where: { name: categoryName }, update: {}, create: { name: categoryName } });
          finalCategoryId = cat.id;
        }
        const exists = await tx.product.findUnique({ where: { sku: rest.sku } });
        if (exists) updated++; else created++;
        const payload = { ...rest, categoryId: finalCategoryId!, allergens: JSON.stringify(allergens) };
        await tx.product.upsert({ where: { sku: rest.sku }, create: payload, update: payload });
      }
      return { created, updated };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Bulk transaction insertion batch failed' });
  }
};
