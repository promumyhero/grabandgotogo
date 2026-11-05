export type WorkspaceChannel = 'GRABFOOD' | 'GOFOOD';

export type DiscountType = 'PERCENT' | 'NOMINAL';

export type RoundingRule = 'EXACT' | 'CEIL_100' | 'CEIL_500' | 'CEIL_1000';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
}

export interface DiscountTemplate {
  id: string;
  name: string;
  channel: WorkspaceChannel;
  platformCommissionPct: number;
  marketingBoosterPct: number;
  isBoosterActiveDefault: boolean;
  merchantDiscountType: DiscountType;
  merchantDiscountValue: number;
  gojekSubsidyPct?: number;
  isCoFundedPromo?: boolean;
  roundingRule: RoundingRule;
  isBuiltIn?: boolean;
}

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
