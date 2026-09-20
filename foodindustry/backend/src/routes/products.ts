import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';

export const productsRouter = Router();

function serializeProduct<T extends { allergens: string }>(product: T) {
  return { ...product, allergens: JSON.parse(product.allergens) as string[] };
}

function isPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

// ---- Public catalog browsing ----

productsRouter.get('/categories', async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json({ categories });
});

productsRouter.get('/products', async (req: Request, res: Response) => {
  const { category, search } = req.query as { category?: string; search?: string };
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { categoryId: category } : {}),
      ...(search
        ? { name: { contains: search } }
        : {}),
    },
    include: { category: true },
    orderBy: { name: 'asc' },
  });
  res.json({
    products: products.map(serializeProduct),
  });
});

productsRouter.get('/products/:id', async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!product || !product.isActive) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ product: serializeProduct(product) });
});

// ---- Admin category, product & stock management ----

const categorySchema = z.object({
  name: z.string().trim().min(1),
  sortOrder: z.number().int().default(0),
});

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().min(1).default('pcs'),
  price: z.number().nonnegative(),
  vatRate: z.number().min(0).max(1).default(0.06),
  allergens: z.array(z.string()).default([]),
  imageEmoji: z.string().default('🛒'),
  stockQty: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  categoryId: z.string().min(1),
});

productsRouter.get('/admin/categories', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  res.json({
    categories: categories.map(({ _count, ...category }) => ({
      ...category,
      productCount: _count.products,
    })),
  });
});

productsRouter.post('/admin/categories', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const category = await prisma.category.create({ data: parsed.data });
    res.status(201).json({ category: { ...category, productCount: 0 } });
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }
    throw error;
  }
});

productsRouter.put('/admin/categories/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: { _count: { select: { products: true } } },
    });
    const { _count, ...rest } = category;
    res.json({ category: { ...rest, productCount: _count.products } });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      return res.status(404).json({ error: 'Category not found' });
    }
    if (isPrismaError(error, 'P2002')) {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }
    throw error;
  }
});

productsRouter.delete('/admin/categories/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const productCount = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (productCount > 0) {
    return res.status(409).json({
      error: 'Move or deactivate products in this category before deleting it',
    });
  }
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      return res.status(404).json({ error: 'Category not found' });
    }
    throw error;
  }
});

productsRouter.post('/admin/products', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { allergens, ...rest } = parsed.data;
  try {
    const product = await prisma.product.create({
      data: { ...rest, allergens: JSON.stringify(allergens) },
      include: { category: true },
    });
    res.status(201).json({ product: serializeProduct(product) });
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      return res.status(409).json({ error: 'A product with this SKU already exists' });
    }
    if (isPrismaError(error, 'P2003')) {
      return res.status(400).json({ error: 'Selected category does not exist' });
    }
    throw error;
  }
});

productsRouter.put('/admin/products/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { allergens, ...rest } = parsed.data;
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { ...rest, ...(allergens ? { allergens: JSON.stringify(allergens) } : {}) },
      include: { category: true },
    });
    res.json({ product: serializeProduct(product) });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (isPrismaError(error, 'P2002')) {
      return res.status(409).json({ error: 'A product with this SKU already exists' });
    }
    if (isPrismaError(error, 'P2003')) {
      return res.status(400).json({ error: 'Selected category does not exist' });
    }
    throw error;
  }
});

const importProductSchema = productSchema
  .omit({ categoryId: true })
  .extend({
    categoryId: z.string().min(1).optional(),
    categoryName: z.string().trim().min(1).optional(),
  })
  .refine((product) => product.categoryId || product.categoryName, {
    message: 'categoryId or categoryName is required',
    path: ['categoryName'],
  });

const importSchema = z.object({
  products: z.array(importProductSchema).min(1).max(500),
});

productsRouter.post('/admin/products/import', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let created = 0;
      let updated = 0;
      let categoriesCreated = 0;
      const products = [];

      for (const importedProduct of parsed.data.products) {
        const { allergens, categoryId, categoryName, ...rest } = importedProduct;
        let resolvedCategoryId = categoryId;

        if (!resolvedCategoryId && categoryName) {
          const existingCategory = await tx.category.findUnique({ where: { name: categoryName } });
          if (existingCategory) {
            resolvedCategoryId = existingCategory.id;
          } else {
            const category = await tx.category.create({ data: { name: categoryName } });
            resolvedCategoryId = category.id;
            categoriesCreated += 1;
          }
        }

        if (!resolvedCategoryId) {
          throw new Error('categoryId or categoryName is required');
        }

        const existingProduct = await tx.product.findUnique({ where: { sku: rest.sku } });
        const product = existingProduct
          ? await tx.product.update({
              where: { sku: rest.sku },
              data: { ...rest, categoryId: resolvedCategoryId, allergens: JSON.stringify(allergens) },
              include: { category: true },
            })
          : await tx.product.create({
              data: { ...rest, categoryId: resolvedCategoryId, allergens: JSON.stringify(allergens) },
              include: { category: true },
            });

        if (existingProduct) updated += 1;
        else created += 1;
        products.push(serializeProduct(product));
      }

      return { created, updated, categoriesCreated, products };
    });

    res.status(201).json(result);
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      return res.status(409).json({ error: 'Import contains duplicate values that conflict with existing data' });
    }
    if (isPrismaError(error, 'P2003')) {
      return res.status(400).json({ error: 'One or more selected categories do not exist' });
    }
    throw error;
  }
});

const stockSchema = z.object({
  stockQty: z.number().int().nonnegative(),
});

productsRouter.patch(
  '/admin/products/:id/stock',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const parsed = stockSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: { stockQty: parsed.data.stockQty },
        include: { category: true },
      });
      res.json({ product: serializeProduct(product) });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        return res.status(404).json({ error: 'Product not found' });
      }
      throw error;
    }
  }
);

productsRouter.delete('/admin/products/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Soft delete: deactivate rather than hard-remove, so past orders keep valid references.
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
      include: { category: true },
    });
    res.json({ product: serializeProduct(product) });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      return res.status(404).json({ error: 'Product not found' });
    }
    throw error;
  }
});

productsRouter.get('/admin/products', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { name: 'asc' },
  });
  res.json({ products: products.map(serializeProduct) });
});
