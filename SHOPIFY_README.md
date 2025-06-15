# Stratix AI Shopify App

AI-powered e-commerce optimization for Shopify stores.

## 🚀 Features

- **AI Product Optimization**: Automatically optimize product titles, descriptions, and metadata
- **Performance Analytics**: Real-time insights into store performance
- **A/B Testing**: Test different product variations with AI guidance
- **Conversion Optimization**: Improve checkout flow and user experience
- **Integration with Stratix AI**: Seamless connection to the main Stratix AI platform

## 🛠 Setup

### Prerequisites

- Node.js 18+
- Shopify Partner Account
- Ngrok (for local development)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Shopify app credentials
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Set up ngrok tunnel:**
   ```bash
   # In another terminal
   ngrok http 3000
   ```

### Environment Variables

```env
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.io
STRATIX_API_URL=http://localhost:3001
PORT=3000
```

## 📡 API Endpoints

### Authentication
- `GET /api/auth` - Start Shopify OAuth flow
- `GET /api/auth/callback` - OAuth callback

### Optimization
- `GET /api/stratix/optimize` - Optimize products with Stratix AI
- `POST /api/webhooks` - Handle Shopify webhooks

### Health Check
- `GET /health` - App health status

## 🔗 Integration with Stratix AI

This Shopify app integrates with the main Stratix AI platform:

1. **Product Data**: Fetches product information from Shopify
2. **AI Processing**: Sends data to Stratix AI for optimization
3. **Results**: Returns optimized content back to Shopify

## 🚀 Deployment

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform:**
   - Heroku
   - Vercel
   - Railway
   - DigitalOcean

3. **Update Shopify app settings:**
   - Set production URL in Partner Dashboard
   - Configure webhooks
   - Update OAuth redirect URLs

## 📝 Development

- `npm run dev` - Start development server with hot reload
- `npm run start` - Start production server
- `npm run test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Powered by Stratix AI** 🤖✨
