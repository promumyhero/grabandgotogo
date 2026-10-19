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
  gojekSubsidyPct?: number; // e.g. 25% or 30% from Maksimal PRO
  isCoFundedPromo?: boolean; // true if participating in Gojek co-funded promo
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
  channel?: WorkspaceChannel;
  gojekSubsidyPct?: number;
  isCoFundedPromo?: boolean;
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

  // GoFood Specific Fields
  mitraPromoShare?: number; // Biaya yang ditanggung mitra usaha
  gojekPromoShare?: number; // Nilai promo yang disubsidi Gojek

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
  gojekSubsidyPct?: number; // 25% default from Gojek Maksimal PRO
  isCoFundedPromo?: boolean;
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

export interface GoFoodReceiptData {
  orderNumber: string;
  orderTimestamp: string;
  menuItemName: string;
  penjualan: number; // e.g. Rp 45.950
  biayaLayananDelivery: number; // e.g. -Rp 9.300 (20%)
  biayaDitanggungMitra: number; // e.g. -Rp 3.450
  disubsidiGojekPct: number; // e.g. 25%
  totalDiskonKonsumen: number; // e.g. Rp 4.600
  subsidiGojekAmount: number; // e.g. Rp 1.150
  totalPendapatanBersih: number; // e.g. Rp 33.200
  targetOfflinePrice: number; // e.g. Rp 28.000
  variance: number; // e.g. +Rp 5.200
  category: string; // 'Gojek Plus'
}

