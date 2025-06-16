import { OpenAIClient } from '@/lib/openai';
import { AppError } from '@/utils/errorHandling';

interface ProcessedData {
  id: string;
  rawData: any;
  processedData: any;
  metadata: {
    type: string;
    size: number;
    format: string;
    timestamp: Date;
  };
}

interface ProcessingRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  isActive: boolean;
}

interface ProcessingResult {
  data: ProcessedData;
  appliedRules: string[];
  statistics: {
    processingTime: number;
    memoryUsage: number;
    successRate: number;
  };
}

export class DataProcessor {
  private static instance: DataProcessor;
  private readonly openai: OpenAIClient;
  private processedData: Map<string, ProcessedData>;
  private rules: Map<string, ProcessingRule>;

  private constructor() {
    this.openai = OpenAIClient.getInstance();
    this.processedData = new Map();
    this.rules = new Map();
    this.initializeDefaultRules();
  }

  public static getInstance(): DataProcessor {
    if (!DataProcessor.instance) {
      DataProcessor.instance = new DataProcessor();
    }
    return DataProcessor.instance;
  }

  private initializeDefaultRules(): void {
    const defaultRules: ProcessingRule[] = [
      {
        id: 'clean-text',
        name: 'Text Cleaning',
        condition: 'type === "text"',
        action: 'Remove special characters and normalize whitespace',
        priority: 1,
        isActive: true
      },
      {
        id: 'format-date',
        name: 'Date Formatting',
        condition: 'type === "date"',
        action: 'Convert to ISO format',
        priority: 2,
        isActive: true
      },
      {
        id: 'validate-number',
        name: 'Number Validation',
        condition: 'type === "number"',
        action: 'Validate and convert to float',
        priority: 3,
        isActive: true
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  public async processData(data: any, type: string): Promise<ProcessingResult> {
    try {
      const startTime = performance.now();
      const startMemory = process.memoryUsage().heapUsed;

      // Apply processing rules
      const appliedRules = await this.applyRules(data, type);

      // Process data
      const processedData = await this.executeProcessing(data, type, appliedRules);

      // Create processed data record
      const processedDataRecord: ProcessedData = {
        id: crypto.randomUUID(),
        rawData: data,
        processedData,
        metadata: {
          type,
          size: JSON.stringify(data).length,
          format: typeof data,
          timestamp: new Date()
        }
      };

      this.processedData.set(processedDataRecord.id, processedDataRecord);

      // Calculate statistics
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      const statistics = {
        processingTime: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        successRate: this.calculateSuccessRate(processedData)
      };

      return {
        data: processedDataRecord,
        appliedRules: appliedRules.map(rule => rule.name),
        statistics
      };
    } catch (error) {
      throw new AppError(
        'Failed to process data',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  private async applyRules(data: any, type: string): Promise<ProcessingRule[]> {
    return Array.from(this.rules.values())
      .filter(rule => rule.isActive)
      .filter(rule => this.evaluateRule(rule, data, type))
      .sort((a, b) => a.priority - b.priority);
  }

  private evaluateRule(rule: ProcessingRule, data: any, type: string): boolean {
    try {
      // Simple rule evaluation - in production, use a proper rule engine
      const condition = new Function('data', 'type', `return ${rule.condition}`)(data, type);
      return condition === true;
    } catch (error) {
      console.error(`Error evaluating rule: ${error}`);
      return false;
    }
  }

  private async executeProcessing(
    data: any,
    type: string,
    rules: ProcessingRule[]
  ): Promise<any> {
    const prompt = `
      Process the following data according to the rules:
      Data: ${JSON.stringify(data, null, 2)}
      Type: ${type}
      Rules: ${JSON.stringify(rules, null, 2)}

      Apply the rules in order and return the processed data.
    `;

    const response = await this.openai.createCompletion({
      model: 'gpt-4',
      prompt,
      maxTokens: 500,
      temperature: 0.7
    });

    try {
      return JSON.parse(response);
    } catch (error) {
      throw new AppError('Failed to parse processed data', 500);
    }
  }

  private calculateSuccessRate(processedData: any): number {
    // Simple success rate calculation - in production, use more sophisticated metrics
    if (!processedData) return 0;
    if (typeof processedData === 'object' && Object.keys(processedData).length === 0) return 0;
    return 1;
  }

  public getProcessedData(id: string): ProcessedData {
    const data = this.processedData.get(id);
    if (!data) {
      throw new AppError('Processed data not found', 404);
    }
    return { ...data };
  }

  public getAllProcessedData(): ProcessedData[] {
    return Array.from(this.processedData.values());
  }

  public getProcessedDataByType(type: string): ProcessedData[] {
    return this.getAllProcessedData().filter(data => data.metadata.type === type);
  }

  public async addRule(rule: Omit<ProcessingRule, 'id'>): Promise<ProcessingRule> {
    const id = crypto.randomUUID();
    const newRule: ProcessingRule = {
      id,
      ...rule
    };

    this.rules.set(id, newRule);
    return newRule;
  }

  public getRule(id: string): ProcessingRule {
    const rule = this.rules.get(id);
    if (!rule) {
      throw new AppError('Rule not found', 404);
    }
    return { ...rule };
  }

  public getAllRules(): ProcessingRule[] {
    return Array.from(this.rules.values());
  }

  public async batchProcess(dataArray: Array<{ data: any; type: string }>): Promise<ProcessingResult[]> {
    return Promise.all(dataArray.map(({ data, type }) => this.processData(data, type)));
  }

  public async validateData(data: any, type: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const prompt = `
      Validate the following data:
      Data: ${JSON.stringify(data, null, 2)}
      Type: ${type}

      Check for:
      1. Data type correctness
      2. Required fields
      3. Format compliance
      4. Value ranges
    `;

    const response = await this.openai.createCompletion({
      model: 'gpt-4',
      prompt,
      maxTokens: 300,
      temperature: 0.7
    });

    try {
      const result = JSON.parse(response);
      return {
        isValid: result.isValid,
        errors: result.errors || []
      };
    } catch (error) {
      throw new AppError('Failed to parse validation results', 500);
    }
  }
} 