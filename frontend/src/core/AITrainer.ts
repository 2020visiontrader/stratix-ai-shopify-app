import { OpenAIClient } from '@/lib/openai';
import { AppError } from '@/utils/errorHandling';

interface TrainingData {
  id: string;
  input: string;
  output: string;
  category: string;
  quality: number;
  timestamp: Date;
}

interface TrainingResult {
  modelId: string;
  accuracy: number;
  loss: number;
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
  };
  timestamp: Date;
}

interface ModelConfig {
  id: string;
  name: string;
  type: 'classification' | 'regression' | 'generation';
  parameters: Record<string, any>;
  version: string;
}

export class AITrainer {
  private static instance: AITrainer;
  private readonly openai: OpenAIClient;
  private trainingData: Map<string, TrainingData>;
  private trainingResults: Map<string, TrainingResult>;
  private modelConfigs: Map<string, ModelConfig>;

  private constructor() {
    this.openai = OpenAIClient.getInstance();
    this.trainingData = new Map();
    this.trainingResults = new Map();
    this.modelConfigs = new Map();
    this.initializeDefaultConfigs();
  }

  public static getInstance(): AITrainer {
    if (!AITrainer.instance) {
      AITrainer.instance = new AITrainer();
    }
    return AITrainer.instance;
  }

  private initializeDefaultConfigs(): void {
    const defaultConfigs: ModelConfig[] = [
      {
        id: 'content-classifier',
        name: 'Content Classifier',
        type: 'classification',
        parameters: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 100
        },
        version: '1.0.0'
      },
      {
        id: 'sentiment-analyzer',
        name: 'Sentiment Analyzer',
        type: 'regression',
        parameters: {
          model: 'gpt-4',
          temperature: 0.3,
          maxTokens: 50
        },
        version: '1.0.0'
      }
    ];

    defaultConfigs.forEach(config => {
      this.modelConfigs.set(config.id, config);
    });
  }

  public async addTrainingData(data: Omit<TrainingData, 'id' | 'timestamp'>): Promise<TrainingData> {
    try {
      const id = crypto.randomUUID();
      const newData: TrainingData = {
        id,
        ...data,
        timestamp: new Date()
      };

      this.trainingData.set(id, newData);
      return newData;
    } catch (error) {
      throw new AppError(
        'Failed to add training data',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public async trainModel(
    modelId: string,
    dataIds: string[]
  ): Promise<TrainingResult> {
    try {
      const config = this.modelConfigs.get(modelId);
      if (!config) {
        throw new AppError('Model configuration not found', 404);
      }

      const trainingData = dataIds.map(id => this.trainingData.get(id)).filter(Boolean) as TrainingData[];
      if (trainingData.length === 0) {
        throw new AppError('No training data provided', 400);
      }

      // Prepare training data
      const preparedData = await this.prepareTrainingData(trainingData, config);

      // Train model
      const result = await this.executeTraining(preparedData, config);

      // Store result
      const trainingResult: TrainingResult = {
        modelId,
        ...result,
        timestamp: new Date()
      };

      this.trainingResults.set(crypto.randomUUID(), trainingResult);
      return trainingResult;
    } catch (error) {
      throw new AppError(
        'Failed to train model',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  private async prepareTrainingData(
    data: TrainingData[],
    config: ModelConfig
  ): Promise<any> {
    const prompt = `
      Prepare training data for ${config.name}:
      ${JSON.stringify(data, null, 2)}

      Format the data according to the model type: ${config.type}
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
      throw new AppError('Failed to parse prepared training data', 500);
    }
  }

  private async executeTraining(
    data: any,
    config: ModelConfig
  ): Promise<Omit<TrainingResult, 'modelId' | 'timestamp'>> {
    const prompt = `
      Train model with the following configuration and data:
      Config: ${JSON.stringify(config, null, 2)}
      Data: ${JSON.stringify(data, null, 2)}

      Provide training results including accuracy, loss, and metrics.
    `;

    const response = await this.openai.createCompletion({
      model: 'gpt-4',
      prompt,
      maxTokens: 300,
      temperature: 0.7
    });

    try {
      return JSON.parse(response);
    } catch (error) {
      throw new AppError('Failed to parse training results', 500);
    }
  }

  public async evaluateModel(
    modelId: string,
    testDataIds: string[]
  ): Promise<TrainingResult> {
    try {
      const config = this.modelConfigs.get(modelId);
      if (!config) {
        throw new AppError('Model configuration not found', 404);
      }

      const testData = testDataIds.map(id => this.trainingData.get(id)).filter(Boolean) as TrainingData[];
      if (testData.length === 0) {
        throw new AppError('No test data provided', 400);
      }

      // Prepare test data
      const preparedData = await this.prepareTrainingData(testData, config);

      // Evaluate model
      const result = await this.executeTraining(preparedData, config);

      // Store result
      const evaluationResult: TrainingResult = {
        modelId,
        ...result,
        timestamp: new Date()
      };

      this.trainingResults.set(crypto.randomUUID(), evaluationResult);
      return evaluationResult;
    } catch (error) {
      throw new AppError(
        'Failed to evaluate model',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public getTrainingData(id: string): TrainingData {
    const data = this.trainingData.get(id);
    if (!data) {
      throw new AppError('Training data not found', 404);
    }
    return { ...data };
  }

  public getAllTrainingData(): TrainingData[] {
    return Array.from(this.trainingData.values());
  }

  public getTrainingDataByCategory(category: string): TrainingData[] {
    return this.getAllTrainingData().filter(data => data.category === category);
  }

  public getTrainingResult(id: string): TrainingResult {
    const result = this.trainingResults.get(id);
    if (!result) {
      throw new AppError('Training result not found', 404);
    }
    return { ...result };
  }

  public getAllTrainingResults(): TrainingResult[] {
    return Array.from(this.trainingResults.values());
  }

  public getModelConfig(id: string): ModelConfig {
    const config = this.modelConfigs.get(id);
    if (!config) {
      throw new AppError('Model configuration not found', 404);
    }
    return { ...config };
  }

  public getAllModelConfigs(): ModelConfig[] {
    return Array.from(this.modelConfigs.values());
  }

  public async addModelConfig(config: Omit<ModelConfig, 'id'>): Promise<ModelConfig> {
    const id = crypto.randomUUID();
    const newConfig: ModelConfig = {
      id,
      ...config
    };

    this.modelConfigs.set(id, newConfig);
    return newConfig;
  }
} 