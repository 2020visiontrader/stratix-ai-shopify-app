// Product Recommendations - TypeScript implementation using Gorse (gorsejs)
// Fetches recommendations for a user from a Gorse server using real API calls.

// @ts-ignore
import { Gorse } from 'gorsejs';

const gorseClient = new Gorse({ endpoint: process.env.GORSE_ENDPOINT!, secret: process.env.GORSE_API_KEY });

export async function getRecommendations(userId: string, count = 5): Promise<string[]> {
  const result = await gorseClient.getRecommend({ userId, cursorOptions: { n: count } });
  return result.recommend;
} 