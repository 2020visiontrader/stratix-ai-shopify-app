import OpenAI from 'openai';
import { db } from '../lib/supabase';
import { AIEvolutionLogger } from './AIEvolutionLogger';

interface ToneFingerprint {
  voice_characteristics: {
    formality: number;
    emotion: number;
    technical: number;
    persuasive: number;
  };
  key_phrases: string[];
  avoided_terms: string[];
  emotional_markers: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  style_preferences: {
    sentence_length: 'short' | 'medium' | 'long';
    paragraph_structure: 'concise' | 'detailed' | 'balanced';
    rhetorical_devices: string[];
  };
}

interface ContentCheck {
  content: string;
  content_type: 'ad' | 'email' | 'page' | 'meta';
  brand_id: string;
  context?: Record<string, any>;
}

interface ToneAnalysis {
  matches_brand: boolean;
  confidence_score: number;
  issues: Array<{
    type: 'language' | 'emotion' | 'phrasing';
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestion: string;
  }>;
  metrics: {
    tone_adherence: number;
    emotional_alignment: number;
    phrasing_consistency: number;
  };
}

export class ToneGuard {
  private static instance: ToneGuard;
  private evolutionLogger: AIEvolutionLogger;
  private openai: OpenAI;
  
  private constructor() {
    this.evolutionLogger = AIEvolutionLogger.getInstance();
    this.openai = new OpenAI();
  }

  public static getInstance(): ToneGuard {
    if (!ToneGuard.instance) {
      ToneGuard.instance = new ToneGuard();
    }
    return ToneGuard.instance;
  }

  public async checkContent(check: ContentCheck): Promise<ToneAnalysis> {
    try {
      // Get brand's tone fingerprint
      const fingerprint = await this.getToneFingerprint(check.brand_id);

      // Analyze content against fingerprint
      const analysis = await this.analyzeContent(check.content, fingerprint);

      // Log significant deviations
      if (!analysis.matches_brand) {
        await this.logToneDeviation(check, analysis);
      }

      return analysis;

    } catch (error) {
      console.error('Error checking content tone:', error);
      throw error;
    }
  }

  private async getToneFingerprint(brandId: string): Promise<ToneFingerprint> {
    const { data: brand } = await db.brands.getById(brandId);
    
    if (!brand?.tone_fingerprint) {
      throw new Error('Brand tone fingerprint not found');
    }

    return brand.tone_fingerprint;
  }

  private async analyzeContent(
    content: string,
    fingerprint: ToneFingerprint
  ): Promise<ToneAnalysis> {
    // Initialize analysis
    const analysis: ToneAnalysis = {
      matches_brand: false,
      confidence_score: 0,
      issues: [],
      metrics: {
        tone_adherence: 0,
        emotional_alignment: 0,
        phrasing_consistency: 0
      }
    };

    // Check language consistency
    const languageIssues = await this.checkLanguageConsistency(content, fingerprint);
    analysis.issues.push(...languageIssues);

    // Check emotional tone
    const emotionIssues = await this.checkEmotionalTone(content, fingerprint);
    analysis.issues.push(...emotionIssues);

    // Check phrasing
    const phrasingIssues = await this.checkPhrasing(content, fingerprint);
    analysis.issues.push(...phrasingIssues);

    // Calculate metrics
    analysis.metrics = {
      tone_adherence: this.calculateToneAdherence(content, fingerprint),
      emotional_alignment: this.calculateEmotionalAlignment(content, fingerprint),
      phrasing_consistency: this.calculatePhrasingConsistency(content, fingerprint)
    };

    // Calculate overall match
    const { matches, confidence } = this.calculateOverallMatch(analysis.metrics);
    analysis.matches_brand = matches;
    analysis.confidence_score = confidence;

    return analysis;
  }

  private async checkLanguageConsistency(
    content: string,
    fingerprint: ToneFingerprint
  ): Promise<ToneAnalysis['issues']> {
    const prompt = `Analyze this content for consistency with the following voice characteristics:
- Formality: ${fingerprint.voice_characteristics.formality}
- Technical level: ${fingerprint.voice_characteristics.technical}
- Persuasiveness: ${fingerprint.voice_characteristics.persuasive}

Content: "${content}"

Identify any inconsistencies in language use. Respond in JSON format:
{
  "issues": [{
    "severity": "low|medium|high",
    "description": "issue description",
    "suggestion": "suggested fix"
  }]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500
    });

    try {
      const result = JSON.parse(response.choices[0].message.content || '{}');
      return (result.issues || []).map((issue: any) => ({
        type: 'language',
        severity: issue.severity,
        description: issue.description,
        suggestion: issue.suggestion
      }));
    } catch (error) {
      console.error('Error parsing language consistency check:', error);
      return [];
    }
  }

  private async checkEmotionalTone(
    content: string,
    fingerprint: ToneFingerprint
  ): Promise<ToneAnalysis['issues']> {
    const prompt = `Analyze this content for emotional tone consistency with these markers:
Positive: ${fingerprint.emotional_markers.positive.join(', ')}
Negative: ${fingerprint.emotional_markers.negative.join(', ')}
Neutral: ${fingerprint.emotional_markers.neutral.join(', ')}

Content: "${content}"

Identify any emotional tone mismatches. Respond in JSON format:
{
  "issues": [{
    "severity": "low|medium|high",
    "description": "issue description",
    "suggestion": "suggested fix"
  }]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500
    });

    try {
      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      return (result.issues || []).map((issue: any) => ({
        type: 'emotion',
        severity: issue.severity,
        description: issue.description,
        suggestion: issue.suggestion
      }));
    } catch (error) {
      console.error('Error parsing emotional tone check:', error);
      return [];
    }
  }

  private async checkPhrasing(
    content: string,
    fingerprint: ToneFingerprint
  ): Promise<ToneAnalysis['issues']> {
    const prompt = `Analyze this content for phrasing consistency with these preferences:
Key phrases: ${fingerprint.key_phrases.join(', ')}
Avoided terms: ${fingerprint.avoided_terms.join(', ')}
Sentence length: ${fingerprint.style_preferences.sentence_length}
Paragraph structure: ${fingerprint.style_preferences.paragraph_structure}
Rhetorical devices: ${fingerprint.style_preferences.rhetorical_devices.join(', ')}

Content: "${content}"

Identify any phrasing inconsistencies. Respond in JSON format:
{
  "issues": [{
    "severity": "low|medium|high",
    "description": "issue description",
    "suggestion": "suggested fix"
  }]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500
    });

    try {
      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      return (result.issues || []).map((issue: any) => ({
        type: 'phrasing',
        severity: issue.severity,
        description: issue.description,
        suggestion: issue.suggestion
      }));
    } catch (error) {
      console.error('Error parsing phrasing check:', error);
      return [];
    }
  }

  private calculateToneAdherence(content: string, fingerprint: ToneFingerprint): number {
    // Calculate adherence to voice characteristics
    const characteristics = Object.entries(fingerprint.voice_characteristics);
    const adherenceScores = characteristics.map(([trait, target]) => {
      const actual = this.measureToneTrait(content, trait);
      return 1 - Math.abs(target - actual);
    });

    return adherenceScores.reduce((sum, score) => sum + score, 0) / characteristics.length;
  }

  private measureToneTrait(content: string, trait: string): number {
    // Simple trait measurement based on keyword presence
    const traitMarkers: Record<string, RegExp[]> = {
      formality: [
        /\b(?:please|kindly|would you|might|shall)\b/gi,
        /\b(?:hey|yeah|gonna|wanna)\b/gi
      ],
      technical: [
        /\b(?:specifically|furthermore|moreover|therefore)\b/gi,
        /\b(?:technical|specification|process|system)\b/gi
      ],
      persuasive: [
        /\b(?:must|need|essential|crucial|vital)\b/gi,
        /\b(?:best|perfect|ideal|excellent)\b/gi
      ],
      emotion: [
        /\b(?:love|hate|amazing|terrible|exciting)\b/gi,
        /\b(?:feel|emotion|experience|sensation)\b/gi
      ]
    };

    const markers = traitMarkers[trait] || [];
    const matches = markers.reduce((sum, pattern) => {
      return sum + (content.match(pattern) || []).length;
    }, 0);

    return Math.min(matches / 5, 1); // Normalize to 0-1
  }

  private calculateEmotionalAlignment(content: string, fingerprint: ToneFingerprint): number {
    let alignmentScore = 0;
    const totalMarkers = Object.values(fingerprint.emotional_markers).flat().length;

    // Check positive markers
    const positiveMatches = fingerprint.emotional_markers.positive.filter(
      marker => content.toLowerCase().includes(marker.toLowerCase())
    ).length;

    // Check negative markers
    const negativeMatches = fingerprint.emotional_markers.negative.filter(
      marker => content.toLowerCase().includes(marker.toLowerCase())
    ).length;

    // Check neutral markers
    const neutralMatches = fingerprint.emotional_markers.neutral.filter(
      marker => content.toLowerCase().includes(marker.toLowerCase())
    ).length;

    return (positiveMatches + negativeMatches + neutralMatches) / totalMarkers;
  }

  private calculatePhrasingConsistency(content: string, fingerprint: ToneFingerprint): number {
    let consistencyScore = 0;

    // Check key phrase usage
    const keyPhraseScore = fingerprint.key_phrases.reduce((score, phrase) => {
      return score + (content.toLowerCase().includes(phrase.toLowerCase()) ? 1 : 0);
    }, 0) / fingerprint.key_phrases.length;

    // Check avoided terms (inverse score)
    const avoidedTermScore = 1 - (fingerprint.avoided_terms.reduce((count, term) => {
      return count + (content.toLowerCase().includes(term.toLowerCase()) ? 1 : 0);
    }, 0) / fingerprint.avoided_terms.length);

    // Check sentence length preference
    const avgSentenceLength = this.calculateAverageSentenceLength(content);
    const sentenceLengthScore = this.scoreSentenceLength(
      avgSentenceLength,
      fingerprint.style_preferences.sentence_length
    );

    return (keyPhraseScore + avoidedTermScore + sentenceLengthScore) / 3;
  }

  private calculateAverageSentenceLength(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(Boolean);
    const wordCount = sentences.reduce((count, sentence) => {
      return count + sentence.trim().split(/\s+/).length;
    }, 0);

    return wordCount / sentences.length;
  }

  private scoreSentenceLength(average: number, preference: string): number {
    const targets = {
      short: 15,
      medium: 25,
      long: 35
    };

    const target = targets[preference as keyof typeof targets];
    const difference = Math.abs(average - target);
    
    return Math.max(0, 1 - (difference / target));
  }

  private calculateOverallMatch(metrics: ToneAnalysis['metrics']): {
    matches: boolean;
    confidence: number;
  } {
    const weights = {
      tone_adherence: 0.4,
      emotional_alignment: 0.3,
      phrasing_consistency: 0.3
    };

    const weightedScore = Object.entries(metrics).reduce((score, [metric, value]) => {
      return score + value * weights[metric as keyof typeof weights];
    }, 0);

    return {
      matches: weightedScore >= 0.7,
      confidence: weightedScore
    };
  }

  private async logToneDeviation(check: ContentCheck, analysis: ToneAnalysis): Promise<void> {
    await this.evolutionLogger.logEvolution(check.brand_id, {
      type: 'PROMPT_PERFORMANCE',
      trigger: {
        source: 'tone_guard',
        action: 'content_check',
        metadata: {
          content_type: check.content_type,
          context: check.context
        }
      },
      changes: {
        before: { tone: 'original' },
        after: { tone: 'deviated', issues: analysis.issues },
        impact_areas: ['brand_voice', 'content_quality']
      },
      metrics: {
        performance_delta: analysis.metrics.tone_adherence - 1,
        confidence_score: analysis.confidence_score,
        sample_size: 1
      }
    });

    // Store deviation in brand DNA
    await db.brands.update(check.brand_id, {
      tone_monitoring: {
        last_deviation: {
          content_type: check.content_type,
          content: check.content,
          analysis: {
            issues: analysis.issues,
            metrics: analysis.metrics
          },
          requires_review: analysis.issues.some(i => i.severity === 'high'),
          created_at: new Date()
        }
      }
    });
  }
} 