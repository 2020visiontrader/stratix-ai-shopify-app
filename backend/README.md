# Stratix AI Shopify App Backend

This is the backend service for the Stratix AI Shopify App, providing AI-powered content optimization, market analysis, and social media management features.

## Features

- AI-powered content generation and optimization
- Market analysis and competitor tracking
- Social media content management
- Performance monitoring and analytics
- Real-time notifications
- Caching and rate limiting
- Comprehensive error handling and logging

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account and project
- Shopify Partner account
- OpenAI API key

## Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/stratix-ai-shopify-app.git
cd stratix-ai-shopify-app/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the environment variables in `.env` with your configuration.

5. Initialize the database:
```bash
npm run db:setup
```

6. Start the development server:
```bash
npm run dev
```

## Development

### Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm test`: Run tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Generate test coverage report
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint errors
- `npm run format`: Format code with Prettier
- `npm run typecheck`: Check TypeScript types

### Project Structure

```
src/
├── api/              # API routes and middleware
├── config/           # Configuration management
├── db/              # Database setup and migrations
├── services/        # Business logic services
├── utils/           # Utility functions
└── test/            # Test setup and utilities
```

### API Documentation

The API documentation is available at `/api-docs` when running the server.

### Testing

Tests are written using Jest and should be placed in `__tests__` directories next to the files they test.

Run tests with:
```bash
npm test
```

### Code Style

The project uses ESLint and Prettier for code style enforcement. Run:
```bash
npm run lint
npm run format
```

## Deployment

1. Build the application:
```bash
npm run build
```

2. Set up environment variables on your hosting platform.

3. Start the server:
```bash
npm start
```

## Monitoring

The application includes:
- Health check endpoint at `/health`
- Error tracking with Sentry
- Performance monitoring with APM
- Logging with Winston

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact support@stratix.ai or create an issue in the repository. 