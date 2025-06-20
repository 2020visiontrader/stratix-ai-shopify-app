// Brand DNA Engine - TypeScript implementation using OpenAI embeddings and Supabase vector storage
// This module ingests brand documents, generates embeddings, stores them, and allows semantic search.

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BrandDocument {
  id: string;
  brandId: string;
  content: string;
  embedding?: number[];
  createdAt: string;
}

export async function ingestBrandDocument(brandId: string, content: string): Promise<BrandDocument> {
  // 1. Generate embedding using OpenAI
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: content,
  });
  const embedding = embeddingRes.data[0].embedding;
  // 2. Store document and embedding in Supabase
  const { data, error } = await supabase.from('brand_documents').insert([
    {
      brand_id: brandId,
      content,
      embedding,
      created_at: new Date().toISOString(),
    },
  ]).select().single();
  if (error) throw new Error('Failed to store brand document: ' + error.message);
  return {
    id: data.id,
    brandId: data.brand_id,
    content: data.content,
    embedding: data.embedding,
    createdAt: data.created_at,
  };
}

export async function searchBrandDocuments(brandId: string, query: string, topK = 3): Promise<BrandDocument[]> {
  // 1. Generate embedding for the query
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  });
  const queryEmbedding = embeddingRes.data[0].embedding;
  // 2. Perform vector similarity search in Supabase
  const { data, error } = await supabase.rpc('match_brand_documents', {
    query_embedding: queryEmbedding,
    match_count: topK,
    brand_id: brandId,
  });
  if (error) throw new Error('Vector search failed: ' + error.message);
  return data.map((doc: any) => ({
    id: doc.id,
    brandId: doc.brand_id,
    content: doc.content,
    embedding: doc.embedding,
    createdAt: doc.created_at,
  }));
}
