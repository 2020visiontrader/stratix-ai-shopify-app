import { Router } from 'express';
import { ChatMessage, chatWithAssistant } from '../../modules/chatbot_assistant/chat';

const router = Router();

// POST /api/chatbot/chat
router.post('/chat', async (req, res) => {
  try {
    const { conversationHistory, userMessage } = req.body;
    if (!userMessage || !Array.isArray(conversationHistory)) return res.status(400).json({ error: 'conversationHistory (array) and userMessage are required' });
    const reply = await chatWithAssistant(conversationHistory as ChatMessage[], userMessage);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
