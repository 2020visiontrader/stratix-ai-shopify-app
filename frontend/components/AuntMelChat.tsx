// Source: https://github.com/upsidelab/enthusiast (adapted for Stratix)
// Aunt Mel Chatbot Assistant - Stratix AI
// White-labeled, no OpenAI branding. Only "Stratix AI Assistant".

import { useEffect, useRef, useState } from 'react';
import type { ApiResponse } from '../src/lib/api-client';
import { apiClient } from '../src/lib/api-client';
import type { AuntMelResponse } from '../src/types';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
}

const initialMessages: Message[] = [
  { sender: 'assistant', text: 'Hi, I\'m Aunt Mel, your Stratix AI Assistant! How can I help you today?' },
];

export default function AuntMelChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setError(null);
    setLoading(true);
    const userMsg = { sender: 'user' as const, text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput('');
    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
      const response = await apiClient.chatWithAssistant(conversationHistory, input) as ApiResponse<AuntMelResponse>;
      if (response.success && response.data && response.data.response) {
        setMessages((msgs) => [...msgs, { sender: 'assistant', text: response.data!.response }]);
      } else {
        setError(response.error || 'No response from assistant.');
      }
    } catch (err: any) {
      setError('Failed to get response from assistant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-indigo-700 flex flex-col z-50">
      <div className="px-4 py-3 bg-indigo-700 text-white rounded-t-xl font-bold text-lg">Stratix AI Assistant</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ maxHeight: 400 }}>
        {messages.map((msg, i) => (
          <div key={i} className={msg.sender === 'user' ? 'text-right' : 'text-left'}>
            <span className={msg.sender === 'user' ? 'inline-block bg-indigo-100 text-indigo-900 px-3 py-2 rounded-lg' : 'inline-block bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg'}>
              {msg.text}
            </span>
          </div>
        ))}
        {loading && (
          <div className="text-left">
            <span className="inline-block bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg animate-pulse">Aunt Mel is typing...</span>
          </div>
        )}
        {error && (
          <div className="text-left">
            <span className="inline-block bg-red-100 text-red-700 px-3 py-2 rounded-lg">{error}</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="flex border-t border-gray-200 dark:border-gray-700">
        <input
          className="flex-1 px-3 py-2 rounded-bl-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
          placeholder="Ask Aunt Mel..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button
          className="px-4 py-2 bg-indigo-700 text-white rounded-br-xl hover:bg-indigo-800 focus:outline-none"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
