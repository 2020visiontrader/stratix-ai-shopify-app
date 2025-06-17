import crypto from 'crypto';
import express from 'express';
import { DatabaseService } from '../../services/DatabaseService.js';

const router = express.Router();
const dbService = new DatabaseService();

// Middleware to verify Shopify webhooks
const verifyShopifyWebhook = (req, res, next) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const body = req.body;
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  if (hash !== hmac) {
    console.error('Webhook verification failed');
    return res.status(401).send('Unauthorized');
  }

  next();
};

// Raw body middleware for webhook verification
router.use(express.raw({ type: 'application/json' }));

// Orders create webhook
router.post('/orders/create', verifyShopifyWebhook, async (req, res) => {
  try {
    const order = JSON.parse(req.body.toString());
    
    // Store webhook event
    await dbService.createWebhookEvent({
      shopId: req.headers['x-shopify-shop-domain'],
      topic: 'orders/create',
      payload: order,
      status: 'PENDING'
    });

    // Process order data for analytics
    await processOrderAnalytics(order);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Orders create webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Orders paid webhook
router.post('/orders/paid', verifyShopifyWebhook, async (req, res) => {
  try {
    const order = JSON.parse(req.body.toString());
    
    await dbService.createWebhookEvent({
      shopId: req.headers['x-shopify-shop-domain'],
      topic: 'orders/paid',
      payload: order,
      status: 'PENDING'
    });

    await processOrderPaidAnalytics(order);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Orders paid webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Products create webhook
router.post('/products/create', verifyShopifyWebhook, async (req, res) => {
  try {
    const product = JSON.parse(req.body.toString());
    
    await dbService.createWebhookEvent({
      shopId: req.headers['x-shopify-shop-domain'],
      topic: 'products/create',
      payload: product,
      status: 'PENDING'
    });

    await processProductAnalytics(product);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Products create webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Products update webhook
router.post('/products/update', verifyShopifyWebhook, async (req, res) => {
  try {
    const product = JSON.parse(req.body.toString());
    
    await dbService.createWebhookEvent({
      shopId: req.headers['x-shopify-shop-domain'],
      topic: 'products/update',
      payload: product,
      status: 'PENDING'
    });

    await processProductUpdateAnalytics(product);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Products update webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Customers create webhook
router.post('/customers/create', verifyShopifyWebhook, async (req, res) => {
  try {
    const customer = JSON.parse(req.body.toString());
    
    await dbService.createWebhookEvent({
      shopId: req.headers['x-shopify-shop-domain'],
      topic: 'customers/create',
      payload: customer,
      status: 'PENDING'
    });

    await processCustomerAnalytics(customer);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Customers create webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// App uninstalled webhook
router.post('/app/uninstalled', verifyShopifyWebhook, async (req, res) => {
  try {
    const shop = JSON.parse(req.body.toString());
    
    await dbService.createWebhookEvent({
      shopId: shop.domain,
      topic: 'app/uninstalled',
      payload: shop,
      status: 'PENDING'
    });

    await processAppUninstall(shop);

    res.status(200).send('OK');
  } catch (error) {
    console.error('App uninstalled webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Process order analytics
async function processOrderAnalytics(order) {
  try {
    // Extract useful analytics data
    const analyticsData = {
      orderId: order.id,
      totalPrice: parseFloat(order.total_price),
      currency: order.currency,
      itemCount: order.line_items.length,
      customerEmail: order.email,
      createdAt: new Date(order.created_at),
      tags: order.tags?.split(',') || [],
      referralSource: order.referring_site,
      landingPage: order.landing_site,
      customerType: order.customer?.orders_count > 1 ? 'returning' : 'new'
    };

    // Store analytics data
    await dbService.trackUsage(null, 'order_created', analyticsData);

    // Trigger any automated analysis if needed
    await triggerAutomatedAnalysis(order);

  } catch (error) {
    console.error('Process order analytics error:', error);
  }
}

// Process order paid analytics
async function processOrderPaidAnalytics(order) {
  try {
    const conversionData = {
      orderId: order.id,
      conversionValue: parseFloat(order.total_price),
      paymentGateway: order.gateway,
      processingMethod: order.processing_method,
      timeToPayment: calculateTimeToPayment(order),
      customerSegment: determineCustomerSegment(order)
    };

    await dbService.trackUsage(null, 'order_paid', conversionData);

  } catch (error) {
    console.error('Process order paid analytics error:', error);
  }
}

// Process product analytics
async function processProductAnalytics(product) {
  try {
    const productData = {
      productId: product.id,
      title: product.title,
      productType: product.product_type,
      vendor: product.vendor,
      tags: product.tags?.split(',') || [],
      variants: product.variants?.length || 0,
      images: product.images?.length || 0,
      hasDescription: !!product.body_html,
      descriptionLength: product.body_html?.length || 0
    };

    await dbService.trackUsage(null, 'product_created', productData);

    // Trigger product content analysis
    if (product.body_html) {
      await triggerProductContentAnalysis(product);
    }

  } catch (error) {
    console.error('Process product analytics error:', error);
  }
}

// Process product update analytics
async function processProductUpdateAnalytics(product) {
  try {
    const updateData = {
      productId: product.id,
      updatedAt: new Date(product.updated_at),
      hasNewDescription: !!product.body_html,
      descriptionLength: product.body_html?.length || 0
    };

    await dbService.trackUsage(null, 'product_updated', updateData);

  } catch (error) {
    console.error('Process product update analytics error:', error);
  }
}

// Process customer analytics
async function processCustomerAnalytics(customer) {
  try {
    const customerData = {
      customerId: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      location: {
        country: customer.default_address?.country,
        province: customer.default_address?.province,
        city: customer.default_address?.city
      },
      acceptsMarketing: customer.accepts_marketing,
      totalSpent: parseFloat(customer.total_spent || '0'),
      ordersCount: customer.orders_count || 0
    };

    await dbService.trackUsage(null, 'customer_created', customerData);

  } catch (error) {
    console.error('Process customer analytics error:', error);
  }
}

// Process app uninstall
async function processAppUninstall(shop) {
  try {
    // Find user by shop domain
    const user = await dbService.getUserByShopDomain(shop.domain);
    
    if (user) {
      // Cancel any active subscriptions
      const subscription = await dbService.getActiveSubscription(user.id);
      if (subscription) {
        await dbService.updateSubscription(subscription.id, {
          status: 'CANCELED',
          canceledAt: new Date()
        });
      }

      // Deactivate trial
      const trial = await dbService.getActiveTrial(user.id);
      if (trial) {
        await dbService.updateTrialStatus(user.id, {
          isActive: false
        });
      }

      // Track uninstall
      await dbService.trackUsage(user.id, 'app_uninstalled', {
        shopDomain: shop.domain,
        reason: 'webhook_notification'
      });
    }

  } catch (error) {
    console.error('Process app uninstall error:', error);
  }
}

// Trigger automated analysis
async function triggerAutomatedAnalysis(order) {
  try {
    // Check if user has auto-analysis enabled
    const user = await findUserByShopDomain(order.name);
    if (!user) return;

    const settings = await dbService.getUserSettings(user.id);
    if (!settings.autoAnalysis) return;

    // Trigger analysis based on order data
    const orderContent = extractOrderContent(order);
    if (orderContent) {
      // Queue analysis job
      await queueAnalysisJob({
        userId: user.id,
        type: 'order_analysis',
        content: orderContent,
        metadata: {
          orderId: order.id,
          trigger: 'webhook_auto'
        }
      });
    }

  } catch (error) {
    console.error('Trigger automated analysis error:', error);
  }
}

// Trigger product content analysis
async function triggerProductContentAnalysis(product) {
  try {
    const user = await findUserByShopDomain(product.shop_domain);
    if (!user) return;

    const settings = await dbService.getUserSettings(user.id);
    if (!settings.autoAnalysis) return;

    // Queue product content analysis
    await queueAnalysisJob({
      userId: user.id,
      type: 'product_content_analysis',
      content: product.body_html,
      metadata: {
        productId: product.id,
        productTitle: product.title,
        trigger: 'webhook_auto'
      }
    });

  } catch (error) {
    console.error('Trigger product content analysis error:', error);
  }
}

// Helper functions
function calculateTimeToPayment(order) {
  const createdAt = new Date(order.created_at);
  const processedAt = new Date(order.processed_at || order.created_at);
  return Math.floor((processedAt - createdAt) / 1000); // seconds
}

function determineCustomerSegment(order) {
  const totalPrice = parseFloat(order.total_price);
  const ordersCount = order.customer?.orders_count || 0;

  if (ordersCount === 0) return 'first_time';
  if (ordersCount < 5) return 'occasional';
  if (totalPrice > 200) return 'high_value';
  return 'regular';
}

function extractOrderContent(order) {
  // Extract relevant content for analysis
  const content = [];
  
  if (order.note) content.push(order.note);
  
  order.line_items?.forEach(item => {
    if (item.title) content.push(item.title);
    if (item.variant_title) content.push(item.variant_title);
  });

  return content.join(' ').trim();
}

async function findUserByShopDomain(shopDomain) {
  try {
    return await dbService.getUserByShopDomain(shopDomain);
  } catch (error) {
    console.error('Find user by shop domain error:', error);
    return null;
  }
}

async function queueAnalysisJob(jobData) {
  // This would integrate with a job queue system like Bull/Redis
  // For now, we'll just log the job
  console.log('Queuing analysis job:', jobData);
  
  // In a real implementation, you would:
  // 1. Add job to queue
  // 2. Process asynchronously
  // 3. Store results in database
}

export default router;
