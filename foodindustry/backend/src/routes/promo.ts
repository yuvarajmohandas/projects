import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { evaluatePromoCode } from '../lib/promo';

export const promoRouter = Router();

const validateSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative(),
});

promoRouter.post('/promo/validate', async (req: Request, res: Response) => {
  const parsed = validateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const promo = await prisma.promoCode.findUnique({ where: { code: parsed.data.code.toUpperCase() } });
  const result = evaluatePromoCode(promo, parsed.data.subtotal);
  res.json(result);
});

const promoSchema = z.object({
  code: z.string().min(1).transform((s) => s.toUpperCase()),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  minOrderValue: z.number().nonnegative().default(0),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

promoRouter.get('/admin/promo-codes', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const promoCodes = await prisma.promoCode.findMany({ orderBy: { code: 'asc' } });
  res.json({ promoCodes });
});

promoRouter.post('/admin/promo-codes', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = promoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { validFrom, validUntil, ...rest } = parsed.data;
  try {
    const promoCode = await prisma.promoCode.create({
      data: {
        ...rest,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });
    res.status(201).json({ promoCode });
  } catch {
    res.status(409).json({ error: 'A promo code with this code already exists' });
  }
});

promoRouter.put('/admin/promo-codes/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = promoSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { validFrom, validUntil, ...rest } = parsed.data;
  try {
    const promoCode = await prisma.promoCode.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(validFrom !== undefined ? { validFrom: validFrom ? new Date(validFrom) : null } : {}),
        ...(validUntil !== undefined ? { validUntil: validUntil ? new Date(validUntil) : null } : {}),
      },
    });
    res.json({ promoCode });
  } catch {
    res.status(404).json({ error: 'Promo code not found' });
  }
});

promoRouter.delete('/admin/promo-codes/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.promoCode.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Promo code not found' });
  }
});
