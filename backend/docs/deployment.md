# Deployment Documentation

## Overview

This document outlines the deployment process for the Stratix AI Shopify App backend. It covers environment setup, deployment steps, monitoring, and maintenance procedures.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Supabase project
- A Shopify Partner account
- Environment variables configured
- SSL certificates (for production)

## Environment Setup

### Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/stratix-ai-shopify-app.git
   cd stratix-ai-shopify-app/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your development configuration
   ```

4. Run database setup:
   ```bash
   ./scripts/setup-db.sh
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Staging

1. Set up staging environment variables:
   ```bash
   # .env.staging
   NODE_ENV=staging
   PORT=3000
   SUPABASE_URL=your_staging_supabase_url
   SUPABASE_ANON_KEY=your_staging_supabase_key
   SHOPIFY_API_KEY=your_staging_shopify_key
   SHOPIFY_API_SECRET=your_staging_shopify_secret
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Run database migrations:
   ```bash
   npm run migrate
   ```

4. Start the staging server:
   ```bash
   npm run start:staging
   ```

### Production

1. Set up production environment variables:
   ```bash
   # .env.production
   NODE_ENV=production
   PORT=3000
   SUPABASE_URL=your_production_supabase_url
   SUPABASE_ANON_KEY=your_production_supabase_key
   SHOPIFY_API_KEY=your_production_shopify_key
   SHOPIFY_API_SECRET=your_production_shopify_secret
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Run database migrations:
   ```bash
   npm run migrate
   ```

4. Start the production server:
   ```bash
   npm run start:prod
   ```

## Deployment Steps

### 1. Database Preparation

1. Backup the database:
   ```bash
   ./scripts/backup-db.sh
   ```

2. Run database health check:
   ```bash
   ./scripts/check-db-health.sh
   ```

3. Apply migrations:
   ```bash
   npm run migrate
   ```

### 2. Application Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Start the server:
   ```bash
   npm run start:prod
   ```

### 3. Post-Deployment Verification

1. Check server health:
   ```bash
   curl https://your-domain.com/health
   ```

2. Verify database connection:
   ```bash
   ./scripts/check-db-health.sh
   ```

3. Monitor logs:
   ```bash
   npm run logs
   ```

## Monitoring

### Health Checks

The application includes several health check endpoints:

- `/health`: Basic health check
- `/health/db`: Database health check
- `/health/cache`: Cache health check
- `/health/ai`: AI service health check

### Logging

Logs are stored in the following locations:

- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

### Metrics

Key metrics to monitor:

1. Application Metrics:
   - Response times
   - Error rates
   - Request volume
   - Memory usage
   - CPU usage

2. Database Metrics:
   - Query performance
   - Connection pool usage
   - Cache hit rates
   - Disk usage

3. AI Service Metrics:
   - Model performance
   - Response times
   - Error rates
   - Resource usage

## Maintenance

### Regular Tasks

1. Database Maintenance:
   ```bash
   # Backup database
   ./scripts/backup-db.sh

   # Check database health
   ./scripts/check-db-health.sh

   # Clean up old logs
   npm run cleanup:logs
   ```

2. Application Maintenance:
   ```bash
   # Update dependencies
   npm update

   # Run tests
   npm test

   # Rebuild application
   npm run build
   ```

### Emergency Procedures

1. Database Issues:
   ```bash
   # Restore from backup
   ./scripts/restore-db.sh <backup_file>

   # Reset database
   npm run reset-db
   ```

2. Application Issues:
   ```bash
   # Restart server
   npm run restart

   # Clear cache
   npm run clear-cache
   ```

## Security

### SSL/TLS

1. Install SSL certificate:
   ```bash
   # Using Let's Encrypt
   certbot --nginx -d your-domain.com
   ```

2. Configure SSL in the application:
   ```typescript
   // config/ssl.ts
   export const sslConfig = {
     key: fs.readFileSync('/path/to/privkey.pem'),
     cert: fs.readFileSync('/path/to/cert.pem')
   };
   ```

### Security Headers

Configure security headers in the application:

```typescript
// middleware/security.ts
app.use(helmet());
app.use(cors());
app.use(rateLimit());
```

## Scaling

### Horizontal Scaling

1. Load Balancer Configuration:
   ```nginx
   upstream backend {
     server backend1:3000;
     server backend2:3000;
     server backend3:3000;
   }
   ```

2. Session Management:
   ```typescript
   // config/session.ts
   export const sessionConfig = {
     store: new RedisStore({
       host: 'redis',
       port: 6379
     })
   };
   ```

### Vertical Scaling

1. Memory Management:
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

2. Database Scaling:
   - Increase connection pool size
   - Optimize queries
   - Add indexes

## Backup and Recovery

### Backup Strategy

1. Database Backups:
   - Daily full backups
   - Hourly incremental backups
   - Backup retention: 30 days

2. Application Backups:
   - Configuration files
   - Environment variables
   - SSL certificates

### Recovery Procedures

1. Database Recovery:
   ```bash
   # Restore from backup
   ./scripts/restore-db.sh <backup_file>

   # Verify restoration
   ./scripts/check-db-health.sh
   ```

2. Application Recovery:
   ```bash
   # Restore configuration
   cp backup/config/* config/

   # Restart application
   npm run restart
   ```

## Support

For deployment-related issues:

1. Check the [documentation](docs/)
2. Review deployment logs
3. Contact support@stratix.ai 