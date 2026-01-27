# Database Migrations

This directory contains SQL migration files for the CSV Processing API database schema.

## Overview

The database schema consists of two main tables:
1. **uploads** - Tracks CSV file uploads and their processing status
2. **transactions** - Stores individual transaction records from uploaded files

## Tables

### uploads Table

Tracks CSV file uploads with metadata, validation statistics, and financial summaries.

**Key Columns:**
- `id` (UUID) - Primary key
- `filename` - Stored filename
- `original_filename` - Original uploaded filename
- `status` - Processing status (processing, completed, failed, partial)
- `total_rows`, `valid_rows`, `invalid_rows` - Row counts
- `validation_rate` - Percentage of valid rows (0-100)
- `earliest_transaction_date`, `latest_transaction_date` - Date range
- `total_amount`, `total_income`, `total_expenses`, `net_balance` - Financial summary
- `processing_time_ms` - Processing duration
- `created_at`, `updated_at`, `completed_at` - Timestamps
- `deleted_at` - Soft delete timestamp

**Indexes:**
- `idx_uploads_status` - Query by status
- `idx_uploads_created_at` - Query by creation date
- `idx_uploads_status_created_at` - Composite index for status + date queries
- `idx_uploads_validation_rate` - Query by validation quality

**Triggers:**
- `update_uploads_updated_at` - Auto-update `updated_at` on changes
- `set_completed_at` - Auto-set `completed_at` when status becomes 'completed'

### transactions Table

Stores individual transaction records with validation status and warnings.

**Key Columns:**
- `id` (UUID) - Primary key
- `upload_id` (UUID) - Foreign key to uploads table
- `row_number` (INTEGER) - 1-based row number from CSV
- `date` (DATE) - Transaction date
- `amount` (DECIMAL) - Transaction amount
- `category` (VARCHAR) - Transaction category
- `description` (TEXT) - Optional description
- `is_valid` (BOOLEAN) - Validation status
- `validation_errors` (JSONB) - Array of validation errors
- `has_warnings` (BOOLEAN) - Has business rule warnings
- `warnings` (JSONB) - Array of business rule warnings
- `raw_data` (JSONB) - Original CSV row data
- `transaction_type` (GENERATED) - Computed: income, expense, or zero
- `created_at`, `updated_at` - Timestamps
- `deleted_at` - Soft delete timestamp

**Indexes:**
- `idx_transactions_upload_id` - Query by upload
- `idx_transactions_date` - Query by date
- `idx_transactions_category` - Query by category
- `idx_transactions_amount` - Query by amount
- `idx_transactions_type` - Query by transaction type
- `idx_transactions_upload_date` - Composite: upload + date
- `idx_transactions_upload_category` - Composite: upload + category
- `idx_transactions_date_category` - Composite: date + category

**Triggers:**
- `update_transactions_updated_at` - Auto-update `updated_at` on changes
- `update_upload_stats_after_transaction_insert` - Auto-update upload statistics when transactions are inserted

**Views:**
- `valid_transactions` - Only valid (passed validation) transactions
- `transaction_summary_by_category` - Aggregated statistics by category per upload

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `001_create_uploads_table.sql`
5. Run the query
6. Repeat for `002_create_transactions_table.sql`

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to project root
cd /path/to/project

# Run migrations in order
supabase db push
```

### Option 3: psql (PostgreSQL CLI)

If connecting directly to the database:

```bash
# Set environment variables
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run migrations
psql $SUPABASE_DB_URL -f database/migrations/001_create_uploads_table.sql
psql $SUPABASE_DB_URL -f database/migrations/002_create_transactions_table.sql
```

## Verification

After running migrations, verify the tables were created:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('uploads', 'transactions');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('uploads', 'transactions');

-- Check triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table IN ('uploads', 'transactions');

-- Check views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('valid_transactions', 'transaction_summary_by_category');
```

## Example Queries

### Query uploads with statistics

```sql
SELECT 
  id,
  original_filename,
  status,
  total_rows,
  valid_rows,
  invalid_rows,
  validation_rate,
  total_amount,
  net_balance,
  created_at
FROM uploads
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 10;
```

### Query transactions by upload

```sql
SELECT 
  row_number,
  date,
  amount,
  category,
  description,
  is_valid,
  transaction_type
FROM transactions
WHERE upload_id = 'your-upload-uuid-here'
  AND is_valid = true
ORDER BY row_number;
```

### Get category summary for an upload

```sql
SELECT * 
FROM transaction_summary_by_category
WHERE upload_id = 'your-upload-uuid-here'
ORDER BY total_amount DESC;
```

### Find uploads with low validation rate

```sql
SELECT 
  id,
  original_filename,
  validation_rate,
  total_rows,
  invalid_rows,
  created_at
FROM uploads
WHERE validation_rate < 80
  AND status = 'completed'
ORDER BY validation_rate ASC;
```

## Data Integrity

The schema includes several features for data integrity:

1. **Foreign Keys**: transactions.upload_id references uploads.id with CASCADE
2. **Check Constraints**: Validate data ranges and consistency
3. **Indexes**: Optimize common query patterns
4. **Triggers**: Automatically update timestamps and statistics
5. **Soft Deletes**: Use `deleted_at` instead of hard deletes
6. **Generated Columns**: transaction_type computed from amount
7. **Views**: Pre-computed aggregations for common queries

## Performance Considerations

- **Batch Inserts**: Use batch inserts for transactions to minimize trigger overhead
- **Indexes**: Indexes are created on commonly queried columns
- **Partitioning**: Consider partitioning transactions table by date for large datasets
- **Vacuuming**: PostgreSQL auto-vacuum is enabled, but manual VACUUM ANALYZE may help
- **Connection Pooling**: Use connection pooling for production workloads

## Rollback

To rollback migrations (⚠️ WARNING: This will delete all data):

```sql
-- Drop views
DROP VIEW IF EXISTS transaction_summary_by_category;
DROP VIEW IF EXISTS valid_transactions;

-- Drop triggers
DROP TRIGGER IF EXISTS update_upload_stats_after_transaction_insert ON transactions;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS set_completed_at ON uploads;
DROP TRIGGER IF EXISTS update_uploads_updated_at ON uploads;

-- Drop functions
DROP FUNCTION IF EXISTS update_upload_stats_on_transaction_insert();
DROP FUNCTION IF EXISTS validate_completed_upload();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables (CASCADE will drop foreign keys)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS uploads CASCADE;
```

## Support

For questions or issues with the database schema, refer to:
- Supabase Documentation: https://supabase.com/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/
