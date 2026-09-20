import { PromoCode } from '@prisma/client';

export interface PromoValidationResult {
  valid: boolean;
  reason?: string;
  discountAmount: number;
}

/**
 * Pure helper so the same rules apply both to the "preview" validation
 * endpoint and to the authoritative checkout calculation.
 */
export function evaluatePromoCode(promo: PromoCode | null, subtotal: number): PromoValidationResult {
  if (!promo) {
    return { valid: false, reason: 'Promo code not found', discountAmount: 0 };
  }
  if (!promo.isActive) {
    return { valid: false, reason: 'Promo code is no longer active', discountAmount: 0 };
  }
  const now = new Date();
  if (promo.validFrom && now < promo.validFrom) {
    return { valid: false, reason: 'Promo code is not active yet', discountAmount: 0 };
  }
  if (promo.validUntil && now > promo.validUntil) {
    return { valid: false, reason: 'Promo code has expired', discountAmount: 0 };
  }
  if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
    return { valid: false, reason: 'Promo code usage limit reached', discountAmount: 0 };
  }
  if (subtotal < promo.minOrderValue) {
    return {
      valid: false,
      reason: `Minimum order value of €${promo.minOrderValue.toFixed(2)} not met`,
      discountAmount: 0,
    };
  }

  const rawDiscount =
    promo.discountType === 'PERCENTAGE' ? subtotal * (promo.discountValue / 100) : promo.discountValue;
  const discountAmount = Math.min(rawDiscount, subtotal);

  return { valid: true, discountAmount };
}
