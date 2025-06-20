const ngrok = require('@ngrok/ngrok');

// Create ngrok tunnel for backend API server on port 3001
async function createBackendTunnel() {
  try {
    console.log('🚀 Creating ngrok tunnel for Stratix AI Backend API on port 3001...');

    const listener = await ngrok.connect({
      addr: 3001,
      authtoken_from_env: true
    });

    const url = listener.url();
    console.log(`✅ Backend API ngrok tunnel established at: ${url}`);
    console.log(`🔌 API Endpoints accessible at:`);
    console.log(`   Health Check: ${url}/health`);
    console.log(`   Analysis API: ${url}/api/analysis`);
    console.log(`   Brand DNA: ${url}/api/brands/{id}/dna`);
    console.log(`   Content Generation: ${url}/api/content/generate`);
    console.log(`   Performance Metrics: ${url}/api/performance/metrics`);
    console.log(`   Products: ${url}/api/products`);
    console.log(`   Security Scan: ${url}/api/security/scan`);
    console.log(`   Settings: ${url}/api/settings`);
    console.log(`   Trial Status: ${url}/api/trials/status`);
    
    console.log(`\n📋 Frontend Integration:`);
    console.log(`   Update your frontend API client to use: ${url}`);
    console.log(`   Or set NEXT_PUBLIC_API_URL=${url} in your .env.local`);

    console.log(`\n🧪 Test with curl:`);
    console.log(`   curl ${url}/health`);
    console.log(`   curl -X POST ${url}/api/analysis -H "Content-Type: application/json" -d '{"content":"test"}'`);

    // Write the URL to a file for easy access
    const fs = require('fs');
    fs.writeFileSync('.ngrok-url', url);
    console.log(`\n💾 URL saved to .ngrok-url file`);

    // Keep the tunnel alive
    console.log('\n⏳ Tunnel is running... Press Ctrl+C to stop');

    // Keep the process alive
    setInterval(() => {
      // Ping the health endpoint to keep the tunnel active
      // This is optional but helps with tunnel stability
    }, 30000);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down ngrok tunnel...');
      await listener.close();
      // Clean up the URL file
      try {
        fs.unlinkSync('.ngrok-url');
      } catch (e) {
        // Ignore if file doesn't exist
      }
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down ngrok tunnel...');
      await listener.close();
      // Clean up the URL file
      try {
        fs.unlinkSync('.ngrok-url');
      } catch (e) {
        // Ignore if file doesn't exist
      }
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error creating ngrok tunnel:', error);
    console.error('💡 Make sure your backend server is running on port 3001');
    console.error('💡 Check your ngrok auth token: ngrok config check');
    process.exit(1);
  }
}

// Start the tunnel
createBackendTunnel();
