// Source: GrowthBook, Stratix logs (adapted for Stratix)
// Insights Dashboard - Aggregate metrics from logs

function getInsightsMetrics(logs) {
  const totalGenerations = logs.filter(entry => entry.event === 'content_generated').length;
  const totalConversions = logs.filter(entry => entry.event === 'conversion').length;
  const conversionRate = totalGenerations ? (totalConversions / totalGenerations) * 100 : 0;
  return {
    totalGenerations,
    totalConversions,
    conversionRate: conversionRate.toFixed(2) + "%"
  };
}

// Example usage:
// const stats = getInsightsMetrics(stratixLogs);
// console.log("AI Content Pieces Generated:", stats.totalGenerations);
// console.log("Conversions from AI Content:", stats.totalConversions);
// console.log("Conversion Rate:", stats.conversionRate);

module.exports = { getInsightsMetrics }; 