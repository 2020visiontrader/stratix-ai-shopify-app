import { Shopify } from '@shopify/shopify-api';

interface PageSection {
  id: string;
  type: 'headline' | 'value_prop' | 'hero_image' | 'cta';
  content: string;
  metadata?: Record<string, any>;
}

export class ShopifyContentManager {
  private static instance: ShopifyContentManager;
  private shopify: Shopify;

  private constructor() {
    this.shopify = new Shopify({
      apiKey: process.env.SHOPIFY_API_KEY || '',
      apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
      scopes: ['write_content'],
      hostName: process.env.SHOPIFY_SHOP_URL || ''
    });
  }

  public static getInstance(): ShopifyContentManager {
    if (!ShopifyContentManager.instance) {
      ShopifyContentManager.instance = new ShopifyContentManager();
    }
    return ShopifyContentManager.instance;
  }

  public async getPageContent(
    pageId: string,
    section: string
  ): Promise<string> {
    try {
      // Get page sections from Shopify
      const response = await this.shopify.get(
        `/admin/api/2024-01/pages/${pageId}/sections.json`
      );
      const sections = response.body.sections as PageSection[];

      // Find the requested section
      const targetSection = sections.find(s => s.type === section);
      if (!targetSection) {
        throw new Error(`Section ${section} not found on page ${pageId}`);
      }

      return targetSection.content;

    } catch (error) {
      console.error('Error fetching page content:', error);
      throw error;
    }
  }

  public async updatePageContent(
    pageId: string,
    section: string,
    content: string
  ): Promise<void> {
    try {
      // Get section ID first
      const response = await this.shopify.get(
        `/admin/api/2024-01/pages/${pageId}/sections.json`
      );
      const sections = response.body.sections as PageSection[];
      const targetSection = sections.find(s => s.type === section);

      if (!targetSection) {
        throw new Error(`Section ${section} not found on page ${pageId}`);
      }

      // Update the section content
      await this.shopify.put(
        `/admin/api/2024-01/pages/${pageId}/sections/${targetSection.id}.json`,
        {
          section: {
            content,
            metadata: {
              last_updated: new Date().toISOString(),
              updated_by: 'landing_page_optimizer'
            }
          }
        }
      );

    } catch (error) {
      console.error('Error updating page content:', error);
      throw error;
    }
  }

  public async createBackup(
    pageId: string,
    sections: PageSection[]
  ): Promise<string> {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        page_id: pageId,
        sections: sections.map(section => ({
          type: section.type,
          content: section.content,
          metadata: section.metadata
        }))
      };

      // Store backup in Shopify metafields
      const response = await this.shopify.post(
        `/admin/api/2024-01/pages/${pageId}/metafields.json`,
        {
          metafield: {
            namespace: 'landing_page_optimizer',
            key: `backup_${Date.now()}`,
            value: JSON.stringify(backup),
            type: 'json'
          }
        }
      );

      return response.body.metafield.id;

    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  public async restoreFromBackup(
    pageId: string,
    backupId: string
  ): Promise<void> {
    try {
      // Get backup data from metafield
      const response = await this.shopify.get(
        `/admin/api/2024-01/pages/${pageId}/metafields/${backupId}.json`
      );
      
      const backup = JSON.parse(response.body.metafield.value);

      // Restore each section
      for (const section of backup.sections) {
        await this.updatePageContent(pageId, section.type, section.content);
      }

    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw error;
    }
  }
} 