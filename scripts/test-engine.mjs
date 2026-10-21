// Test validation script for Pricing Engine

function calculateForward(
  displayPrice,
  targetOfflinePrice,
  merchantDiscountType,
  merchantDiscountValue,
  platformCommissionPct,
  marketingBoosterPct,
  isBoosterActive
) {
  const safeDisplayPrice = Math.max(0, Math.round(displayPrice || 0));
  const safeTargetPrice = Math.max(0, Math.round(targetOfflinePrice || 0));
  const safeDiscountVal = Math.max(0, merchantDiscountValue || 0);
  const safeCommPct = Math.max(0, platformCommissionPct || 0);
  const safeBoosterPct = Math.max(0, marketingBoosterPct || 0);

  let discountAmount = 0;
  if (merchantDiscountType === 'PERCENT') {
    discountAmount = Math.round(safeDisplayPrice * (safeDiscountVal / 100));
  } else {
    discountAmount = Math.min(safeDisplayPrice, Math.round(safeDiscountVal));
  }

  const subtotalAfterDiscount = Math.max(0, safeDisplayPrice - discountAmount);
  const platformFee = Math.round(subtotalAfterDiscount * (safeCommPct / 100));
  const marketingFee = isBoosterActive
    ? Math.floor(subtotalAfterDiscount * (safeBoosterPct / 100))
    : 0;
  const totalPlatformDeduction = platformFee + marketingFee;
  const netPayout = subtotalAfterDiscount - totalPlatformDeduction;
  const variance = netPayout - safeTargetPrice;

  return {
    discountAmount,
    subtotalAfterDiscount,
    platformFee,
    marketingFee,
    totalPlatformDeduction,
    netPayout,
    variance,
  };
}

function calculateRecommendedPrice(
  targetOfflinePrice,
  merchantDiscountType,
  merchantDiscountValue,
  platformCommissionPct,
  marketingBoosterPct,
  isBoosterActive,
  roundingRule = 'CEIL_500'
) {
  const safeTarget = Math.max(0, Math.round(targetOfflinePrice || 0));
  const safeCommPct = Math.max(0, platformCommissionPct || 0);
  const safeBoosterPct = isBoosterActive ? Math.max(0, marketingBoosterPct || 0) : 0;
  const totalGrabCutRate = (safeCommPct + safeBoosterPct) / 100;
  const clampedGrabRate = Math.min(0.95, totalGrabCutRate);
  const requiredSubtotal = Math.ceil(safeTarget / (1 - clampedGrabRate));

  let rawPrice = 0;
  if (merchantDiscountType === 'PERCENT') {
    const discFraction = Math.min(0.95, (merchantDiscountValue || 0) / 100);
    rawPrice = Math.ceil(requiredSubtotal / (1 - discFraction));
  } else {
    rawPrice = requiredSubtotal + Math.round(merchantDiscountValue || 0);
  }

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

  let testForward = calculateForward(
    rawPrice,
    safeTarget,
    merchantDiscountType,
    merchantDiscountValue,
    platformCommissionPct,
    marketingBoosterPct,
    isBoosterActive
  );

  while (testForward.netPayout < safeTarget) {
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
  }

  let roundedPrice = rawPrice;
  if (roundingRule === 'CEIL_100') roundedPrice = Math.ceil(rawPrice / 100) * 100;
  if (roundingRule === 'CEIL_500') roundedPrice = Math.ceil(rawPrice / 500) * 500;
  if (roundingRule === 'CEIL_1000') roundedPrice = Math.ceil(rawPrice / 1000) * 1000;

  return {
    exactRecommendedPrice: rawPrice,
    roundedRecommendedPrice: roundedPrice,
    recommendedNetPayout: calculateForward(roundedPrice, safeTarget, merchantDiscountType, merchantDiscountValue, platformCommissionPct, marketingBoosterPct, isBoosterActive).netPayout,
  };
}

console.log('--- TEST 1: Benchmark GF-957 ---');
const gf957 = calculateForward(64400, 30000, 'PERCENT', 30, 20, 14, true);
console.log('Result:', gf957);

const assertions = [
  ['discountAmount', gf957.discountAmount, 19320],
  ['subtotalAfterDiscount', gf957.subtotalAfterDiscount, 45080],
  ['platformFee', gf957.platformFee, 9016],
  ['marketingFee', gf957.marketingFee, 6311],
  ['netPayout', gf957.netPayout, 29753],
  ['variance', gf957.variance, -247],
];

let allPassed = true;
for (const [key, actual, expected] of assertions) {
  if (actual !== expected) {
    console.error(`FAIL: ${key} expected ${expected}, got ${actual}`);
    allPassed = false;
  } else {
    console.log(`PASS: ${key} = ${actual}`);
  }
}

console.log('\n--- TEST 2: Reverse Recommendation ---');
const rec = calculateRecommendedPrice(30000, 'PERCENT', 30, 20, 14, true, 'CEIL_500');
console.log('Recommendation:', rec);

const checkAtExact = calculateForward(rec.exactRecommendedPrice, 30000, 'PERCENT', 30, 20, 14, true);
const checkBelowExact = calculateForward(rec.exactRecommendedPrice - 1, 30000, 'PERCENT', 30, 20, 14, true);

console.log(`At exact (${rec.exactRecommendedPrice}): payout = ${checkAtExact.netPayout} (variance ${checkAtExact.variance})`);
console.log(`Below exact (${rec.exactRecommendedPrice - 1}): payout = ${checkBelowExact.netPayout} (variance ${checkBelowExact.variance})`);

if (checkAtExact.netPayout >= 30000 && checkBelowExact.netPayout < 30000) {
  console.log('PASS: Exact minimum boundary proven perfectly!');
} else {
  console.error('FAIL: Exact boundary condition failed!');
  allPassed = false;
}

console.log('\n--- TEST 3: GoFood Benchmark Orders (F-3388856614 & F-3392285639) ---');
const GOFOOD_FIXED_FEE = 800;

function calculateGoFoodForward(displayPrice, targetOfflinePrice, discountType, discountValue, commissionPct, subsidyPct, isCoFunded) {
  const safeDisplayPrice = Math.max(0, Math.round(displayPrice || 0));
  const safeTargetPrice = Math.max(0, Math.round(targetOfflinePrice || 0));
  let promoDiscount = discountType === 'PERCENT'
    ? Math.round(safeDisplayPrice * (discountValue / 100))
    : Math.min(safeDisplayPrice, Math.round(discountValue));
  const mitraPromo = isCoFunded ? Math.round(promoDiscount * (1 - subsidyPct / 100)) : promoDiscount;
  const gojekPromo = promoDiscount - mitraPromo;
  const commissionBase = Math.max(0, safeDisplayPrice - mitraPromo);
  const platformFee = safeDisplayPrice > 0 ? Math.round(commissionBase * (commissionPct / 100)) + GOFOOD_FIXED_FEE : 0;
  const totalDeduction = platformFee + mitraPromo;
  const netPayout = safeDisplayPrice - totalDeduction;
  const variance = netPayout - safeTargetPrice;
  return { promoDiscount, mitraPromo, gojekPromo, platformFee, totalDeduction, netPayout, variance };
}

// Receipt 1: F-3388856614
const gf1 = calculateGoFoodForward(45950, 28000, 'NOMINAL', 4600, 20, 25, true);
console.log('GoFood Order 1 (F-3388856614):', gf1);

const gofoodAssertions1 = [
  ['Order 1 mitraPromo', gf1.mitraPromo, 3450],
  ['Order 1 gojekPromo', gf1.gojekPromo, 1150],
  ['Order 1 platformFee', gf1.platformFee, 9300],
  ['Order 1 netPayout', gf1.netPayout, 33200],
];

for (const [key, actual, expected] of gofoodAssertions1) {
  if (actual !== expected) {
    console.error(`FAIL: ${key} expected ${expected}, got ${actual}`);
    allPassed = false;
  } else {
    console.log(`PASS: ${key} = ${actual}`);
  }
}

// Receipt 2: F-3392285639 (Real boncos invoice)
const gf2 = calculateGoFoodForward(47850, 28000, 'NOMINAL', 20160, 20, 25, true);
console.log('GoFood Order 2 (F-3392285639):', gf2);

const gofoodAssertions2 = [
  ['Order 2 mitraPromo', gf2.mitraPromo, 15120],
  ['Order 2 gojekPromo', gf2.gojekPromo, 5040],
  ['Order 2 platformFee', gf2.platformFee, 7346],
  ['Order 2 netPayout', gf2.netPayout, 25384],
  ['Order 2 variance (boncos)', gf2.variance, -2616],
];

for (const [key, actual, expected] of gofoodAssertions2) {
  if (actual !== expected) {
    console.error(`FAIL: ${key} expected ${expected}, got ${actual}`);
    allPassed = false;
  } else {
    console.log(`PASS: ${key} = ${actual}`);
  }
}

// --- TEST 4: Input Sanitization & Leading Zero Prevention ---
console.log('\n--- TEST 4: Numeric Input Sanitization (Bug Fix: "020" -> "20") ---');
function sanitizeNumericInput(rawInput, options) {
  let cleaned = String(rawInput ?? '').trim();
  if (/^0+[0-9]/.test(cleaned)) {
    cleaned = cleaned.replace(/^0+(?=\d)/, '');
  }
  if (/^0+$/.test(cleaned)) {
    cleaned = '0';
  }
  const parsed = parseFloat(cleaned);
  let num = isNaN(parsed) ? (options?.defaultValue ?? 0) : parsed;
  if (options?.min !== undefined && num < options.min) {
    num = options.min;
    cleaned = String(options.min);
  }
  if (options?.max !== undefined && num > options.max) {
    num = options.max;
    cleaned = String(options.max);
  }
  return { cleanedString: cleaned, numericValue: num };
}

const inputTests = [
  { input: '020', opts: { min: 0, max: 100 }, expectedStr: '20', expectedNum: 20 },
  { input: '007', opts: { min: 0 }, expectedStr: '7', expectedNum: 7 },
  { input: '0', opts: { min: 0 }, expectedStr: '0', expectedNum: 0 },
  { input: '00', opts: { min: 0 }, expectedStr: '0', expectedNum: 0 },
  { input: '000', opts: { min: 0 }, expectedStr: '0', expectedNum: 0 },
  { input: '030000', opts: { min: 0 }, expectedStr: '30000', expectedNum: 30000 },
  { input: '120', opts: { min: 0, max: 100 }, expectedStr: '100', expectedNum: 100 },
  { input: '', opts: { min: 0 }, expectedStr: '', expectedNum: 0 },
];

for (const t of inputTests) {
  const res = sanitizeNumericInput(t.input, t.opts);
  if (res.cleanedString !== t.expectedStr || res.numericValue !== t.expectedNum) {
    console.error(`FAIL input '${t.input}': expected (${t.expectedStr}, ${t.expectedNum}), got (${res.cleanedString}, ${res.numericValue})`);
    allPassed = false;
  } else {
    console.log(`PASS: input '${t.input}' -> string '${res.cleanedString}', num ${res.numericValue}`);
  }
}

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\nALL ENGINE BENCHMARK TESTS (GRABFOOD, GOFOOD & INPUT SANITIZATION) PASSED 100%!');
}
