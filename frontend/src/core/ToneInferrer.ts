import { AppError } from '@/utils/errorHandling';

interface ToneAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[];
  tone: string[];
}

export class ToneInferrer {
  private static instance: ToneInferrer;
  private readonly toneKeywords: Map<string, string[]>;

  private constructor() {
    this.toneKeywords = new Map([
      ['professional', ['expert', 'reliable', 'trusted', 'quality']],
      ['friendly', ['welcome', 'hello', 'thanks', 'happy']],
      ['formal', ['regarding', 'furthermore', 'consequently', 'therefore']],
      ['casual', ['hey', 'cool', 'awesome', 'great']]
    ]);
  }

  public static getInstance(): ToneInferrer {
    if (!ToneInferrer.instance) {
      ToneInferrer.instance = new ToneInferrer();
    }
    return ToneInferrer.instance;
  }

  public analyzeTone(text: string): ToneAnalysis {
    if (!text || text.trim().length === 0) {
      throw new AppError('Text cannot be empty', 400);
    }

    const words = text.toLowerCase().split(/\s+/);
    const tone: string[] = [];
    const keywords: string[] = [];
    let positiveCount = 0;
    let negativeCount = 0;

    // Analyze tone based on keywords
    for (const [toneType, keywords] of this.toneKeywords.entries()) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        tone.push(toneType);
      }
    }

    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'horrible'];

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
      if (this.toneKeywords.get('professional')?.includes(word)) keywords.push(word);
    });

    const sentiment = positiveCount > negativeCount ? 'positive' 
      : negativeCount > positiveCount ? 'negative' 
      : 'neutral';

    const confidence = Math.abs(positiveCount - negativeCount) / (positiveCount + negativeCount || 1);

    return {
      sentiment,
      confidence,
      keywords,
      tone
    };
  }

  public getToneKeywords(): Map<string, string[]> {
    return new Map(this.toneKeywords);
  }
}
