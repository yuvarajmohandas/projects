import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

export const addressesRouter = Router();

const addressSchema = z.object({
  label: z.string().min(1),
  street: z.string().min(1),
  houseNumber: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  country: z.string().default('Belgium'),
  isDefault: z.boolean().default(false),
});

addressesRouter.get('/addresses', requireAuth, async (req: Request, res: Response) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: { isDefault: 'desc' },
  });
  res.json({ addresses });
});

addressesRouter.post('/addresses', requireAuth, async (req: Request, res: Response) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
  }
  const address = await prisma.address.create({ data: { ...parsed.data, userId: req.user!.id } });
  res.status(201).json({ address });
});

addressesRouter.delete('/addresses/:id', requireAuth, async (req: Request, res: Response) => {
  const address = await prisma.address.findUnique({ where: { id: req.params.id } });
  if (!address || address.userId !== req.user!.id) {
    return res.status(404).json({ error: 'Address not found' });
  }
  await prisma.address.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
