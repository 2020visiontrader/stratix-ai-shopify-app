import { Router } from 'express';
import { z } from 'zod';
import { BrandDNAAnalyzer } from '../../core/intelligence/brand/BrandDNAAnalyzer';
import { ShopifyRequest, verifyShopifySession } from '../middleware/shopify-auth';
import { validateRequest } from '../middleware/validation';

const router = Router();
const brandAnalyzer = BrandDNAAnalyzer.getInstance();

// Request validation schemas
const createBrandSchema = z.object({
  body: z.object({
    name: z.string(),
    industry: z.string(),
    shopifyData: z.object({
      shop: z.string(),
      storeName: z.string(),
      primaryDomain: z.string(),
      plan: z.string(),
      customerEmail: z.string().email(),
      shopOwner: z.string()
    })
  })
});

const updateBrandSchema = z.object({
  params: z.object({
    brandId: z.string().uuid()
  }),
  body: z.object({
    name: z.string().optional(),
    industry: z.string().optional(),
    target_audience: z.array(z.string()).optional(),
    brand_voice: z.object({
      tone: z.string(),
      style: z.string(),
      keywords: z.array(z.string())
    }).optional(),
    visual_identity: z.object({
      colors: z.array(z.string()),
      typography: z.array(z.string()),
      imagery: z.array(z.string())
    }).optional(),
    marketing_strategy: z.object({
      objectives: z.array(z.string()),
      channels: z.array(z.string()),
      key_messages: z.array(z.string())
    }).optional()
  })
});

// Routes
router.post(
  '/',
  verifyShopifySession,
  validateRequest(createBrandSchema),
  async (req: ShopifyRequest, res, next) => {
    try {
      const { name, industry, shopifyData } = req.body;

      // Analyze shop data to create initial brand profile
      const analysisResult = await brandAnalyzer.analyzeBrandDocument(
        JSON.stringify({
          shopName: shopifyData.storeName,
          domain: shopifyData.primaryDomain,
          plan: shopifyData.plan,
          owner: shopifyData.shopOwner,
          // Add more shop data as needed
        })
      );

      const brand = await brandAnalyzer.createBrandProfile(name, {
        industry,
        analysisResult
      });

      // Store Shopify shop association (mock)
      console.log('Would store shop association:', {
        brand_id: brand.brandId || Date.now().toString(),
        shop_domain: shopifyData.shop,
        store_name: shopifyData.storeName,
        shop_owner: shopifyData.shopOwner,
        email: shopifyData.customerEmail,
        plan: shopifyData.plan
      });

      // Add 'id' property for frontend compatibility
      const brandWithId = { ...brand, id: brand.brandId || Date.now().toString() };
      
      res.status(201).json(brandWithId);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/',
  verifyShopifySession,
  async (req: ShopifyRequest, res, next) => {
    try {
      if (!req.shopDomain) {
        res.status(400).json({ error: 'Shop domain is required' });
        return;
      }

      // Get brand associated with the Shopify shop (mock)
      const mockShopData = { brand_id: req.shopDomain || 'mock-brand' };

      const brand = await brandAnalyzer.getBrandProfile(mockShopData.brand_id);
      res.json(brand);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:brandId',
  verifyShopifySession,
  validateRequest(updateBrandSchema),
  async (req: ShopifyRequest, res, next) => {
    try {
      const { brandId } = req.params;
      const updates = req.body;

      // Verify shop has access to this brand (mock)
      const mockShopData = { brand_id: brandId };

      const brand = await brandAnalyzer.updateBrandProfile(brandId, updates);
      res.json(brand);
    } catch (error) {
      next(error);
    }
  }
);

export default router; 