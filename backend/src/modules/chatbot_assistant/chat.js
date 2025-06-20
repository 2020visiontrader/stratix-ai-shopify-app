// Source: OpenAI Chatbot Assistant (adapted for Stratix)
// Chatbot Assistant - Maintains conversation and context using OpenAI

const { Configuration, OpenAIApi } = require('openai');
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

const SYSTEM_PROMPT = { role: "system", content: "You are an AI assistant for an e-commerce merchant, enthusiastic and helpful. Answer questions about the store and provide guidance." };

async function chatWithAssistant(conversationHistory, userMessage) {
  // conversationHistory is an array of message objects: e.g., [{role: "user", content: "..."}...]
  const messages = [SYSTEM_PROMPT, ...conversationHistory, { role: "user", content: userMessage }];
  const res = await openai.createChatCompletion({ model: "gpt-4", messages });
  const assistantReply = res.data.choices[0].message.content;
  return assistantReply;
}

// Example usage:
// let history = [];
// history.push({ role: "user", content: "How can AI help my Shopify store?" });
// chatWithAssistant(history, "Give me an example of an AI-generated product description.")
//   .then(reply => { console.log("Assistant:", reply); });

module.exports = { chatWithAssistant }; 