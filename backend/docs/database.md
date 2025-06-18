# Database Documentation

## Overview

The Stratix AI Shopify App uses Supabase as its database. This document provides detailed information about the database setup, schema, and maintenance procedures.

## Schema

### Tables

#### shops
- `id`: UUID (Primary Key)
- `domain`: TEXT (Unique)
- `access_token`: TEXT
- `scope`: TEXT[]
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

#### products
- `id`: UUID (Primary Key)
- `shop_id`: UUID (Foreign Key -> shops.id)
- `shopify_id`: TEXT
- `title`: TEXT
- `description`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

#### content_revisions
- `id`: UUID (Primary Key)
- `product_id`: UUID (Foreign Key -> products.id)
- `content`: TEXT
- `version`: INTEGER
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

#### performance_metrics
- `id`: UUID (Primary Key)
- `product_id`: UUID (Foreign Key -> products.id)
- `metric_type`: TEXT
- `value`: NUMERIC
- `created_at`: TIMESTAMP

#### ai_models
- `id`: UUID (Primary Key)
- `name`: TEXT
- `version`: TEXT
- `config`: JSONB
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

#### usage_logs
- `id`: UUID (Primary Key)
- `shop_id`: UUID (Foreign Key -> shops.id)
- `endpoint`: TEXT
- `method`: TEXT
- `status_code`: INTEGER
- `created_at`: TIMESTAMP

#### events
- `id`: UUID (Primary Key)
- `shop_id`: UUID (Foreign Key -> shops.id)
- `type`: TEXT
- `data`: JSONB
- `created_at`: TIMESTAMP

#### cache
- `key`: TEXT (Primary Key)
- `value`: JSONB
- `type`: TEXT
- `expires_at`: TIMESTAMP
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### Indexes

- `shops_domain_idx`: B-tree index on shops(domain)
- `products_shop_id_idx`: B-tree index on products(shop_id)
- `content_revisions_product_id_idx`: B-tree index on content_revisions(product_id)
- `performance_metrics_product_id_idx`: B-tree index on performance_metrics(product_id)
- `usage_logs_shop_id_idx`: B-tree index on usage_logs(shop_id)
- `events_shop_id_idx`: B-tree index on events(shop_id)

### Policies

Each table has a corresponding RLS policy that enforces access control:

- `shops_policy`: Allows access to shop data based on domain
- `products_policy`: Allows access to product data based on shop ownership
- `content_revisions_policy`: Allows access to content revisions based on product ownership
- `performance_metrics_policy`: Allows access to metrics based on product ownership
- `ai_models_policy`: Allows access to AI models based on shop ownership
- `usage_logs_policy`: Allows access to usage logs based on shop ownership
- `events_policy`: Allows access to events based on shop ownership
- `cache_policy`: Allows access to cache entries based on type and ownership

## Maintenance

### Backups

The database backup process:

1. Creates a timestamped backup file
2. Exports all table data
3. Includes table schemas and indexes
4. Stores backups in the `backups` directory
5. Automatically cleans up backups older than 7 days

To create a backup:
```bash
./scripts/backup-db.sh
```

### Restore

The restore process:

1. Validates the backup file
2. Clears existing data (if needed)
3. Restores table schemas
4. Restores data
5. Recreates indexes and policies

To restore from a backup:
```bash
./scripts/restore-db.sh <backup_file>
```

### Health Checks

The health check process verifies:

1. Database connection
2. Table existence and structure
3. Index presence
4. Policy configuration
5. Data integrity

To run a health check:
```bash
./scripts/check-db-health.sh
```

## Security

### Row Level Security (RLS)

RLS policies ensure that:

1. Users can only access their own data
2. Data is protected at the row level
3. Access is controlled by shop domain
4. Sensitive data is properly secured

### Access Control

Access is controlled through:

1. Shop-based authentication
2. Role-based permissions
3. API key validation
4. Request rate limiting

## Monitoring

### Performance Metrics

Monitor database performance through:

1. Query execution times
2. Connection pool usage
3. Cache hit rates
4. Index usage statistics

### Logging

Database operations are logged for:

1. Security auditing
2. Performance analysis
3. Error tracking
4. Usage monitoring

## Troubleshooting

Common issues and solutions:

1. Connection Issues
   - Verify environment variables
   - Check network connectivity
   - Validate credentials

2. Performance Issues
   - Check query execution plans
   - Verify index usage
   - Monitor resource usage

3. Data Issues
   - Run health checks
   - Verify data integrity
   - Check for corruption

4. Security Issues
   - Review access logs
   - Verify policy configuration
   - Check for unauthorized access 