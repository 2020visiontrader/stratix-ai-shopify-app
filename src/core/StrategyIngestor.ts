import OpenAI from 'openai';
import { PDFDocument } from 'pdf-lib';
import { db } from '../lib/supabase';
import { AIEvolutionLogger } from './AIEvolutionLogger';
import { PromptComposer } from './PromptComposer';

interface StrategySection {
  type: 'mission' | 'audience' | 'positioning' | 'tone' | 'other';
  content: string;
  confidence_score: number;
}

interface ExtractedStrategy {
  sections: StrategySection[];
  raw_text: string;
  metadata: {
    page_count: number;
    word_count: number;
    extraction_date: Date;
  };
}

export class StrategyIngestor {
  private static instance: StrategyIngestor;
  private evolutionLogger: AIEvolutionLogger;
  private promptComposer: PromptComposer;
  private openai: OpenAI;
  
  private constructor() {
    this.evolutionLogger = AIEvolutionLogger.getInstance();
    this.promptComposer = PromptComposer.getInstance();
    this.openai = new OpenAI();
  }

  public static getInstance(): StrategyIngestor {
    if (!StrategyIngestor.instance) {
      StrategyIngestor.instance = new StrategyIngestor();
    }
    return StrategyIngestor.instance;
  }

  public async processStrategyPDF(
    brandId: string,
    pdfBuffer: Buffer
  ): Promise<void> {
    try {
      // Parse PDF
      const extractedContent = await this.extractPDFContent(pdfBuffer);

      // Classify sections
      const classifiedSections = await this.classifySections(extractedContent.raw_text);

      // Store extracted strategy
      await db.brand_strategies.upsert({
        brand_id: brandId,
        sections: classifiedSections,
        raw_content: extractedContent.raw_text,
        metadata: extractedContent.metadata,
        updated_at: new Date()
      });

      // Update brand DNA
      await this.updateBrandDNA(brandId, classifiedSections);

      // Trigger prompt composer update
      await this.promptComposer.updateFromStrategy(brandId, classifiedSections);

      // Log evolution
      await this.evolutionLogger.logEvolution(brandId, {
        type: 'STRATEGY_UPDATE',
        trigger: {
          source: 'strategy_ingestor',
          action: 'pdf_upload',
          metadata: extractedContent.metadata
        },
        changes: {
          before: { strategy: await this.getPreviousStrategy(brandId) },
          after: { strategy: classifiedSections },
          impact_areas: ['brand_voice', 'targeting', 'positioning']
        }
      });

    } catch (error) {
      console.error('Error processing strategy PDF:', error);
      throw error;
    }
  }

  private async extractPDFContent(pdfBuffer: Buffer): Promise<ExtractedStrategy> {
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    let rawText = '';

    // Extract text from each page
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const text = await page.getText();
      rawText += text + '\n';
    }

    return {
      sections: [],
      raw_text: rawText,
      metadata: {
        page_count: pageCount,
        word_count: rawText.split(/\s+/).length,
        extraction_date: new Date()
      }
    };
  }

  private async classifySections(text: string): Promise<StrategySection[]> {
    const sections: StrategySection[] = [];
    const paragraphs = text.split(/\n\n+/);

    for (const paragraph of paragraphs) {
      if (paragraph.trim().length < 50) continue; // Skip short paragraphs

      // Use OpenAI to classify section
      const classification = await this.classifyParagraph(paragraph);
      
      if (classification.type !== 'other' || classification.confidence_score > 0.8) {
        sections.push(classification);
      }
    }

    return sections;
  }

  private async classifyParagraph(text: string): Promise<StrategySection> {
    const prompt = `Classify the following text into one of these categories: mission, audience, positioning, tone, or other. Also provide a confidence score between 0 and 1.

Text: "${text.substring(0, 500)}..."

Respond in JSON format:
{
  "type": "category",
  "confidence": 0.0 to 1.0
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 100
    });

    try {
      const result = JSON.parse(response.choices[0].message.content);
      return {
        type: result.type as StrategySection['type'],
        content: text,
        confidence_score: result.confidence
      };
    } catch (error) {
      console.error('Error parsing classification response:', error);
      return {
        type: 'other',
        content: text,
        confidence_score: 0
      };
    }
  }

  private async updateBrandDNA(brandId: string, sections: StrategySection[]): Promise<void> {
    const dnaUpdates: Record<string, any> = {};

    // Map sections to DNA fields
    sections.forEach(section => {
      if (section.confidence_score < 0.7) return;

      switch (section.type) {
        case 'mission':
          dnaUpdates.mission_statement = section.content;
          break;
        case 'audience':
          dnaUpdates.target_audience = this.extractAudienceData(section.content);
          break;
        case 'positioning':
          dnaUpdates.market_position = this.extractPositioningData(section.content);
          break;
        case 'tone':
          dnaUpdates.tone_preferences = this.extractToneData(section.content);
          break;
      }
    });

    // Update brand DNA
    if (Object.keys(dnaUpdates).length > 0) {
      await db.brand_dna.update(brandId, {
        ...dnaUpdates,
        last_strategy_update: new Date()
      });
    }
  }

  private extractAudienceData(content: string): any {
    // Extract structured audience data
    // This would use more sophisticated NLP in production
    return {
      demographics: this.extractDemographics(content),
      psychographics: this.extractPsychographics(content),
      pain_points: this.extractPainPoints(content)
    };
  }

  private extractPositioningData(content: string): any {
    return {
      unique_value_proposition: this.extractUVP(content),
      competitive_advantages: this.extractAdvantages(content),
      market_category: this.extractCategory(content)
    };
  }

  private extractToneData(content: string): any {
    return {
      primary_tone: this.identifyPrimaryTone(content),
      voice_characteristics: this.extractVoiceTraits(content),
      communication_style: this.extractCommStyle(content)
    };
  }

  private extractDemographics(text: string): string[] {
    const patterns = [
      /age[ds]?\s+\d+[-–]\d+/i,
      /\b(?:male|female|gender)\b/i,
      /\b(?:urban|rural|suburban)\b/i,
      /income\s+[\d,]+\+?/i
    ];

    return patterns.flatMap(pattern => {
      const matches = text.match(pattern) || [];
      return matches.map(m => m.trim());
    });
  }

  private extractPsychographics(text: string): string[] {
    const patterns = [
      /interests?\s+in\s+[^,.]+/i,
      /values?\s+[^,.]+/i,
      /lifestyle[s]?\s+[^,.]+/i
    ];

    return patterns.flatMap(pattern => {
      const matches = text.match(pattern) || [];
      return matches.map(m => m.trim());
    });
  }

  private extractPainPoints(text: string): string[] {
    const patterns = [
      /challenges?\s+[^,.]+/i,
      /problems?\s+[^,.]+/i,
      /struggles?\s+[^,.]+/i
    ];

    return patterns.flatMap(pattern => {
      const matches = text.match(pattern) || [];
      return matches.map(m => m.trim());
    });
  }

  private extractUVP(text: string): string {
    const uvpMatch = text.match(/unique(?:ly)?\s+[^.!?]+[.!?]/i);
    return uvpMatch ? uvpMatch[0].trim() : '';
  }

  private extractAdvantages(text: string): string[] {
    const advantages = text.match(/(?:advantage|better|best|unique|only)\s+[^.!?]+[.!?]/gi) || [];
    return advantages.map(a => a.trim());
  }

  private extractCategory(text: string): string {
    const categoryMatch = text.match(/(?:industry|market|category|sector)\s+[^.!?]+[.!?]/i);
    return categoryMatch ? categoryMatch[0].trim() : '';
  }

  private identifyPrimaryTone(text: string): string {
    const tonePatterns = {
      professional: /professional|formal|business/i,
      casual: /casual|friendly|relaxed/i,
      authoritative: /authoritative|expert|leading/i,
      innovative: /innovative|cutting-edge|modern/i
    };

    let maxCount = 0;
    let primaryTone = 'neutral';

    for (const [tone, pattern] of Object.entries(tonePatterns)) {
      const count = (text.match(pattern) || []).length;
      if (count > maxCount) {
        maxCount = count;
        primaryTone = tone;
      }
    }

    return primaryTone;
  }

  private extractVoiceTraits(text: string): string[] {
    const traits = text.match(/(?:voice|tone|style)\s+is\s+[^.!?]+[.!?]/gi) || [];
    return traits.map(t => t.trim());
  }

  private extractCommStyle(text: string): string {
    const styleMatch = text.match(/communicate\s+[^.!?]+[.!?]/i);
    return styleMatch ? styleMatch[0].trim() : '';
  }

  private async getPreviousStrategy(brandId: string): Promise<StrategySection[]> {
    const { data: strategy } = await db.brand_strategies.getByBrandId(brandId);
    return strategy?.sections || [];
  }
} 