import { db } from '../lib/supabase';
import { AIEvolutionLogger } from './AIEvolutionLogger';

interface ToneProfile {
  tone: {
    primary: string;
    secondary: string[];
    strength: number;
  };
  persona: {
    type: 'Mentor' | 'Friend' | 'Authority' | 'Trendsetter';
    confidence: number;
  };
  style_markers: {
    formality: number; // 0 to 1
    emotion: number; // 0 to 1
    technical: number; // 0 to 1
    persuasive: number; // 0 to 1
  };
  vocabulary: {
    common_phrases: string[];
    key_terms: string[];
    avoided_words: string[];
  };
}

interface ContentSource {
  type: 'product' | 'social' | 'website';
  content: string;
  metadata?: {
    platform?: string;
    context?: string;
    engagement?: number;
  };
}

export class ToneInferrer {
  private static instance: ToneInferrer;
  private evolutionLogger: AIEvolutionLogger;
  
  private constructor() {
    this.evolutionLogger = AIEvolutionLogger.getInstance();
  }

  public static getInstance(): ToneInferrer {
    if (!ToneInferrer.instance) {
      ToneInferrer.instance = new ToneInferrer();
    }
    return ToneInferrer.instance;
  }

  public async inferToneProfile(brandId: string): Promise<ToneProfile> {
    try {
      // Gather content from various sources
      const [products, socials, website] = await Promise.all([
        this.getProductContent(brandId),
        this.getSocialContent(brandId),
        this.getWebsiteContent(brandId)
      ]);

      // Analyze each content type
      const analyses = await Promise.all([
        this.analyzeContent({ type: 'product', content: products }),
        this.analyzeContent({ type: 'social', content: socials }),
        this.analyzeContent({ type: 'website', content: website })
      ]);

      // Combine analyses into a unified profile
      const profile = this.synthesizeProfile(analyses);

      // Store inferred profile
      await db.brand_profiles.create({
        brand_id: brandId,
        profile_type: 'inferred',
        data: profile,
        confidence_score: this.calculateConfidence(analyses),
        created_at: new Date()
      });

      // Log evolution event
      await this.evolutionLogger.logEvolution(brandId, {
        type: 'MODEL_ADJUSTMENT',
        trigger: {
          source: 'tone_inferrer',
          action: 'initial_profile_creation',
          metadata: { content_sources: ['products', 'social', 'website'] }
        },
        changes: {
          before: { profile: null },
          after: { profile },
          impact_areas: ['brand_voice', 'content_generation']
        }
      });

      return profile;

    } catch (error) {
      console.error('Error inferring tone profile:', error);
      throw error;
    }
  }

  private async getProductContent(brandId: string): Promise<string> {
    const { data: products } = await db.shopify_products.listByBrandId(brandId);
    
    return products?.map(product => `
      ${product.title}
      ${product.description}
      ${product.tags?.join(' ')}
    `).join('\n') || '';
  }

  private async getSocialContent(brandId: string): Promise<string> {
    const { data: posts } = await db.social_posts.getByBrandId(brandId);
    
    return posts?.map(post => `
      ${post.caption}
      ${post.hashtags?.join(' ')}
    `).join('\n') || '';
  }

  private async getWebsiteContent(brandId: string): Promise<string> {
    const { data: pages } = await db.website_content.getByBrandId(brandId);
    
    return pages?.map(page => `
      ${page.title}
      ${page.meta_description}
      ${page.content}
    `).join('\n') || '';
  }

  private async analyzeContent(source: ContentSource): Promise<{
    tone_markers: Record<string, number>;
    persona_indicators: Record<string, number>;
    style_metrics: Record<string, number>;
    vocabulary: {
      phrases: string[];
      terms: string[];
      avoided: string[];
    };
  }> {
    // Extract tone markers
    const toneMarkers = this.extractToneMarkers(source.content);
    
    // Identify persona indicators
    const personaIndicators = this.identifyPersona(source.content);
    
    // Calculate style metrics
    const styleMetrics = this.calculateStyleMetrics(source.content);
    
    // Analyze vocabulary
    const vocabulary = this.analyzeVocabulary(source.content);

    return {
      tone_markers: toneMarkers,
      persona_indicators: personaIndicators,
      style_metrics: styleMetrics,
      vocabulary
    };
  }

  private extractToneMarkers(content: string): Record<string, number> {
    const markers: Record<string, number> = {
      professional: 0,
      casual: 0,
      playful: 0,
      authoritative: 0,
      empathetic: 0,
      minimalist: 0,
      luxurious: 0,
      urgent: 0
    };

    // Professional markers
    markers.professional += (content.match(/professional|expertise|solution|quality/gi) || []).length;
    
    // Casual markers
    markers.casual += (content.match(/hey|awesome|great|love|thanks/gi) || []).length;
    
    // Playful markers
    markers.playful += (content.match(/fun|exciting|amazing|wow|🎉|😊/gi) || []).length;
    
    // Authoritative markers
    markers.authoritative += (content.match(/proven|leading|expert|trusted|guarantee/gi) || []).length;
    
    // Empathetic markers
    markers.empathetic += (content.match(/understand|help|support|care|together/gi) || []).length;
    
    // Minimalist markers
    markers.minimalist += (content.match(/simple|clean|essential|minimal|pure/gi) || []).length;
    
    // Luxurious markers
    markers.luxurious += (content.match(/premium|luxury|exclusive|elegant|finest/gi) || []).length;
    
    // Urgent markers
    markers.urgent += (content.match(/limited|now|hurry|exclusive|only/gi) || []).length;

    return markers;
  }

  private identifyPersona(content: string): Record<string, number> {
    const indicators: Record<string, number> = {
      Mentor: 0,
      Friend: 0,
      Authority: 0,
      Trendsetter: 0
    };

    // Mentor indicators
    indicators.Mentor += (content.match(/guide|learn|discover|understand|help you/gi) || []).length;
    
    // Friend indicators
    indicators.Friend += (content.match(/hey|together|community|join us|share/gi) || []).length;
    
    // Authority indicators
    indicators.Authority += (content.match(/expert|proven|research|guarantee|trusted/gi) || []).length;
    
    // Trendsetter indicators
    indicators.Trendsetter += (content.match(/new|innovative|trending|latest|revolutionary/gi) || []).length;

    return indicators;
  }

  private calculateStyleMetrics(content: string): Record<string, number> {
    return {
      formality: this.calculateFormalityScore(content),
      emotion: this.calculateEmotionScore(content),
      technical: this.calculateTechnicalScore(content),
      persuasive: this.calculatePersuasiveScore(content)
    };
  }

  private calculateFormalityScore(content: string): number {
    const formalMarkers = (content.match(/therefore|however|furthermore|accordingly/gi) || []).length;
    const informalMarkers = (content.match(/hey|yeah|awesome|cool|gonna/gi) || []).length;
    
    return Math.min(formalMarkers / (formalMarkers + informalMarkers + 1), 1);
  }

  private calculateEmotionScore(content: string): number {
    const emotionalWords = (content.match(/love|hate|excited|amazing|terrible/gi) || []).length;
    const totalWords = content.split(/\s+/).length;
    
    return Math.min(emotionalWords / (totalWords * 0.1), 1);
  }

  private calculateTechnicalScore(content: string): number {
    const technicalTerms = (content.match(/algorithm|technology|system|process|function/gi) || []).length;
    const totalWords = content.split(/\s+/).length;
    
    return Math.min(technicalTerms / (totalWords * 0.05), 1);
  }

  private calculatePersuasiveScore(content: string): number {
    const persuasiveMarkers = (content.match(/must|need|best|perfect|essential|guarantee/gi) || []).length;
    const totalWords = content.split(/\s+/).length;
    
    return Math.min(persuasiveMarkers / (totalWords * 0.05), 1);
  }

  private analyzeVocabulary(content: string): {
    phrases: string[];
    terms: string[];
    avoided: string[];
  } {
    // Extract common phrases (2-3 word combinations)
    const phrases = this.extractPhrases(content);
    
    // Extract key terms (single words with high frequency)
    const terms = this.extractKeyTerms(content);
    
    // Identify potentially avoided words (common words not present)
    const avoided = this.identifyAvoidedWords(content);

    return { phrases, terms, avoided };
  }

  private extractPhrases(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const phrases = new Map<string, number>();
    
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
    }

    return Array.from(phrases.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase]) => phrase);
  }

  private extractKeyTerms(content: string): string[] {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const frequencies = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length > 3) { // Ignore short words
        frequencies.set(word, (frequencies.get(word) || 0) + 1);
      }
    });

    return Array.from(frequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);
  }

  private identifyAvoidedWords(content: string): string[] {
    const commonWords = [
      'very', 'really', 'just', 'thing', 'stuff', 'nice',
      'good', 'bad', 'big', 'small', 'lot', 'many'
    ];
    
    return commonWords.filter(word => 
      !content.toLowerCase().includes(word)
    );
  }

  private synthesizeProfile(analyses: Array<{
    tone_markers: Record<string, number>;
    persona_indicators: Record<string, number>;
    style_metrics: Record<string, number>;
    vocabulary: {
      phrases: string[];
      terms: string[];
      avoided: string[];
    };
  }>): ToneProfile {
    // Combine tone markers
    const combinedToneMarkers = this.combineToneMarkers(analyses.map(a => a.tone_markers));
    
    // Determine primary and secondary tones
    const [primaryTone, ...secondaryTones] = Object.entries(combinedToneMarkers)
      .sort((a, b) => b[1] - a[1])
      .map(([tone]) => tone);

    // Determine dominant persona
    const combinedPersonaIndicators = this.combinePersonaIndicators(
      analyses.map(a => a.persona_indicators)
    );
    
    const dominantPersona = Object.entries(combinedPersonaIndicators)
      .sort((a, b) => b[1] - a[1])[0];

    // Combine style metrics
    const combinedStyleMetrics = this.combineStyleMetrics(
      analyses.map(a => a.style_metrics)
    );

    // Combine vocabulary
    const combinedVocabulary = this.combineVocabulary(
      analyses.map(a => a.vocabulary)
    );

    return {
      tone: {
        primary: primaryTone,
        secondary: secondaryTones.slice(0, 2),
        strength: combinedToneMarkers[primaryTone]
      },
      persona: {
        type: dominantPersona[0] as ToneProfile['persona']['type'],
        confidence: dominantPersona[1]
      },
      style_markers: combinedStyleMetrics,
      vocabulary: combinedVocabulary
    };
  }

  private combineToneMarkers(markers: Record<string, number>[]): Record<string, number> {
    const combined: Record<string, number> = {};
    
    markers.forEach(marker => {
      Object.entries(marker).forEach(([tone, score]) => {
        combined[tone] = (combined[tone] || 0) + score;
      });
    });

    // Normalize scores
    const total = Object.values(combined).reduce((sum, score) => sum + score, 0);
    Object.keys(combined).forEach(tone => {
      combined[tone] = combined[tone] / total;
    });

    return combined;
  }

  private combinePersonaIndicators(indicators: Record<string, number>[]): Record<string, number> {
    const combined: Record<string, number> = {};
    
    indicators.forEach(indicator => {
      Object.entries(indicator).forEach(([persona, score]) => {
        combined[persona] = (combined[persona] || 0) + score;
      });
    });

    // Normalize scores
    const total = Object.values(combined).reduce((sum, score) => sum + score, 0);
    Object.keys(combined).forEach(persona => {
      combined[persona] = combined[persona] / total;
    });

    return combined;
  }

  private combineStyleMetrics(metrics: Record<string, number>[]): ToneProfile['style_markers'] {
    const combined: ToneProfile['style_markers'] = {
      formality: 0,
      emotion: 0,
      technical: 0,
      persuasive: 0
    };

    metrics.forEach(metric => {
      Object.entries(metric).forEach(([style, score]) => {
        combined[style as keyof ToneProfile['style_markers']] += score;
      });
    });

    // Average the scores
    Object.keys(combined).forEach(style => {
      combined[style as keyof ToneProfile['style_markers']] /= metrics.length;
    });

    return combined;
  }

  private combineVocabulary(vocabularies: Array<{
    phrases: string[];
    terms: string[];
    avoided: string[];
  }>): ToneProfile['vocabulary'] {
    const phrases = new Set<string>();
    const terms = new Set<string>();
    const avoided = new Set<string>();

    vocabularies.forEach(vocab => {
      vocab.phrases.forEach(phrase => phrases.add(phrase));
      vocab.terms.forEach(term => terms.add(term));
      vocab.avoided.forEach(word => avoided.add(word));
    });

    return {
      common_phrases: Array.from(phrases).slice(0, 10),
      key_terms: Array.from(terms).slice(0, 15),
      avoided_words: Array.from(avoided)
    };
  }

  private calculateConfidence(analyses: any[]): number {
    const factors = {
      content_volume: this.calculateContentVolume(analyses),
      consistency: this.calculateConsistency(analyses),
      clarity: this.calculateClarity(analyses)
    };

    return (factors.content_volume + factors.consistency + factors.clarity) / 3;
  }

  private calculateContentVolume(analyses: any[]): number {
    const totalContent = analyses.reduce((sum, analysis) => {
      return sum + Object.values(analysis.tone_markers).reduce((a: number, b: number) => a + b, 0);
    }, 0);

    return Math.min(totalContent / 100, 1); // Normalize to 0-1
  }

  private calculateConsistency(analyses: any[]): number {
    const toneVariances = new Map<string, number[]>();
    
    analyses.forEach(analysis => {
      Object.entries(analysis.tone_markers).forEach(([tone, score]) => {
        if (!toneVariances.has(tone)) {
          toneVariances.set(tone, []);
        }
        toneVariances.get(tone)!.push(score as number);
      });
    });

    const variances = Array.from(toneVariances.values()).map(scores => {
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
      return variance;
    });

    const averageVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
    return 1 - Math.min(averageVariance, 1); // Convert to confidence score
  }

  private calculateClarity(analyses: any[]): number {
    const dominantScores = analyses.map(analysis => {
      const scores = Object.values(analysis.tone_markers) as number[];
      const max = Math.max(...scores);
      const sum = scores.reduce((a, b) => a + b, 0);
      return max / sum; // Ratio of dominant tone to total
    });

    return dominantScores.reduce((a, b) => a + b, 0) / dominantScores.length;
  }
} 