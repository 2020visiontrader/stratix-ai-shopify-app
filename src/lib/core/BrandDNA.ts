import { NetworkManager } from '@/lib/core/NetworkManager';

export interface BrandVoice {
  tone: string[];
  personality: string[];
  keywords: string[];
  phrases: string[];
  doNotUse: string[];
}

export interface BrandVisuals {
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  typography: {
    headings: string[];
    body: string[];
    display: string[];
  };
  imagery: {
    style: string[];
    subjects: string[];
    composition: string[];
  };
  logo: {
    variations: string[];
    usage: string[];
    spacing: string[];
  };
}

export interface BrandGuidelines {
  id: string;
  name: string;
  description: string;
  voice: BrandVoice;
  visuals: BrandVisuals;
  values: string[];
  mission: string;
  vision: string;
  targetAudience: {
    demographics: Record<string, any>;
    psychographics: string[];
    behaviors: string[];
  };
  competitors: {
    direct: string[];
    indirect: string[];
    analysis: Record<string, any>;
  };
}

export interface BrandCheck {
  id: string;
  type: 'content' | 'design' | 'voice' | 'compliance';
  status: 'pass' | 'fail' | 'warning';
  score: number;
  details: {
    category: string;
    findings: {
      type: string;
      description: string;
      severity: 'high' | 'medium' | 'low';
      recommendation: string;
    }[];
  };
  timestamp: Date;
}

export class BrandDNA {
  private static instance: BrandDNA;
  private networkManager: NetworkManager;
  private guidelines: Map<string, BrandGuidelines> = new Map();
  private checks: Map<string, BrandCheck[]> = new Map();
  private lastUpdate: Date = new Date();

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
  }

  public static getInstance(): BrandDNA {
    if (!BrandDNA.instance) {
      BrandDNA.instance = new BrandDNA();
    }
    return BrandDNA.instance;
  }

  public async addGuidelines(guidelines: BrandGuidelines): Promise<void> {
    this.guidelines.set(guidelines.id, guidelines);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/brand/guidelines',
        data: guidelines,
        cache: false
      });
    } catch (error) {
      console.error('Failed to add brand guidelines:', error);
      throw error;
    }
  }

  public async updateGuidelines(
    id: string,
    updates: Partial<BrandGuidelines>
  ): Promise<void> {
    const guidelines = this.guidelines.get(id);
    if (!guidelines) {
      throw new Error(`Guidelines ${id} not found`);
    }

    Object.assign(guidelines, updates);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'PUT',
        url: `/api/brand/guidelines/${id}`,
        data: updates,
        cache: false
      });
    } catch (error) {
      console.error('Failed to update brand guidelines:', error);
      throw error;
    }
  }

  public async checkCompliance(
    content: string | Record<string, any>,
    type: BrandCheck['type']
  ): Promise<BrandCheck> {
    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: '/api/brand/check',
        data: { content, type },
        cache: false
      });

      const check = response.data as BrandCheck;
      if (!this.checks.has(check.id)) {
        this.checks.set(check.id, []);
      }
      this.checks.get(check.id)!.push(check);
      this.lastUpdate = new Date();

      return check;
    } catch (error) {
      console.error('Failed to check brand compliance:', error);
      throw error;
    }
  }

  public async analyzeConsistency(
    content: string | Record<string, any>[]
  ): Promise<{
    score: number;
    issues: {
      type: string;
      description: string;
      severity: 'high' | 'medium' | 'low';
      recommendation: string;
    }[];
  }> {
    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: '/api/brand/analyze',
        data: { content },
        cache: false
      });

      return response.data as {
        score: number;
        issues: {
          type: string;
          description: string;
          severity: 'high' | 'medium' | 'low';
          recommendation: string;
        }[];
      };
    } catch (error) {
      console.error('Failed to analyze brand consistency:', error);
      throw error;
    }
  }

  public async generateGuidelines(
    brandInfo: {
      name: string;
      description: string;
      values: string[];
      targetAudience: BrandGuidelines['targetAudience'];
    }
  ): Promise<BrandGuidelines> {
    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: '/api/brand/generate',
        data: brandInfo,
        cache: false
      });

      const guidelines = response.data as BrandGuidelines;
      this.guidelines.set(guidelines.id, guidelines);
      this.lastUpdate = new Date();

      return guidelines;
    } catch (error) {
      console.error('Failed to generate brand guidelines:', error);
      throw error;
    }
  }

  public getGuidelines(id: string): BrandGuidelines | undefined {
    return this.guidelines.get(id);
  }

  public getChecks(id: string): BrandCheck[] {
    return this.checks.get(id) || [];
  }

  public getLastUpdate(): Date {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const data = {
      guidelines: Array.from(this.guidelines.entries()),
      checks: Array.from(this.checks.entries()),
      lastUpdate: this.lastUpdate,
    };
    return JSON.stringify(data);
  }

  public async importData(dataJson: string): Promise<void> {
    const data = JSON.parse(dataJson);
    this.guidelines = new Map(data.guidelines);
    this.checks = new Map(data.checks);
    this.lastUpdate = new Date(data.lastUpdate);
  }
} 