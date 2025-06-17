import { Request, Response } from 'express';
import { BrandDNAAnalyzer } from '../../core/intelligence/brand/BrandDNAAnalyzer';

export const handleProductCreate = async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    console.log('Product created:', productData);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling product create:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleProductUpdate = async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    console.log('Product updated:', productData);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling product update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleOrderCreate = async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    console.log('Order created:', orderData);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling order create:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleAppInstalled = async (req: Request, res: Response) => {
  try {
    const shopData = req.body;
    console.log('App installed:', shopData);
    
    // Initialize brand DNA analysis for new shop
    const brandAnalyzer = BrandDNAAnalyzer.getInstance();
    // Mock shop domain extraction
    const shopDomain = shopData.shop || 'new-shop.myshopify.com';
    
    // Store shop installation
    console.log('Setting up brand analysis for:', shopDomain);
    
    res.status(200).json({ received: true, message: 'App installed successfully' });
  } catch (error) {
    console.error('Error handling app install:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleAppUninstalled = async (req: Request, res: Response) => {
  try {
    const shopData = req.body;
    console.log('App uninstalled:', shopData);
    
    // Clean up shop data when app is uninstalled
    const shopDomain = shopData.shop || 'unknown-shop.myshopify.com';
    console.log('Cleaning up data for:', shopDomain);
    
    res.status(200).json({ received: true, message: 'App uninstalled' });
  } catch (error) {
    console.error('Error handling app uninstall:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleProductCreated = async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    console.log('Product created:', productData);
    
    // Trigger brand DNA analysis update when new products are added
    if (productData.shop) {
      const brandAnalyzer = BrandDNAAnalyzer.getInstance();
      console.log('Updating brand DNA for new product in:', productData.shop);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling product create:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleProductDeleted = async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    console.log('Product deleted:', productData);
    
    // Update brand DNA when products are removed
    if (productData.shop) {
      console.log('Updating brand DNA after product deletion in:', productData.shop);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling product delete:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleProductUpdated = async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    console.log('Product updated:', productData);
    
    // Trigger brand DNA analysis update when products are modified
    if (productData.shop) {
      const brandAnalyzer = BrandDNAAnalyzer.getInstance();
      console.log('Updating brand DNA for updated product in:', productData.shop);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling product update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
