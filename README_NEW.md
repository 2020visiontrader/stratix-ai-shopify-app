# 🚀 Stratix AI - Shopify App

> **A powerful AI-powered e-commerce optimization platform for Shopify stores**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/stratix-ai/shopify-app)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-Commercial-red)](./LICENSE)

## 🎯 **Overview**

Stratix AI is an advanced e-commerce optimization platform that leverages artificial intelligence to enhance Shopify store performance. The platform provides comprehensive brand analysis, content optimization, performance monitoring, and automated insights to help merchants maximize their e-commerce success.

### **Key Features**
- 🤖 **AI-Powered Brand DNA Analysis** - Understand your brand's unique personality and strategy
- 📊 **Performance Optimization** - Real-time metrics and improvement recommendations
- ✍️ **Content Generation** - AI-driven content creation and optimization
- 🔒 **Security Monitoring** - Automated vulnerability scanning and alerts
- 📈 **Advanced Analytics** - Comprehensive reporting and insights
- 🛡️ **Enterprise Security** - Robust security middleware and data protection

---

## 🏗️ **Architecture**

```
stratix-ai-shopify-app/
├── 🎨 frontend/              # Next.js 14 Frontend Application
│   ├── src/
│   │   ├── components/       # React components with Tailwind CSS
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API client and utilities
│   │   ├── pages/           # Next.js pages and API routes
│   │   └── types/           # TypeScript definitions
│   ├── app/                 # App Router structure
│   └── package.json         # Frontend dependencies
├── ⚙️  backend/              # Express.js Backend API Server
│   ├── src/
│   │   ├── api/             # API routes and middleware
│   │   │   ├── routes/      # 11 comprehensive API endpoints
│   │   │   └── webhooks/    # Shopify webhook handlers
│   │   ├── core/            # AI intelligence modules
│   │   ├── lib/             # Database and Shopify clients
│   │   ├── services/        # Business logic services
│   │   ├── types/           # TypeScript definitions
│   │   └── utils/           # Utilities (email, errors, alerts)
│   └── package.json         # Backend dependencies
├── 🔗 shared/               # Shared TypeScript types and utilities
├── 🗄️  prisma/              # Database schema and migrations
├── 📜 scripts/              # Build and deployment scripts
└── 📋 package.json          # Workspace management
```

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Shopify Partner Account
- Supabase Account (for database)

### **Installation**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/stratix-ai/shopify-app.git
   cd stratix-ai-shopify-app
   ```

2. **Install dependencies:**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install
   
   # Install backend dependencies
   cd ../backend && npm install
   ```

3. **Environment Setup:**
   ```bash
   # Copy environment templates
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   
   # Configure your environment variables
   ```

4. **Database Setup:**
   ```bash
   # Generate Prisma client
   cd backend && npx prisma generate
   
   # Push database schema
   npx prisma db push
   ```

### **Development**

Start the development servers:

```bash
# Start both frontend and backend (from root)
npm run dev

# Or start individually:
# Frontend (http://localhost:3000)
cd frontend && npm run dev

# Backend (http://localhost:3001)
cd backend && npm run dev
```

### **Production Build**

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build

# Start production servers
npm run start
```

---

## 🔌 **API Endpoints**

### **Backend API Routes** (`/api/v1/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check and system status |
| `/analysis` | POST | Content analysis and optimization |
| `/brands` | GET/POST | Brand DNA analysis and management |
| `/content` | POST | AI-powered content generation |
| `/performance` | GET | Performance metrics and reporting |
| `/products` | GET/POST | Product optimization and management |
| `/security` | GET/POST | Security scanning and alerts |
| `/settings` | GET/POST | User settings management |
| `/trials` | GET/POST | Trial management and analytics |
| `/webhooks/shopify` | POST | Shopify webhook handling |

### **Frontend API Client**

```typescript
import { apiClient } from '@/lib/api-client';

// Example usage
const analysis = await apiClient.analysis.analyze({
  content: 'Product description...',
  type: 'product'
});

const brandDNA = await apiClient.brands.getDNA(shopId);
const metrics = await apiClient.performance.getMetrics();
```

---

## 🧠 **AI Intelligence Modules**

### **Core Intelligence Features**

- **🧬 Brand DNA Analyzer** - Analyzes brand personality, values, and strategy
- **🎯 Landing Page Optimizer** - Optimizes page performance and conversion
- **🔍 Insights Engine** - Generates actionable business insights
- **⚡ Escalation Engine** - Manages alerts and automated responses
- **📝 Evolution Logger** - Tracks changes and performance over time

### **AI-Powered Capabilities**

- **Content Generation** - Product descriptions, ad copy, blog posts
- **Performance Analysis** - Conversion rate optimization suggestions
- **Brand Strategy** - Automated brand positioning recommendations
- **Security Monitoring** - AI-driven threat detection and analysis
- **Customer Insights** - Behavioral analysis and segmentation

---

## 🛡️ **Security & Performance**

### **Security Features**
- **Helmet.js** - Security headers and XSS protection
- **Rate Limiting** - API request throttling (100 req/15min)
- **CORS Configuration** - Cross-origin request security
- **JWT Authentication** - Secure token-based authentication
- **Input Validation** - Zod schema validation for all inputs
- **Error Handling** - Secure error responses without data leakage

### **Performance Optimizations**
- **Compression** - Gzip compression for API responses
- **Connection Pooling** - Database connection optimization
- **Caching** - Redis-backed response caching
- **Bundle Optimization** - Next.js optimized builds (87.1 kB shared chunks)
- **Static Generation** - Pre-rendered pages for optimal loading

---

## 🧪 **Testing & Quality**

### **Testing Strategy**
```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Type checking
npm run type-check
```

### **Code Quality Tools**
- **TypeScript** - Full type safety across the codebase
- **ESLint** - Code linting and style enforcement
- **Prettier** - Code formatting consistency
- **Husky** - Pre-commit hooks for quality assurance

---

## 🚀 **Deployment**

### **Environment Configurations**

**Development:**
```bash
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
API_BASE_URL=http://localhost:3001
```

**Production:**
```bash
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
API_BASE_URL=https://api.your-domain.com
```

### **Production Deployment**

1. **Build the applications:**
   ```bash
   npm run build
   ```

2. **Set environment variables:**
   - Configure production database URLs
   - Set API keys and secrets
   - Configure Shopify app credentials

3. **Deploy to your platform:**
   - Vercel (Frontend)
   - Railway/Heroku (Backend)
   - Or Docker containers

---

## 📚 **Documentation**

- **[API Documentation](./docs/api.md)** - Complete API reference
- **[Architecture Guide](./docs/architecture.md)** - System design overview
- **[Deployment Guide](./docs/deployment.md)** - Production deployment instructions
- **[Contributing Guide](./CONTRIBUTING.md)** - Development guidelines

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📄 **License**

This project is licensed under a Commercial License - see the [LICENSE](./LICENSE) file for details.

---

## 🆘 **Support**

- **Documentation:** [docs.stratix-ai.com](https://docs.stratix-ai.com)
- **Issues:** [GitHub Issues](https://github.com/stratix-ai/shopify-app/issues)
- **Email:** support@stratix-ai.com
- **Discord:** [Join our community](https://discord.gg/stratix-ai)

---

## 🎉 **Acknowledgments**

- [Shopify](https://www.shopify.com/) for the amazing e-commerce platform
- [Next.js](https://nextjs.org/) for the incredible React framework
- [OpenAI](https://openai.com/) for powering our AI capabilities
- [Supabase](https://supabase.com/) for the backend-as-a-service platform

---

<div align="center">
  <h3>Built with ❤️ by the Stratix AI Team</h3>
  <p>
    <a href="https://stratix-ai.com">Website</a> •
    <a href="https://twitter.com/stratixai">Twitter</a> •
    <a href="https://linkedin.com/company/stratix-ai">LinkedIn</a>
  </p>
</div>
