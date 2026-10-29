import {
  CalculationInput,
  CalculationResult,
  DiscountType,
  GoFoodReceiptData,
  GrabReceiptData,
  RoundingRule,
  WorkspaceChannel,
} from '@/types/pricing';

/**
 * Pure Mathematical Engine for Food Delivery Merchant Settlement Calculations.
 * Calibrated specifically against:
 * 1. GrabFood real merchant settlement policies (Reference Order GF-957).
 * 2. GoFood / GoBiz real settlement & Maksimal PRO promo co-funding
 *    (Reference Orders F-3388856614 and F-3392285639).
 * Uses exact integer rupiah math.
 */

/**
 * GoFood fixed per-order component inside "Biaya layanan GoFood Delivery".
 * Derived from two real GoBiz receipts:
 *   F-3388856614: 20% x (45.950 - 3.450)  + 800 = 9.300
 *   F-3392285639: 20% x (47.850 - 15.120) + 800 = 7.346
 */
export const GOFOOD_FIXED_FEE = 800;

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
  mitraPromoShare?: number;
  gojekPromoShare?: number;
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
  isBoosterActive: boolean,
  channel: WorkspaceChannel = 'GRABFOOD',
  gojekSubsidyPct: number = 25,
  isCoFundedPromo: boolean = true
): ForwardResult {
  const safeDisplayPrice = Math.max(0, Math.round(displayPrice || 0));
  const safeTargetPrice = Math.max(0, Math.round(targetOfflinePrice || 0));
  const safeDiscountVal = Math.max(0, merchantDiscountValue || 0);
  const safeCommPct = Math.max(0, platformCommissionPct || 0);
  const safeBoosterPct = Math.max(0, marketingBoosterPct || 0);
  const safeSubsidyPct = Math.min(100, Math.max(0, gojekSubsidyPct ?? 25));

  if (channel === 'GOFOOD') {
    // ==========================================
    // GOFOOD / GOBIZ REAL SETTLEMENT MATH
    // Verified against F-3388856614 (Rp 33.200) and F-3392285639 (Rp 25.384)
    // ==========================================
    // 1. Customer Promo Discount (Gross discount received by customer)
    let grossPromoDiscount = 0;
    if (merchantDiscountType === 'PERCENT') {
      grossPromoDiscount = Math.round(safeDisplayPrice * (safeDiscountVal / 100));
    } else {
      grossPromoDiscount = Math.min(safeDisplayPrice, Math.round(safeDiscountVal));
    }

    // 2. Co-Funded Campaign Promo Burden (Maksimal PRO / Gojek Plus)
    // Gojek subsidizes e.g. 25% or 30%, Mitra Usaha bears remaining 75% or 70%
    const mitraPromoShare = isCoFundedPromo
      ? Math.round(grossPromoDiscount * (1 - safeSubsidyPct / 100))
      : grossPromoDiscount;
    const gojekPromoShare = grossPromoDiscount - mitraPromoShare;

    // 3. Biaya Layanan GoFood Delivery
    // = Commission % x (Penjualan - Promo ditanggung mitra) + fixed Rp 800 per order
    const commissionBase = Math.max(0, safeDisplayPrice - mitraPromoShare);
    const platformFee =
      safeDisplayPrice > 0
        ? Math.round(commissionBase * (safeCommPct / 100)) + GOFOOD_FIXED_FEE
        : 0;
    const marketingFee = 0; // GoFood does not have Grab's PUAS marketing booster

    // 4. Total Platform & Promo Deductions on GoFood Struk
    const totalPlatformDeduction = platformFee + mitraPromoShare;

    // 5. Total Pendapatan Bersih (Net Merchant Settlement Payout)
    const netPayout = safeDisplayPrice - totalPlatformDeduction;

    // 6. Subtotal Belanja Konsumen
    const subtotalAfterDiscount = Math.max(0, safeDisplayPrice - grossPromoDiscount);

    // 7. Variance vs Target Offline
    const variance = netPayout - safeTargetPrice;
    const isLoss = variance < 0;

    // 8. Effective Rates
    const effectiveCommissionRatePct =
      safeDisplayPrice > 0 ? (totalPlatformDeduction / safeDisplayPrice) * 100 : 0;
    const effectiveMerchantMarginPct =
      safeDisplayPrice > 0 ? (netPayout / safeDisplayPrice) * 100 : 0;

    return {
      discountAmount: grossPromoDiscount,
      subtotalAfterDiscount,
      platformFee,
      marketingFee,
      totalPlatformDeduction,
      netPayout,
      variance,
      isLoss,
      effectiveCommissionRatePct: Number(effectiveCommissionRatePct.toFixed(2)),
      effectiveMerchantMarginPct: Number(effectiveMerchantMarginPct.toFixed(2)),
      mitraPromoShare,
      gojekPromoShare,
    };
  }

  // ==========================================
  // GRABFOOD REAL SETTLEMENT MATH (GF-957)
  // ==========================================
  // 1. Merchant Discount Amount
  let discountAmount = 0;
  if (merchantDiscountType === 'PERCENT') {
    discountAmount = Math.round(safeDisplayPrice * (safeDiscountVal / 100));
  } else {
    discountAmount = Math.min(safeDisplayPrice, Math.round(safeDiscountVal));
  }

  // 2. Subtotal After Merchant Discount
  const subtotalAfterDiscount = Math.max(0, safeDisplayPrice - discountAmount);

  // 3. Platform Service Fee (GrabFood 20% Standard on subtotal)
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
  roundingRule: RoundingRule = 'CEIL_500',
  channel: WorkspaceChannel = 'GRABFOOD',
  gojekSubsidyPct: number = 25,
  isCoFundedPromo: boolean = true
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
  const safeSubsidyPct = Math.min(100, Math.max(0, gojekSubsidyPct ?? 25));

  let rawPrice = 0;
  let isMathematicallyReachable = true;

  if (channel === 'GOFOOD') {
    // GoFood Reverse Formula
    // netPayout = (1 - komisi) x (displayPrice - mitraPromoShare) - GOFOOD_FIXED_FEE >= safeTarget
    if (safeCommPct >= 100) {
      isMathematicallyReachable = false;
    }
    const keepFactor = 1 - Math.min(0.95, safeCommPct / 100);
    const requiredBase = (safeTarget + GOFOOD_FIXED_FEE) / keepFactor;

    if (merchantDiscountType === 'PERCENT') {
      const discFraction = (merchantDiscountValue || 0) / 100;
      const rawMitraPromoFraction = isCoFundedPromo
        ? discFraction * (1 - safeSubsidyPct / 100)
        : discFraction;
      if (rawMitraPromoFraction >= 1) {
        isMathematicallyReachable = false;
      }
      const mitraPromoFraction = Math.min(0.95, rawMitraPromoFraction);
      rawPrice = Math.ceil(requiredBase / (1 - mitraPromoFraction));
    } else {
      const nominalMitra = isCoFundedPromo
        ? Math.round((merchantDiscountValue || 0) * (1 - safeSubsidyPct / 100))
        : Math.round(merchantDiscountValue || 0);
      rawPrice = Math.ceil(requiredBase + nominalMitra);
    }
  } else {
    // GrabFood Reverse Formula
    const totalGrabCutRate = (safeCommPct + safeBoosterPct) / 100;
    if (totalGrabCutRate >= 1) {
      isMathematicallyReachable = false;
    }
    const clampedGrabRate = Math.min(0.95, totalGrabCutRate);
    const requiredSubtotal = Math.ceil(safeTarget / (1 - clampedGrabRate));

    if (merchantDiscountType === 'PERCENT') {
      const rawDiscFraction = (merchantDiscountValue || 0) / 100;
      if (rawDiscFraction >= 1) {
        isMathematicallyReachable = false;
      }
      const discFraction = Math.min(0.95, rawDiscFraction);
      rawPrice = Math.ceil(requiredSubtotal / (1 - discFraction));
    } else {
      rawPrice = requiredSubtotal + Math.round(merchantDiscountValue || 0);
    }
  }

  // Exact step-up / step-down verification loop (only if mathematically reachable):
  if (isMathematicallyReachable) {
    // Step down to find the true lowest boundary
    let downGuard = 0;
    while (rawPrice > 0 && downGuard < 100) {
      const testDown = calculateForward(
        rawPrice - 1,
        safeTarget,
        merchantDiscountType,
        merchantDiscountValue,
        platformCommissionPct,
        marketingBoosterPct,
        isBoosterActive,
        channel,
        safeSubsidyPct,
        isCoFundedPromo
      );
      if (testDown.netPayout >= safeTarget) {
        rawPrice -= 1;
        downGuard++;
      } else {
        break;
      }
    }

    // Step up by 1 rupiah if test falls short of safeTarget
    let testForward = calculateForward(
      rawPrice,
      safeTarget,
      merchantDiscountType,
      merchantDiscountValue,
      platformCommissionPct,
      marketingBoosterPct,
      isBoosterActive,
      channel,
      safeSubsidyPct,
      isCoFundedPromo
    );

    let loopGuard = 0;
    while (testForward.netPayout < safeTarget && loopGuard < 100) {
      rawPrice += 1;
      testForward = calculateForward(
        rawPrice,
        safeTarget,
        merchantDiscountType,
        merchantDiscountValue,
        platformCommissionPct,
        marketingBoosterPct,
        isBoosterActive,
        channel,
        safeSubsidyPct,
        isCoFundedPromo
      );
      loopGuard++;
    }
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
    isBoosterActive,
    channel,
    safeSubsidyPct,
    isCoFundedPromo
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
    channel = 'GRABFOOD',
    gojekSubsidyPct = 25,
    isCoFundedPromo = true,
  } = input;

  const forward = calculateForward(
    displayPrice,
    targetOfflinePrice,
    merchantDiscountType,
    merchantDiscountValue,
    platformCommissionPct,
    marketingBoosterPct,
    isBoosterActive,
    channel,
    gojekSubsidyPct,
    isCoFundedPromo
  );

  const reverse = calculateRecommendedPrice(
    targetOfflinePrice,
    merchantDiscountType,
    merchantDiscountValue,
    platformCommissionPct,
    marketingBoosterPct,
    isBoosterActive,
    roundingRule,
    channel,
    gojekSubsidyPct,
    isCoFundedPromo
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
    mitraPromoShare: forward.mitraPromoShare,
    gojekPromoShare: forward.gojekPromoShare,
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
    isBoosterActive,
    'GRABFOOD'
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

/**
 * Generate exact GoFood / GoBiz Mobile Receipt simulation (F-3388856614 compliant breakdown)
 */
export function generateGoFoodReceipt(
  menuItemName: string,
  targetOfflinePrice: number,
  displayPrice: number,
  merchantDiscountType: DiscountType,
  merchantDiscountValue: number,
  platformCommissionPct: number = 20,
  gojekSubsidyPct: number = 25,
  isCoFundedPromo: boolean = true,
  orderNumber: string = 'F-3388856614'
): GoFoodReceiptData {
  const result = calculateForward(
    displayPrice,
    targetOfflinePrice,
    merchantDiscountType,
    merchantDiscountValue,
    platformCommissionPct,
    0,
    false,
    'GOFOOD',
    gojekSubsidyPct,
    isCoFundedPromo
  );

  return {
    orderNumber,
    orderTimestamp: '12:27, 12 Okt',
    menuItemName,
    penjualan: displayPrice,
    biayaLayananDelivery: result.platformFee,
    biayaDitanggungMitra: result.mitraPromoShare ?? 0,
    disubsidiGojekPct: gojekSubsidyPct,
    totalDiskonKonsumen: result.discountAmount,
    subsidiGojekAmount: result.gojekPromoShare ?? 0,
    totalPendapatanBersih: result.netPayout,
    targetOfflinePrice,
    variance: result.variance,
    category: 'Gojek Plus',
  };
}
