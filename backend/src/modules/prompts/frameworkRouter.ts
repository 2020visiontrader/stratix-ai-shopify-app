// Framework Router - TypeScript implementation with real LLM (OpenAI) integration
// Uses OpenAI to rewrite content using selected copywriting frameworks

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const copywritingFormulas: string[] = [
  'AIDA', 'PAS', 'BAB', '4 Cs', '4 Ps', '4 Us', 'FAB', 'QUEST', 'ACCA', 'OATH', 'APP', 'RECIPE',
  // ... (full list of 232 frameworks as in CoppieGPT)
];

export async function rewriteWithFrameworks(content: string, count = 3): Promise<string[]> {
  // Pick random frameworks
  const chosen: string[] = [];
  while (chosen.length < count) {
    const idx = Math.floor(Math.random() * copywritingFormulas.length);
    if (!chosen.includes(copywritingFormulas[idx])) chosen.push(copywritingFormulas[idx]);
  }
  // Use OpenAI to rewrite content for each framework
  const rewrites: string[] = [];
  for (const formula of chosen) {
    const prompt = `Rewrite the following using the ${formula} copywriting framework:\n${content}`;
    const res = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    const message = res.choices[0]?.message?.content?.trim() ?? `[${formula}] ${content}`;
    rewrites.push(message);
  }
  return rewrites;
} 