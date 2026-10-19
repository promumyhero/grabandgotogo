export type WorkspaceChannel = 'GRABFOOD' | 'GOFOOD';

export type DiscountType = 'PERCENT' | 'NOMINAL';

export type RoundingRule = 'EXACT' | 'CEIL_100' | 'CEIL_500' | 'CEIL_1000';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  channel: WorkspaceChannel;
  targetOfflinePrice: number;
  displayPrice: number;
  merchantDiscountType: DiscountType;
  merchantDiscountValue: number;
  platformCommissionPct: number;
  marketingBoosterPct: number;
  isBoosterActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalculationInput {
  targetOfflinePrice: number;
  displayPrice: number;
  merchantDiscountType: DiscountType;
  merchantDiscountValue: number;
  platformCommissionPct: number;
  marketingBoosterPct: number;
  isBoosterActive: boolean;
  roundingRule?: RoundingRule;
}

export interface CalculationResult {
  // Mode A Forward Outputs
  discountAmount: number;
  subtotalAfterDiscount: number;
  platformFee: number;
  marketingFee: number;
  totalPlatformDeduction: number;
  netPayout: number;
  variance: number; // netPayout - targetOfflinePrice
  isLoss: boolean; // variance < 0
  effectiveCommissionRatePct: number; // totalGrabCut / subtotalAfterDiscount * 100
  effectiveMerchantMarginPct: number; // netPayout / displayPrice * 100

  // Mode B Reverse Outputs
  recommendedDisplayPriceExact: number;
  recommendedDisplayPriceRounded: number;
  recommendedNetPayout: number;
  recommendedVariance: number;
  roundingRuleApplied: RoundingRule;
}

export interface GlobalPresets {
  platformCommissionPct: number;
  marketingBoosterPct: number;
  merchantDiscountValue: number;
  merchantDiscountType: DiscountType;
  roundingRule: RoundingRule;
  isBoosterActiveDefault: boolean;
}

export interface ReceiptLineItem {
  label: string;
  amount: number;
  isNegative?: boolean;
  isHighlight?: boolean;
  annotation?: string;
}

export interface GrabReceiptData {
  orderNumber: string;
  orderTimestamp: string;
  menuItemName: string;
  displayPrice: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  customerPaidSubtotal: number;
  platformCommissionPct: number;
  platformCommissionFee: number;
  marketingBoosterPct: number;
  isBoosterActive: boolean;
  marketingBoosterFee: number;
  totalPlatformDeduction: number;
  netPayoutToMerchant: number;
  targetOfflinePrice: number;
  variance: number;
}
