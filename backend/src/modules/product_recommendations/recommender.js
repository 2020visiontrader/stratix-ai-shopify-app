// Source: https://github.com/gorse-io/gorse (adapted for Stratix)
// Product Recommendations - Fetch recommendations from Gorse

const { Gorse } = require('gorsejs');

const gorseClient = new Gorse({ endpoint: process.env.GORSE_ENDPOINT, secret: process.env.GORSE_API_KEY });

async function getRecommendations(userId, count = 5) {
  // Call Gorse API to get 'count' recommended item IDs for the given user
  const result = await gorseClient.getRecommend({ userId: userId, cursorOptions: { n: count } });
  const itemIDs = result.recommend;
  console.log(`Recommendations for ${userId}:`, itemIDs);
  return itemIDs;
}

// Example usage:
// getRecommendations("user_123");

module.exports = { getRecommendations }; 