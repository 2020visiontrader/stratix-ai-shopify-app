# Stratix AI - Shopify App

A powerful AI-powered e-commerce optimization platform for Shopify stores.

## Project Structure

```
stratix-ai/
├── frontend/           # Next.js frontend application
│   ├── src/           # Frontend source code
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layout/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── scripts/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── backend/           # Express.js backend server
│   ├── src/          # Backend source code
│   │   ├── api/
│   │   ├── config/
│   │   ├── db/
│   │   ├── integrations/
│   │   ├── middleware/
│   │   └── services/
│   ├── server.js
│   └── package.json
├── shared/           # Shared types and utilities
│   ├── src/
│   │   └── types.ts
│   └── package.json
└── package.json      # Root package.json for workspace management
```

## Setup

1. Install dependencies:
```bash
npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Fill in the required environment variables

3. Start development servers:
   ```bash
   # Start both frontend and backend
   npm run dev

   # Start only frontend
   npm run dev:frontend

   # Start only backend
   npm run dev:backend
   ```

## Development

- Frontend runs on: http://localhost:3000
- Backend runs on: http://localhost:3001
- API documentation: http://localhost:3001/api/docs

## Features

- AI-powered product optimization
- Automated ad generation
- Brand configuration
- Analytics dashboard
- Shopify integration
- Real-time insights

## Tech Stack

- Frontend: Next.js, React, TypeScript
- Backend: Express.js, Node.js, TypeScript
- Database: Supabase
- AI: OpenAI
- Authentication: JWT
- API Documentation: OpenAPI/Swagger

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

MIT
