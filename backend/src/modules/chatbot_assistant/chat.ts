// Chatbot Assistant - TypeScript implementation using OpenAI
// Maintains conversation and context using real OpenAI API calls.

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT: OpenAI.ChatCompletionMessageParam = {
  role: 'system',
  content: 'You are an AI assistant for an e-commerce merchant, enthusiastic and helpful. Answer questions about the store and provide guidance.'
};

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export async function chatWithAssistant(conversationHistory: ChatMessage[], userMessage: string): Promise<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    SYSTEM_PROMPT,
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];
  const res = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
  });
  return res.choices[0]?.message?.content?.trim() ?? '';
} 