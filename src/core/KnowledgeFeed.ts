import axios from 'axios';
import OpenAI from 'openai';
import { db } from '../lib/supabase';
import { AIEvolutionLogger } from './AIEvolutionLogger';

interface GutenbergBook {
  id: number;
  title: string;
  authors: Array<{ name: string }>;
  subjects: string[];
  download_count: number;
  formats: Record<string, string>;
}

interface ProcessedChapter {
  book_id: number;
  chapter_number: number;
  title: string;
  content: string;
  tags: string[];
  relevance_score: number;
  embedding: number[];
}

interface KnowledgeExcerpt {
  content: string;
  source: {
    book_id: number;
    title: string;
    author: string;
    chapter: number;
  };
  tags: string[];
  relevance_score: number;
}

export class KnowledgeFeed {
  private static instance: KnowledgeFeed;
  private evolutionLogger: AIEvolutionLogger;
  private openai: OpenAI;
  private readonly GUTENDEX_API = 'https://gutendex.com/books';
  
  private constructor() {
    this.evolutionLogger = AIEvolutionLogger.getInstance();
    this.openai = new OpenAI();
  }

  public static getInstance(): KnowledgeFeed {
    if (!KnowledgeFeed.instance) {
      KnowledgeFeed.instance = new KnowledgeFeed();
    }
    return KnowledgeFeed.instance;
  }

  public async runBiweeklyIngestion(): Promise<void> {
    try {
      // Get relevant books
      const books = await this.findRelevantBooks();

      // Select top 3-5 books based on relevance and download count
      const selectedBooks = this.selectTopBooks(books);

      // Process each book
      for (const book of selectedBooks) {
        await this.processBook(book);
      }

      // Log successful ingestion
      await this.logIngestionSuccess(selectedBooks);

    } catch (error) {
      console.error('Error in biweekly ingestion:', error);
      await this.notifyIngestionFailure(error);
      throw error;
    }
  }

  private async findRelevantBooks(): Promise<GutenbergBook[]> {
    const keywords = [
      'advertising', 'marketing', 'brand', 'consumer',
      'psychology', 'behavior', 'business', 'strategy'
    ];

    const bookPromises = keywords.map(keyword =>
      axios.get(this.GUTENDEX_API, {
        params: {
          search: keyword,
          mime_type: 'text/plain',
          languages: 'en'
        }
      })
    );

    const responses = await Promise.all(bookPromises);
    const books = responses.flatMap(response => response.data.results);

    // Remove duplicates
    const uniqueBooks = Array.from(
      new Map(books.map(book => [book.id, book])).values()
    );

    return uniqueBooks;
  }

  private selectTopBooks(books: GutenbergBook[]): GutenbergBook[] {
    // Score books based on relevance and popularity
    const scoredBooks = books.map(book => ({
      ...book,
      score: this.calculateBookScore(book)
    }));

    // Sort by score and select 3-5 books
    return scoredBooks
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.floor(Math.random() * 3) + 3);
  }

  private calculateBookScore(book: GutenbergBook): number {
    const relevantSubjects = [
      'advertising', 'marketing', 'business', 'psychology',
      'consumer', 'brand', 'strategy', 'commerce'
    ];

    const subjectScore = book.subjects.reduce((score, subject) => {
      return score + (
        relevantSubjects.some(rs => 
          subject.toLowerCase().includes(rs.toLowerCase())
        ) ? 1 : 0
      );
    }, 0);

    const downloadScore = Math.min(book.download_count / 1000, 10);

    return subjectScore * 0.7 + downloadScore * 0.3;
  }

  private async processBook(book: GutenbergBook): Promise<void> {
    try {
      // Download book content
      const textUrl = book.formats['text/plain']?.replace('http:', 'https:');
      if (!textUrl) throw new Error('No plain text format available');

      const response = await axios.get(textUrl);
      const content = response.data;

      // Split into chapters
      const chapters = this.splitIntoChapters(content);

      // Process each chapter
      const processedChapters = await Promise.all(
        chapters.map((chapter, index) =>
          this.processChapter(book, index + 1, chapter)
        )
      );

      // Store processed chapters
      await this.storeChapters(book, processedChapters);

      // Extract and store high-quality excerpts
      await this.extractAndStoreExcerpts(book, processedChapters);

    } catch (error) {
      console.error(`Error processing book ${book.id}:`, error);
      throw error;
    }
  }

  private splitIntoChapters(content: string): string[] {
    // Split on common chapter markers
    const chapterMarkers = [
      /CHAPTER [IVXLC]+/i,
      /CHAPTER \d+/i,
      /\n\s*[IVXLC]+\s*\n/,
      /\n\s*\d+\s*\n/
    ];

    let chapters: string[] = [content];
    
    for (const marker of chapterMarkers) {
      if (content.match(marker)) {
        chapters = content.split(marker).slice(1); // Skip intro
        break;
      }
    }

    return chapters.map(chapter => chapter.trim()).filter(Boolean);
  }

  private async processChapter(
    book: GutenbergBook,
    chapterNumber: number,
    content: string
  ): Promise<ProcessedChapter> {
    // Generate embedding for the chapter
    const embedding = await this.generateEmbedding(
      this.truncateForEmbedding(content)
    );

    // Calculate relevance score
    const relevanceScore = await this.calculateRelevance(content);

    // Extract tags
    const tags = await this.extractTags(content);

    return {
      book_id: book.id,
      chapter_number: chapterNumber,
      title: this.extractChapterTitle(content) || `Chapter ${chapterNumber}`,
      content,
      tags,
      relevance_score: relevanceScore,
      embedding
    };
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });

    return response.data[0].embedding;
  }

  private truncateForEmbedding(text: string): string {
    // OpenAI's embedding model has a token limit
    return text.slice(0, 8000); // Approximate 2000 tokens
  }

  private async calculateRelevance(content: string): Promise<number> {
    const prompt = `Rate the relevance of this text for marketing and branding strategy on a scale of 0 to 1:

Text: "${content.substring(0, 500)}..."

Respond with just a number between 0 and 1.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 10
    });

    try {
      return parseFloat(response.choices[0].message.content) || 0;
    } catch {
      return 0;
    }
  }

  private async extractTags(content: string): Promise<string[]> {
    const prompt = `Extract 3-5 key marketing or strategy concepts from this text:

Text: "${content.substring(0, 500)}..."

Respond with just the concepts, separated by commas.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 50
    });

    return response.choices[0].message.content
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }

  private extractChapterTitle(content: string): string | null {
    const titleMatch = content.match(/^[^\n.!?]+[.!?]/);
    return titleMatch ? titleMatch[0].trim() : null;
  }

  private async storeChapters(book: GutenbergBook, chapters: ProcessedChapter[]): Promise<void> {
    await db.knowledge_chapters.createMany(
      chapters.map(chapter => ({
        book_id: chapter.book_id,
        chapter_number: chapter.chapter_number,
        title: chapter.title,
        content: chapter.content,
        tags: chapter.tags,
        relevance_score: chapter.relevance_score,
        embedding: chapter.embedding,
        metadata: {
          book_title: book.title,
          author: book.authors[0]?.name || 'Unknown',
          ingestion_date: new Date()
        }
      }))
    );
  }

  private async extractAndStoreExcerpts(book: GutenbergBook, chapters: ProcessedChapter[]): Promise<void> {
    const excerpts: KnowledgeExcerpt[] = [];

    for (const chapter of chapters) {
      if (chapter.relevance_score < 0.7) continue;

      const chapterExcerpts = await this.extractExcerpts(chapter.content);
      
      excerpts.push(...chapterExcerpts.map(excerpt => ({
        content: excerpt,
        source: {
          book_id: book.id,
          title: book.title,
          author: book.authors[0]?.name || 'Unknown',
          chapter: chapter.chapter_number
        },
        tags: chapter.tags,
        relevance_score: chapter.relevance_score
      })));
    }

    // Store excerpts
    await db.knowledge_excerpts.createMany(excerpts);
  }

  private async extractExcerpts(content: string): Promise<string[]> {
    const prompt = `Extract 2-3 high-quality, self-contained excerpts about marketing or business strategy from this text. Each excerpt should be 2-3 sentences long.

Text: "${content.substring(0, 1000)}..."

Respond with excerpts separated by |||`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200
    });

    return response.choices[0].message.content
      .split('|||')
      .map(excerpt => excerpt.trim())
      .filter(Boolean);
  }

  private async logIngestionSuccess(books: GutenbergBook[]): Promise<void> {
    await this.evolutionLogger.logEvolution('system', {
      type: 'MODEL_ADJUSTMENT',
      trigger: {
        source: 'knowledge_feed',
        action: 'biweekly_ingestion',
        metadata: {
          books: books.map(b => ({
            id: b.id,
            title: b.title,
            author: b.authors[0]?.name
          }))
        }
      },
      changes: {
        before: { knowledge_base: 'previous' },
        after: { knowledge_base: 'updated' },
        impact_areas: ['strategic_reasoning', 'content_generation']
      }
    });

    // Log to system logs
    await db.system_logs.create({
      type: 'INGESTION_SUCCESS',
      component: 'knowledge_feed',
      message: `Successfully ingested ${books.length} books`,
      metadata: {
        books: books.map(b => b.title),
        timestamp: new Date()
      }
    });
  }

  private async notifyIngestionFailure(error: Error): Promise<void> {
    // Log to system logs
    await db.system_logs.create({
      type: 'INGESTION_FAILURE',
      component: 'knowledge_feed',
      message: error.message,
      metadata: {
        error_stack: error.stack,
        timestamp: new Date()
      }
    });

    // Send Slack notification
    await this.sendSlackNotification({
      channel: 'system-alerts',
      text: `🚨 Knowledge Feed Ingestion Failed\n\nError: ${error.message}\n\nCheck system logs for details.`
    });
  }

  private async sendSlackNotification(message: { channel: string; text: string }): Promise<void> {
    // Implementation would depend on your Slack integration
    console.log('Slack notification:', message);
  }
} 