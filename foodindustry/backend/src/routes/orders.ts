import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { evaluatePromoCode } from '../lib/promo';
import { DELIVERY_FEE, generateUpcomingSlots } from '../lib/constants';

export const ordersRouter = Router();

ordersRouter.get('/slots', (_req: Request, res: Response) => {
  res.json({ slots: generateUpcomingSlots(), deliveryFee: DELIVERY_FEE });
});

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, 'Cart cannot be empty'),
  fulfillmentType: z.enum(['DELIVERY', 'PICKUP']),
  slotLabel: z.string().min(1),
  deliveryAddressId: z.string().optional(),
  promoCode: z.string().optional(),
  paymentMethod: z.enum(['CASH_ON_RECEIPT', 'CARD_ON_RECEIPT']),
});

ordersRouter.post('/orders', requireAuth, async (req: Request, res: Response) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { items, fulfillmentType, slotLabel, deliveryAddressId, promoCode, paymentMethod } = parsed.data;

  if (fulfillmentType === 'DELIVERY' && !deliveryAddressId) {
    return res.status(400).json({ error: 'A delivery address is required for delivery orders' });
  }

  if (deliveryAddressId) {
    const address = await prisma.address.findUnique({ where: { id: deliveryAddressId } });
    if (!address || address.userId !== req.user!.id) {
      return res.status(400).json({ error: 'Invalid delivery address' });
    }
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Re-fetch products server-side so price/stock can never be spoofed by the client.
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productById = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      const orderItemsData: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }[] = [];

      for (const item of items) {
        const product = productById.get(item.productId);
        if (!product || !product.isActive) {
          throw new HttpError(400, `Product ${item.productId} is not available`);
        }
        if (product.stockQty < item.quantity) {
          throw new HttpError(400, `Not enough stock for "${product.name}" (only ${product.stockQty} left)`);
        }
        const lineTotal = product.price * item.quantity;
        subtotal += lineTotal;
        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          lineTotal,
        });
      }

      let discountAmount = 0;
      let promo = null;
      if (promoCode) {
        promo = await tx.promoCode.findUnique({ where: { code: promoCode.toUpperCase() } });
        const result = evaluatePromoCode(promo, subtotal);
        if (!result.valid) {
          throw new HttpError(400, result.reason ?? 'Invalid promo code');
        }
        discountAmount = result.discountAmount;
      }

      const deliveryFee = fulfillmentType === 'DELIVERY' ? DELIVERY_FEE : 0;
      const total = Math.max(subtotal - discountAmount + deliveryFee, 0);

      // Decrement stock for each product.
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.quantity } },
        });
      }

      if (promo) {
        await tx.promoCode.update({ where: { id: promo.id }, data: { usageCount: { increment: 1 } } });
      }

      return tx.order.create({
        data: {
          userId: req.user!.id,
          fulfillmentType,
          slotLabel,
          deliveryAddressId: fulfillmentType === 'DELIVERY' ? deliveryAddressId : null,
          promoCodeId: promo?.id,
          paymentMethod,
          subtotal,
          discountAmount,
          deliveryFee,
          total,
          items: { create: orderItemsData },
        },
        include: { items: true, deliveryAddress: true },
      });
    });

    res.status(201).json({ order });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

ordersRouter.get('/orders', requireAuth, async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: { items: true, deliveryAddress: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ orders });
});

ordersRouter.get('/orders/:id', requireAuth, async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, deliveryAddress: true },
  });
  if (!order || (order.userId !== req.user!.id && req.user!.role !== 'ADMIN')) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ order });
});

// ---- Admin order management ----

ordersRouter.get('/admin/orders', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: { items: true, user: true, deliveryAddress: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ orders });
});

const statusSchema = z.object({
  status: z.enum(['PLACED', 'PREPARING', 'READY_OR_OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED']),
});

ordersRouter.patch('/admin/orders/:id/status', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });
    res.json({ order });
  } catch {
    res.status(404).json({ error: 'Order not found' });
  }
});

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
