// Knowledge Feed Engine - TypeScript implementation using OpenAI embeddings and Supabase vector storage
// Ingests books from Project Gutenberg, generates embeddings, and stores them in Supabase.

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GUTENBERG_API = 'https://gutendex.com/books';

export interface KnowledgeFeedItem {
  id?: string;
  title: string;
  author: string;
  topics: string[];
  gutenbergId: number;
  embedding: number[];
  summary: string;
  createdAt: string;
}

async function fetchMarketingBooks(): Promise<any[]> {
  const topics = ['Schwartz', 'Ogilvy', 'Hopkins', 'marketing'];
  const results: any[] = [];
  for (const topic of topics) {
    const res = await fetch(`${GUTENBERG_API}?search=${encodeURIComponent(topic)}`);
    const data = await res.json();
    results.push(...data.results);
  }
  return results;
}

export async function ingestBooksToFeed(): Promise<KnowledgeFeedItem[]> {
  const books = await fetchMarketingBooks();
  const feedItems: KnowledgeFeedItem[] = [];
  for (const book of books) {
    const content = book.title + '\n' + (book.subjects?.join(', ') || '');
    // Generate embedding using OpenAI
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: content,
    });
    const embedding = embeddingRes.data[0].embedding;
    const feedItem: KnowledgeFeedItem = {
      title: book.title,
      author: book.authors?.map((a: any) => a.name).join(', ') || '',
      topics: book.subjects || [],
      gutenbergId: book.id,
      embedding,
      summary: '', // Optionally, use OpenAI to summarize
      createdAt: new Date().toISOString(),
    };
    // Store feedItem in Supabase
    const { error } = await supabase.from('knowledge_feed').insert([feedItem]);
    if (error) throw new Error('Failed to store knowledge feed item: ' + error.message);
    feedItems.push(feedItem);
  }
  return feedItems;
} 