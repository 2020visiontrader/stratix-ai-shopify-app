import { Router } from 'express';
import { shopifyClient } from '../../../lib/shopify';
import type { ContentBackup, StoreRevision } from '../../../lib/supabase';
import { db } from '../../../lib/supabase';

const router = Router();

interface ShopifyRewritePayload {
  content_type: StoreRevision['content_type'];
  shop_id: string;
  resource_id: string;
  content: Record<string, any>;
}

async function createBackup(shopId: string, contentType: ContentBackup['content_type'], resourceId: string, content: Record<string, any>) {
  await db.content_backups.create({
    shop_id: shopId,
    content_type: contentType,
    resource_id: resourceId,
    original_content: content
  });
}

async function getShopifyContent(client: any, contentType: ContentBackup['content_type'], resourceId: string) {
  switch (contentType) {
    case 'product':
      return client.product.get(resourceId);
    case 'collection':
      return client.customCollection.get(resourceId);
    case 'page':
      return client.page.get(resourceId);
    default:
      throw new Error(`Invalid content type: ${contentType}`);
  }
}

async function updateShopifyContent(client: any, contentType: ContentBackup['content_type'], resourceId: string, content: Record<string, any>) {
  switch (contentType) {
    case 'product':
      return client.product.update(resourceId, content);
    case 'collection':
      return client.customCollection.update(resourceId, content);
    case 'page':
      return client.page.update(resourceId, content);
    default:
      throw new Error(`Invalid content type: ${contentType}`);
  }
}

router.post('/deploy', async (req, res) => {
  try {
    const { revision_id } = req.body;
    const { data: revision } = await db.store_revisions.getById(revision_id);
    if (!revision) {
      return res.status(404).json({ error: 'Revision not found' });
    }

    const { data: shop } = await db.shopify_shops.getById(revision.shop_id);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const client = await shopifyClient.forShop(shop.shop_domain);
    const currentContent = await getShopifyContent(client, revision.content_type, revision.resource_id);
    
    await createBackup(shop.id, revision.content_type, revision.resource_id, currentContent);
    await updateShopifyContent(client, revision.content_type, revision.resource_id, revision.optimized_content);
    
    await db.store_revisions.update(revision.id, { status: 'deployed' });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Deploy error:', error);
    res.status(500).json({ error: 'Failed to deploy content' });
  }
});

router.post('/revert', async (req, res) => {
  try {
    const { revision_id } = req.body;
    const { data: revision } = await db.store_revisions.getById(revision_id);
    if (!revision) {
      return res.status(404).json({ error: 'Revision not found' });
    }

    const { data: shop } = await db.shopify_shops.getById(revision.shop_id);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { data: backup } = await db.content_backups.getLatest(
      shop.id,
      revision.content_type,
      revision.resource_id
    );
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    const client = await shopifyClient.forShop(shop.shop_domain);
    await updateShopifyContent(client, revision.content_type, revision.resource_id, backup.original_content);
    
    await db.store_revisions.update(revision.id, { status: 'reverted' });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Revert error:', error);
    res.status(500).json({ error: 'Failed to revert content' });
  }
});

export default router; 