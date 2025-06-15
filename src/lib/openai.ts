import OpenAI from 'openai';
import { openAIConfig } from '../config';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API key');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateCompletion = async (
  prompt: string,
  config: Partial<typeof openAIConfig> = {}
) => {
  const completion = await openai.chat.completions.create({
    model: config.model || openAIConfig.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: config.temperature || openAIConfig.temperature,
    max_tokens: config.maxTokens || openAIConfig.maxTokens,
    top_p: config.topP || openAIConfig.topP,
    frequency_penalty: config.frequencyPenalty || openAIConfig.frequencyPenalty,
    presence_penalty: config.presencePenalty || openAIConfig.presencePenalty,
  });

  return completion.choices[0].message.content;
};

export const analyzeText = async (text: string) => {
  const prompt = `
    Analyze the following text and extract key brand information:
    
    ${text}
    
    Please provide:
    1. Brand voice and tone
    2. Target audience
    3. Key messaging points
    4. Marketing objectives
    5. Visual identity elements (if mentioned)
    6. Conversion goals and metrics
    
    Format the response as JSON.
  `;

  const response = await generateCompletion(prompt, {
    temperature: 0.3,
    maxTokens: 1000,
  });

  try {
    return JSON.parse(response || '{}');
  } catch (error) {
    throw new Error('Failed to parse OpenAI response');
  }
};

export const generateABTestVariants = async (
  original: string,
  context: Record<string, any>
) => {
  const prompt = `
    Generate A/B test variants for the following content:
    
    Original: ${original}
    
    Context:
    ${JSON.stringify(context, null, 2)}
    
    Generate 3 variants that:
    1. Maintain the same core message
    2. Test different approaches/angles
    3. Follow the brand voice
    
    Format the response as JSON with 'variants' array.
  `;

  const response = await generateCompletion(prompt, {
    temperature: 0.7,
    maxTokens: 1000,
  });

  try {
    return JSON.parse(response || '{}');
  } catch (error) {
    throw new Error('Failed to parse OpenAI response');
  }
}; 