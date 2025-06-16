import { OptimizationSuggestion } from '../core/LandingPageOptimizer';
import { supabase } from '../lib/supabase';
import { AppError } from '../utils/errorHandling';

interface PerformanceLog {
  timestamp: Date;
  metrics: {
    bounceRate: number;
    avgScrollDepth: number;
    ctaClickRate: number;
    avgSessionTime: number;
    sampleSize: number;
  };
  insights: string[];
}

export class StorageService {
  private static instance: StorageService;
  private readonly bucketName: string = 'stratix-files';

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public async storePerformanceLog(
    brandId: string,
    pageId: string,
    log: PerformanceLog
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('landing_page_performance')
        .insert({
          brand_id: brandId,
          page_id: pageId,
          timestamp: log.timestamp,
          metrics: log.metrics,
          insights: log.insights
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error storing performance log:', error);
      throw error;
    }
  }

  public async storeOptimizationSuggestion(
    brandId: string,
    pageId: string,
    suggestion: OptimizationSuggestion
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('landing_page_optimizations')
        .insert({
          brand_id: brandId,
          page_id: pageId,
          timestamp: new Date(),
          section: suggestion.section,
          current_content: suggestion.currentContent,
          suggested_content: suggestion.suggestedContent,
          expected_improvement: suggestion.expectedImprovement,
          confidence: suggestion.confidence,
          reasoning: suggestion.reasoning,
          status: 'pending'
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error storing optimization suggestion:', error);
      throw error;
    }
  }

  public async getPerformanceHistory(
    brandId: string,
    pageId: string,
    limit: number = 30
  ): Promise<PerformanceLog[]> {
    try {
      const { data, error } = await supabase
        .from('landing_page_performance')
        .select('*')
        .eq('brand_id', brandId)
        .eq('page_id', pageId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching performance history:', error);
      throw error;
    }
  }

  public async getPendingOptimizations(
    brandId: string,
    pageId?: string
  ): Promise<Array<OptimizationSuggestion & { id: string; page_id: string }>> {
    try {
      let query = supabase
        .from('landing_page_optimizations')
        .select('*')
        .eq('brand_id', brandId)
        .eq('status', 'pending');

      if (pageId) {
        query = query.eq('page_id', pageId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        page_id: row.page_id,
        section: row.section,
        currentContent: row.current_content,
        suggestedContent: row.suggested_content,
        expectedImprovement: row.expected_improvement,
        confidence: row.confidence,
        reasoning: row.reasoning
      }));

    } catch (error) {
      console.error('Error fetching pending optimizations:', error);
      throw error;
    }
  }

  public async updateOptimizationStatus(
    optimizationId: string,
    status: 'approved' | 'rejected',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('landing_page_optimizations')
        .update({
          status,
          updated_at: new Date(),
          metadata
        })
        .eq('id', optimizationId);

      if (error) throw error;

    } catch (error) {
      console.error('Error updating optimization status:', error);
      throw error;
    }
  }

  public async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string
  ): Promise<{ path: string; url: string }> {
    try {
      const filePath = `${Date.now()}-${fileName}`;

      const { error } = await supabase
        .storage
        .from(this.bucketName)
        .upload(filePath, file, {
          contentType,
          upsert: false
        });

      if (error) throw error;

      const { data } = supabase
        .storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        path: filePath,
        url: data.publicUrl
      };
    } catch (error) {
      throw new AppError(
        'Failed to upload file',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await supabase
        .storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      throw new AppError(
        'Failed to delete file',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public async getFileUrl(filePath: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      if (error) throw error;

      return data.publicUrl;
    } catch (error) {
      throw new AppError(
        'Failed to get file URL',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public async listFiles(
    prefix?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ name: string; url: string }[]> {
    try {
      let query = supabase
        .storage
        .from(this.bucketName)
        .list(prefix || '', {
          limit,
          offset,
          sortBy: { column: 'name', order: 'asc' }
        });

      const { data, error } = await query;

      if (error) throw error;

      const files = await Promise.all(
        data.map(async (file) => ({
          name: file.name,
          url: await this.getFileUrl(file.name)
        }))
      );

      return files;
    } catch (error) {
      throw new AppError(
        'Failed to list files',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public async createSignedUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;

      return data.signedUrl;
    } catch (error) {
      throw new AppError(
        'Failed to create signed URL',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }
} 