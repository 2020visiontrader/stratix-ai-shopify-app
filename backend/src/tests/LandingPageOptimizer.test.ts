import { EvolutionLogger } from '../core/EvolutionLogger';
import { LandingPageOptimizer } from '../core/LandingPageOptimizer';
import { ShopifyAnalytics } from '../integrations/shopify/Analytics';
import { ShopifyContentManager } from '../integrations/shopify/ContentManager';
import { db } from '../lib/database';
import { StorageService } from '../services/StorageService';

// Mock dependencies
jest.mock('../integrations/shopify/Analytics');
jest.mock('../integrations/shopify/ContentManager');
jest.mock('../services/StorageService');
jest.mock('../core/EvolutionLogger');
jest.mock('../lib/supabase');
jest.mock('openai');

describe('LandingPageOptimizer', () => {
  let optimizer: LandingPageOptimizer;
  let mockAnalytics: jest.Mocked<ShopifyAnalytics>;
  let mockContentManager: jest.Mocked<ShopifyContentManager>;
  let mockStorage: jest.Mocked<StorageService>;
  let mockEvolutionLogger: jest.Mocked<EvolutionLogger>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Initialize mocked instances
    mockAnalytics = ShopifyAnalytics.getInstance() as jest.Mocked<ShopifyAnalytics>;
    mockContentManager = ShopifyContentManager.getInstance() as jest.Mocked<ShopifyContentManager>;
    mockStorage = StorageService.getInstance() as jest.Mocked<StorageService>;
    mockEvolutionLogger = EvolutionLogger.getInstance() as jest.Mocked<EvolutionLogger>;

    // Get optimizer instance
    optimizer = LandingPageOptimizer.getInstance();
  });

  describe('trackPagePerformance', () => {
    const mockMetrics = {
      bounceRate: 0.75,
      avgScrollDepth: 0.35,
      ctaClickRate: 0.015,
      avgSessionTime: 25,
      sampleSize: 1000
    };

    it('should track and store performance metrics', async () => {
      mockAnalytics.getPageMetrics.mockResolvedValue(mockMetrics);

      await optimizer.trackPagePerformance('brand123', 'page123');

      expect(mockAnalytics.getPageMetrics).toHaveBeenCalledWith('page123');
      expect(mockStorage.storePerformanceLog).toHaveBeenCalled();
    });

    it('should trigger optimization for poor performance', async () => {
      const poorMetrics = {
        ...mockMetrics,
        bounceRate: 0.85,
        ctaClickRate: 0.005
      };

      mockAnalytics.getPageMetrics.mockResolvedValue(poorMetrics);
      const spyTriggerOptimization = jest.spyOn(optimizer as any, 'triggerOptimization');

      await optimizer.trackPagePerformance('brand123', 'page123');

      expect(spyTriggerOptimization).toHaveBeenCalledWith('brand123', 'page123');
    });

    it('should handle analytics service failure', async () => {
      mockAnalytics.getPageMetrics.mockRejectedValue(new Error('Analytics service down'));

      await expect(optimizer.trackPagePerformance('brand123', 'page123'))
        .rejects
        .toThrow('Analytics service down');
    });
  });

  describe('analyzeSectionPerformance', () => {
    const mockSectionMetrics = {
      viewRate: 0.8,
      engagementRate: 0.6,
      conversionImpact: 0.4
    };

    it('should analyze all section types', async () => {
      mockAnalytics.getSectionMetrics.mockResolvedValue(mockSectionMetrics);

      const result = await optimizer.analyzeSectionPerformance('brand123', 'page123');

      expect(result).toHaveLength(4); // headline, value_prop, hero_image, cta
      expect(mockAnalytics.getSectionMetrics).toHaveBeenCalledTimes(4);
    });

    it('should sort sections by conversion impact', async () => {
      mockAnalytics.getSectionMetrics
        .mockResolvedValueOnce({ ...mockSectionMetrics, conversionImpact: 0.2 }) // headline
        .mockResolvedValueOnce({ ...mockSectionMetrics, conversionImpact: 0.8 }) // value_prop
        .mockResolvedValueOnce({ ...mockSectionMetrics, conversionImpact: 0.4 }) // hero_image
        .mockResolvedValueOnce({ ...mockSectionMetrics, conversionImpact: 0.6 }); // cta

      const result = await optimizer.analyzeSectionPerformance('brand123', 'page123');

      expect(result[0].section).toBe('value_prop');
      expect(result[1].section).toBe('cta');
      expect(result[2].section).toBe('hero_image');
      expect(result[3].section).toBe('headline');
    });
  });

  describe('generateOptimizations', () => {
    const mockBrand = {
      id: 'brand123',
      tier: 'enterprise',
      brand_voice: { tone: 'professional' },
      target_audience: { demographics: ['professionals'] }
    };

    const mockSections = [
      {
        section: 'headline' as const,
        metrics: {
          viewRate: 0.7,
          engagementRate: 0.3,
          conversionImpact: 0.2
        }
      }
    ];

    beforeEach(() => {
      (db.brands.getById as jest.Mock).mockResolvedValue({ data: mockBrand });
      mockContentManager.getPageContent.mockResolvedValue('Current content');
    });

    it('should generate suggestions for underperforming sections', async () => {
      const result = await optimizer.generateOptimizations('brand123', 'page123', mockSections);

      expect(result).toHaveLength(1);
      expect(result[0].section).toBe('headline');
      expect(result[0].currentContent).toBe('Current content');
      expect(mockContentManager.getPageContent).toHaveBeenCalledWith('page123', 'headline');
    });

    it('should handle missing brand data', async () => {
      (db.brands.getById as jest.Mock).mockResolvedValue({ data: null });

      await expect(optimizer.generateOptimizations('brand123', 'page123', mockSections))
        .rejects
        .toThrow('Brand not found');
    });
  });

  describe('applyOptimizations', () => {
    const mockBrand = {
      id: 'brand123',
      tier: 'enterprise'
    };

    const mockSuggestion = {
      id: 'suggestion-123',
      section: 'headline' as const,
      currentContent: 'Old headline',
      suggestedContent: 'New headline',
      reason: 'Better messaging',
      confidence: 0.8,
      impact: 'medium' as const,
      timestamp: new Date()
    };

    beforeEach(() => {
      (db.brands.getById as jest.Mock).mockResolvedValue({ data: mockBrand });
    });

    it('should auto-apply changes for enterprise tier', async () => {
      await optimizer.applyOptimizations('brand123', 'page123', [mockSuggestion], true);

      expect(mockContentManager.createBackup).toHaveBeenCalled();
      expect(mockContentManager.updatePageContent).toHaveBeenCalledWith(
        'page123',
        'headline',
        'New headline'
      );
      expect(mockEvolutionLogger.logEvolution).toHaveBeenCalled();
    });

    it('should store suggestions for manual approval in non-enterprise tier', async () => {
      (db.brands.getById as jest.Mock).mockResolvedValue({ 
        data: { ...mockBrand, tier: 'standard' } 
      });

      await optimizer.applyOptimizations('brand123', 'page123', [mockSuggestion], false);

      expect(mockContentManager.updatePageContent).not.toHaveBeenCalled();
      expect(mockStorage.storeOptimizationSuggestion).toHaveBeenCalledWith(
        'brand123',
        'page123',
        mockSuggestion
      );
    });

    it('should restore from backup on update failure', async () => {
      mockContentManager.updatePageContent.mockRejectedValue(new Error('Update failed'));

      await expect(optimizer.applyOptimizations('brand123', 'page123', [mockSuggestion], true))
        .rejects
        .toThrow('Update failed');

      expect(mockContentManager.restoreFromBackup).toHaveBeenCalled();
    });
  });
}); 