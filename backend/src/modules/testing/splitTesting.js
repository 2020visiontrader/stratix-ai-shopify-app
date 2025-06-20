// Source: https://github.com/growthbook/growthbook (adapted for Stratix)
// Split Testing System - Track impressions, conversions, auto-pick winners

// Placeholder: GrowthBook SDK integration
// const { GrowthBook } = require('@growthbook/growthbook');

const tests = {};

/**
 * Start a new split test
 */
function startTest(testName, variants) {
  tests[testName] = {
    variants: variants.map((v, i) => ({ ...v, impressions: 0, conversions: 0 })),
    startedAt: new Date().toISOString(),
    status: 'running',
  };
}

/**
 * Log an impression for a variant
 */
function logImpression(testName, variantIndex) {
  if (tests[testName]) {
    tests[testName].variants[variantIndex].impressions++;
  }
}

/**
 * Log a conversion for a variant
 */
function logConversion(testName, variantIndex) {
  if (tests[testName]) {
    tests[testName].variants[variantIndex].conversions++;
  }
}

/**
 * Auto-pick winning variant
 */
function pickWinner(testName) {
  if (!tests[testName]) return null;
  const variants = tests[testName].variants;
  // Simple: pick highest conversion rate
  const winner = variants.reduce((best, v) => {
    const rate = v.impressions ? v.conversions / v.impressions : 0;
    return rate > best.rate ? { index: variants.indexOf(v), rate } : best;
  }, { index: -1, rate: 0 });
  tests[testName].status = 'completed';
  tests[testName].winner = winner.index;
  return winner.index;
}

module.exports = { startTest, logImpression, logConversion, pickWinner }; 