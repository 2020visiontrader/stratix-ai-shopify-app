const ngrok = require('@ngrok/ngrok');

// Create ngrok tunnel for Shopify app on port 3002
async function createShopifyTunnel() {
  try {
    console.log('🚀 Creating ngrok tunnel for Shopify app on port 3002...');

    const listener = await ngrok.connect({
      addr: 3002,
      authtoken_from_env: true
    });

    const url = listener.url();
    console.log(`✅ Shopify App ngrok tunnel established at: ${url}`);
    console.log(`🛍️ Use this URL in Shopify Partner Dashboard:`);
    console.log(`   App URL: ${url}`);
    console.log(`   Redirect URL: ${url}/api/auth/callback`);
    console.log(`   Webhook URLs:`);
    console.log(`     - Products: ${url}/webhooks/products/update`);
    console.log(`     - Orders: ${url}/webhooks/orders/create`);
    console.log(`     - Customers: ${url}/webhooks/customers/create`);
    console.log(`\n🧪 Test your app:`);
    console.log(`   Health Check: ${url}/health`);
    console.log(`   OAuth Test: ${url}/api/auth?shop=your-store.myshopify.com`);

    // Keep the tunnel alive
    console.log('\n⏳ Tunnel is running... Press Ctrl+C to stop');

    // Keep the process alive
    setInterval(() => {
      // Do nothing, just keep the process alive
    }, 1000);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down ngrok tunnel...');
      await listener.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down ngrok tunnel...');
      await listener.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error creating ngrok tunnel:', error);
    process.exit(1);
  }
}

// Start the tunnel
createShopifyTunnel();
