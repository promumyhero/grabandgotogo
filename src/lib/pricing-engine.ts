import {
  CalculationInput,
  CalculationResult,
  DiscountType,
  GrabReceiptData,
  RoundingRule,
} from '@/types/pricing';

/**
 * Pure Mathematical Engine for Food Delivery Merchant Settlement Calculations.
 * Calibrated specifically against GrabFood real merchant settlement policies (Reference Order GF-957).
 * Uses exact integer rupiah math.
 */

export interface ForwardResult {
  discountAmount: number;
  subtotalAfterDiscount: number;
  platformFee: number;
  marketingFee: number;
  totalPlatformDeduction: number;
  netPayout: number;
  variance: number;
  isLoss: boolean;
  effectiveCommissionRatePct: number;
  effectiveMerchantMarginPct: number;
}

/**
 * Mode A: Forward Calculation
 * Given display price, calculate customer discount, platform commissions, and net merchant payout.
 */
export function calculateForward(
  displayPrice: number,
  targetOfflinePrice: number,
  merchantDiscountType: DiscountType,
  merchantDiscountValue: number,
  platformCommissionPct: number,
  marketingBoosterPct: number,
  isBoosterActive: boolean
): ForwardResult {
  const safeDisplayPrice = Math.max(0, Math.round(displayPrice || 0));
  const safeTargetPrice = Math.max(0, Math.round(targetOfflinePrice || 0));
  const safeDiscountVal = Math.max(0, merchantDiscountValue || 0);
  const safeCommPct = Math.max(0, platformCommissionPct || 0);
  const safeBoosterPct = Math.max(0, marketingBoosterPct || 0);

  // 1. Merchant Discount Amount
  let discountAmount = 0;
  if (merchantDiscountType === 'PERCENT') {
    discountAmount = Math.round(safeDisplayPrice * (safeDiscountVal / 100));
  } else {
    discountAmount = Math.min(safeDisplayPrice, Math.round(safeDiscountVal));
  }

  // 2. Subtotal After Merchant Discount
  const subtotalAfterDiscount = Math.max(0, safeDisplayPrice - discountAmount);

  // 3. Platform Service Fee (GrabFood 20% Standard)
  const platformFee = Math.round(subtotalAfterDiscount * (safeCommPct / 100));

  // 4. Marketing Success Fee (Biaya Sukses Pemasaran / PUAS 14%)
  const marketingFee = isBoosterActive
    ? Math.floor(subtotalAfterDiscount * (safeBoosterPct / 100))
    : 0;

  // 5. Total Platform Deduction
  const totalPlatformDeduction = platformFee + marketingFee;

  // 6. Net Merchant Payout
  const netPayout = subtotalAfterDiscount - totalPlatformDeduction;

  // 7. Variance vs Target Offline
  const variance = netPayout - safeTargetPrice;
  const isLoss = variance < 0;

  // 8. Effective Rates
  const effectiveCommissionRatePct =
    subtotalAfterDiscount > 0
      ? (totalPlatformDeduction / subtotalAfterDiscount) * 100
      : 0;

  const effectiveMerchantMarginPct =
    safeDisplayPrice > 0 ? (netPayout / safeDisplayPrice) * 100 : 0;

  return {
    discountAmount,
    subtotalAfterDiscount,
    platformFee,
    marketingFee,
    totalPlatformDeduction,
    netPayout,
    variance,
    isLoss,
    effectiveCommissionRatePct: Number(effectiveCommissionRatePct.toFixed(2)),
    effectiveMerchantMarginPct: Number(effectiveMerchantMarginPct.toFixed(2)),
  };
}

/**
 * Apply rounding rule to a price integer.
 */
export function applyRounding(price: number, rule: RoundingRule): number {
  const safePrice = Math.max(0, Math.round(price));
  switch (rule) {
    case 'CEIL_100':
      return Math.ceil(safePrice / 100) * 100;
    case 'CEIL_500':
      return Math.ceil(safePrice / 500) * 500;
    case 'CEIL_1000':
      return Math.ceil(safePrice / 1000) * 1000;
    case 'EXACT':
    default:
      return safePrice;
  }
}

/**
 * Mode B: Reverse / Ideal Price Recommender
 * Calculates the exact minimum displayPrice such that netPayout >= targetOfflinePrice.
 * Implements initial approximation followed by Step-Up Verification Loop.
 */
export function calculateRecommendedPrice(
  targetOfflinePrice: number,
  merchantDiscountType: DiscountType,
  merchantDiscountValue: number,
  platformCommissionPct: number,
  marketingBoosterPct: number,
  isBoosterActive: boolean,
  roundingRule: RoundingRule = 'CEIL_500'
): {
  exactRecommendedPrice: number;
  roundedRecommendedPrice: number;
  recommendedNetPayout: number;
  recommendedVariance: number;
} {
  const safeTarget = Math.max(0, Math.round(targetOfflinePrice || 0));
  if (safeTarget === 0) {
    return {
      exactRecommendedPrice: 0,
      roundedRecommendedPrice: 0,
      recommendedNetPayout: 0,
      recommendedVariance: 0,
    };
  }

  const safeCommPct = Math.max(0, platformCommissionPct || 0);
  const safeBoosterPct = isBoosterActive ? Math.max(0, marketingBoosterPct || 0) : 0;
  const totalGrabCutRate = (safeCommPct + safeBoosterPct) / 100;

  // Prevent divide-by-zero or 100% platform take
  const clampedGrabRate = Math.min(0.95, totalGrabCutRate);
  const requiredSubtotal = Math.ceil(safeTarget / (1 - clampedGrabRate));

  let rawPrice = 0;
  if (merchantDiscountType === 'PERCENT') {
    const discFraction = Math.min(0.95, (merchantDiscountValue || 0) / 100);
    rawPrice = Math.ceil(requiredSubtotal / (1 - discFraction));
  } else {
    rawPrice = requiredSubtotal + Math.round(merchantDiscountValue || 0);
  }

  // Exact step-up verification loop:
  // First, if our raw estimate is slightly too high, step down to find the true lowest boundary
  while (rawPrice > 0) {
    const testDown = calculateForward(
      rawPrice - 1,
      safeTarget,
      merchantDiscountType,
      merchantDiscountValue,
      platformCommissionPct,
      marketingBoosterPct,
      isBoosterActive
    );
    if (testDown.netPayout >= safeTarget) {
      rawPrice -= 1;
    } else {
      break;
    }
  }

  // Next, if rawPrice falls short of safeTarget, step up by 1 rupiah until netPayout >= targetOfflinePrice
  let testForward = calculateForward(
    rawPrice,
    safeTarget,
    merchantDiscountType,
    merchantDiscountValue,
    platformCommissionPct,
    marketingBoosterPct,
    isBoosterActive
  );

  let loopGuard = 0;
  while (testForward.netPayout < safeTarget && loopGuard < 100000) {
    rawPrice += 1;
    testForward = calculateForward(
      rawPrice,
      safeTarget,
      merchantDiscountType,
      merchantDiscountValue,
      platformCommissionPct,
      marketingBoosterPct,
      isBoosterActive
    );
    loopGuard++;
  }

  const exactRecommendedPrice = rawPrice;
  const roundedRecommendedPrice = applyRounding(exactRecommendedPrice, roundingRule);

  const roundedForward = calculateForward(
    roundedRecommendedPrice,
    safeTarget,
    merchantDiscountType,
    merchantDiscountValue,
    platformCommissionPct,
    marketingBoosterPct,
    isBoosterActive
  );

  return {
    exactRecommendedPrice,
    roundedRecommendedPrice,
    recommendedNetPayout: roundedForward.netPayout,
    recommendedVariance: roundedForward.variance,
  };
}

/**
 * Combined pricing calculation helper for a single menu item.
 */
export function calculateMenuItem(input: CalculationInput): CalculationResult {
  const {
    targetOfflinePrice,
    displayPrice,
    merchantDiscountType,
    merchantDiscountValue,
    platformCommissionPct,
    marketingBoosterPct,
    isBoosterActive,
    roundingRule = 'CEIL_500',
  } = input;

  const forward = calculateForward(
    displayPrice,
    targetOfflinePrice,
    merchantDiscountType,
    merchantDiscountValue,
    platformCommissionPct,
    marketingBoosterPct,
    isBoosterActive
  );

  const reverse = calculateRecommendedPrice(
    targetOfflinePrice,
    merchantDiscountType,
    merchantDiscountValue,
    platformCommissionPct,
    marketingBoosterPct,
    isBoosterActive,
    roundingRule
  );

  return {
    discountAmount: forward.discountAmount,
    subtotalAfterDiscount: forward.subtotalAfterDiscount,
    platformFee: forward.platformFee,
    marketingFee: forward.marketingFee,
    totalPlatformDeduction: forward.totalPlatformDeduction,
    netPayout: forward.netPayout,
    variance: forward.variance,
    isLoss: forward.isLoss,
    effectiveCommissionRatePct: forward.effectiveCommissionRatePct,
    effectiveMerchantMarginPct: forward.effectiveMerchantMarginPct,
    recommendedDisplayPriceExact: reverse.exactRecommendedPrice,
    recommendedDisplayPriceRounded: reverse.roundedRecommendedPrice,
    recommendedNetPayout: reverse.recommendedNetPayout,
    recommendedVariance: reverse.recommendedVariance,
    roundingRuleApplied: roundingRule,
  };
}

/**
 * Formats a number to Indonesian Rupiah representation: Rp 29.753 or -Rp 247
 */
export function formatRupiah(amount: number, showSign: boolean = false): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
    .format(abs)
    .replace('IDR', 'Rp')
    .trim();

  if (isNegative) {
    return `-Rp ${formatted.replace('Rp', '').trim()}`;
  }
  if (showSign && amount > 0) {
    return `+Rp ${formatted.replace('Rp', '').trim()}`;
  }
  return formatted;
}

/**
 * Generate exact Mobile Receipt simulation (GF-957 compliant breakdown)
 */
export function generateGrabReceipt(
  menuItemName: string,
  targetOfflinePrice: number,
  displayPrice: number,
  merchantDiscountType: DiscountType,
  merchantDiscountValue: number,
  platformCommissionPct: number = 20,
  marketingBoosterPct: number = 14,
  isBoosterActive: boolean = true,
  orderNumber: string = 'GF-957'
): GrabReceiptData {
  const result = calculateForward(
    displayPrice,
    targetOfflinePrice,
    merchantDiscountType,
    merchantDiscountValue,
    platformCommissionPct,
    marketingBoosterPct,
    isBoosterActive
  );

  return {
    orderNumber,
    orderTimestamp: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    menuItemName,
    displayPrice,
    discountType: merchantDiscountType,
    discountValue: merchantDiscountValue,
    discountAmount: result.discountAmount,
    customerPaidSubtotal: result.subtotalAfterDiscount,
    platformCommissionPct,
    platformCommissionFee: result.platformFee,
    marketingBoosterPct,
    isBoosterActive,
    marketingBoosterFee: result.marketingFee,
    totalPlatformDeduction: result.totalPlatformDeduction,
    netPayoutToMerchant: result.netPayout,
    targetOfflinePrice,
    variance: result.variance,
  };
}
