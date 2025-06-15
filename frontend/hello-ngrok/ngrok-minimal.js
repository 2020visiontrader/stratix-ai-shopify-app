const ngrok = require('@ngrok/ngrok');

// Create ngrok tunnel for minimal OAuth test on port 3005
async function createMinimalTunnel() {
  try {
    console.log('🚀 Creating ngrok tunnel for minimal OAuth test on port 3005...');
    
    const listener = await ngrok.connect({ 
      addr: 3005, 
      authtoken_from_env: true 
    });
    
    const url = listener.url();
    console.log(`✅ Minimal OAuth ngrok tunnel established at: ${url}`);
    console.log(`🧪 Test your minimal OAuth at: ${url}`);
    console.log(`❤️ Health check: ${url}/health`);
    console.log(`🚀 Start OAuth: ${url}/start-oauth?shop=teststratix.myshopify.com`);
    
    console.log(`\n📋 Partner Dashboard Configuration:`);
    console.log(`   App URL: ${url}`);
    console.log(`   Redirect URL: ${url}/oauth-callback`);
    
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
createMinimalTunnel();
