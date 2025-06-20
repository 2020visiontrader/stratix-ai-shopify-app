// Ad Generator - TypeScript implementation using OpenAI
// Generates ad copy for products/campaigns using real OpenAI API calls.

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAdCopy(productName: string, productDetails: string): Promise<string> {
  const prompt = `Write a compelling ad for the product '${productName}'. Highlight: ${productDetails}. Include a clear call-to-action.`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  });
  return response.choices[0]?.message?.content?.trim() ?? '';
}
