import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(1),
  sortOrder: z.number().int().default(0),
});

// 💥 UPGRADED FOR CAROUSELS: Validation parameters support array images properties
export const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  unit: z.string().min(1).default('pcs'),
  price: z.number().nonnegative(),
  oldPrice: z.number().nonnegative().optional().nullable(),
  imageUrl: z.string().url().or(z.string().max(0)).optional().nullable(),
  vatRate: z.number().min(0).max(1).default(0.06),
  allergens: z.array(z.string()).default([]),
  imageEmoji: z.string().default('🛒'),
  stockQty: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  categoryId: z.string().min(1),
});

// 💥 UPGRADED FOR CAROUSELS: Schema to parse complex homepage components structure payloads
// Add these exports into src/schemas/product.ts if they aren't there yet:
// Open backend/src/schemas/product.ts and append rotationInterval to your schema:
const homepageSectionContentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
  rotationInterval: z.string().optional().nullable(),
  // 🌟 ADD THIS SPECIFIC PROPERTY LINE RIGHT HERE:
  textAlignment: z.string().optional().nullable(), 
  images: z.array(z.object({
    imageUrl: z.string(),
    link: z.string().optional().nullable(),
    fit: z.enum(['CONTAIN', 'COVER']).optional().default('COVER') 
  })).optional(),
});


export const homepageSectionSchema = z.object({
  id: z.string(),
  type: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean().default(true),
  content: homepageSectionContentSchema,
});

export const homepageLayoutSchema = z.object({
  header: z.object({
    order: z.array(z.string()),
    alignment: z.enum(['left', 'center', 'right']),
  }),
  sections: z.array(homepageSectionSchema),
});

export const importProductSchema = productSchema
  .omit({ categoryId: true })
  .extend({
    categoryId: z.string().min(1).optional(),
    categoryName: z.string().trim().min(1).optional(),
  })
  .refine((product) => product.categoryId || product.categoryName, {
    message: 'categoryId or categoryName is required',
    path: ['categoryName'],
  });

export const importSchema = z.object({
  products: z.array(importProductSchema).min(1).max(500),
});
