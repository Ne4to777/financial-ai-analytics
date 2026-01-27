-- Migration: 002_create_transactions_table.sql
-- Description: Creates the transactions table to store individual transaction records
-- Date: 2026-01-27

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to uploads
  upload_id UUID NOT NULL,
  
  -- Row information
  row_number INTEGER NOT NULL, -- 1-based row number from CSV
  
  -- Transaction data (normalized/validated)
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Validation status
  is_valid BOOLEAN NOT NULL DEFAULT true,
  validation_errors JSONB, -- Array of validation errors if invalid
  
  -- Business rule warnings
  has_warnings BOOLEAN NOT NULL DEFAULT false,
  warnings JSONB, -- Array of business rule warnings
  
  -- Raw data (for reference)
  raw_data JSONB NOT NULL, -- Original CSV row data
  
  -- Metadata
  transaction_type VARCHAR(20) GENERATED ALWAYS AS (
    CASE 
      WHEN amount > 0 THEN 'income'
      WHEN amount < 0 THEN 'expense'
      ELSE 'zero'
    END
  ) STORED,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Foreign key constraint
  CONSTRAINT fk_transactions_upload
    FOREIGN KEY (upload_id)
    REFERENCES uploads(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  
  -- Constraints
  CONSTRAINT valid_row_number CHECK (row_number > 0),
  CONSTRAINT valid_category_length CHECK (LENGTH(category) <= 100),
  CONSTRAINT valid_amount_range CHECK (amount >= -1000000 AND amount <= 1000000)
);

-- Create indexes for common queries
CREATE INDEX idx_transactions_upload_id ON transactions(upload_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_date ON transactions(date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_category ON transactions(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_amount ON transactions(amount) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_type ON transactions(transaction_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_is_valid ON transactions(is_valid) WHERE deleted_at IS NULL;

-- Composite indexes for common query patterns
CREATE INDEX idx_transactions_upload_date ON transactions(upload_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_upload_category ON transactions(upload_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_upload_valid ON transactions(upload_id, is_valid) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_date_category ON transactions(date DESC, category) WHERE deleted_at IS NULL;

-- Index for soft-deleted records
CREATE INDEX idx_transactions_deleted_at ON transactions(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add comments to table
COMMENT ON TABLE transactions IS 'Stores individual transaction records from uploaded CSV files';

-- Add comments to key columns
COMMENT ON COLUMN transactions.id IS 'Unique identifier for the transaction';
COMMENT ON COLUMN transactions.upload_id IS 'Reference to the parent upload record';
COMMENT ON COLUMN transactions.row_number IS '1-based row number from the original CSV file';
COMMENT ON COLUMN transactions.is_valid IS 'Whether the transaction passed validation';
COMMENT ON COLUMN transactions.validation_errors IS 'JSON array of validation error objects';
COMMENT ON COLUMN transactions.has_warnings IS 'Whether the transaction has business rule warnings';
COMMENT ON COLUMN transactions.warnings IS 'JSON array of business rule warning objects';
COMMENT ON COLUMN transactions.raw_data IS 'Original CSV row data in JSON format';
COMMENT ON COLUMN transactions.transaction_type IS 'Computed column: income, expense, or zero';
COMMENT ON COLUMN transactions.deleted_at IS 'Soft delete timestamp (NULL if not deleted)';

-- Create trigger to update updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update upload statistics when transactions are inserted
CREATE OR REPLACE FUNCTION update_upload_stats_on_transaction_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the upload's transaction count and financial stats
  UPDATE uploads
  SET 
    total_rows = (
      SELECT COUNT(*)
      FROM transactions
      WHERE upload_id = NEW.upload_id AND deleted_at IS NULL
    ),
    valid_rows = (
      SELECT COUNT(*)
      FROM transactions
      WHERE upload_id = NEW.upload_id AND is_valid = true AND deleted_at IS NULL
    ),
    invalid_rows = (
      SELECT COUNT(*)
      FROM transactions
      WHERE upload_id = NEW.upload_id AND is_valid = false AND deleted_at IS NULL
    ),
    earliest_transaction_date = (
      SELECT MIN(date)
      FROM transactions
      WHERE upload_id = NEW.upload_id AND is_valid = true AND deleted_at IS NULL
    ),
    latest_transaction_date = (
      SELECT MAX(date)
      FROM transactions
      WHERE upload_id = NEW.upload_id AND is_valid = true AND deleted_at IS NULL
    ),
    total_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM transactions
      WHERE upload_id = NEW.upload_id AND is_valid = true AND deleted_at IS NULL
    ),
    total_income = (
      SELECT COALESCE(SUM(amount), 0)
      FROM transactions
      WHERE upload_id = NEW.upload_id AND is_valid = true AND amount > 0 AND deleted_at IS NULL
    ),
    total_expenses = (
      SELECT COALESCE(ABS(SUM(amount)), 0)
      FROM transactions
      WHERE upload_id = NEW.upload_id AND is_valid = true AND amount < 0 AND deleted_at IS NULL
    ),
    validation_rate = (
      SELECT CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND((COUNT(*) FILTER (WHERE is_valid = true)::DECIMAL / COUNT(*)) * 100, 2)
      END
      FROM transactions
      WHERE upload_id = NEW.upload_id AND deleted_at IS NULL
    )
  WHERE id = NEW.upload_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update upload stats after transaction insert
CREATE TRIGGER update_upload_stats_after_transaction_insert
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_upload_stats_on_transaction_insert();

-- Create view for valid transactions only
CREATE OR REPLACE VIEW valid_transactions AS
SELECT 
  id,
  upload_id,
  row_number,
  date,
  amount,
  category,
  description,
  transaction_type,
  has_warnings,
  warnings,
  created_at
FROM transactions
WHERE is_valid = true 
  AND deleted_at IS NULL;

COMMENT ON VIEW valid_transactions IS 'View of only valid (passed validation) transactions';

-- Create view for transaction summary by category
CREATE OR REPLACE VIEW transaction_summary_by_category AS
SELECT 
  upload_id,
  category,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as average_amount,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount,
  COUNT(*) FILTER (WHERE amount > 0) as income_count,
  COUNT(*) FILTER (WHERE amount < 0) as expense_count,
  SUM(amount) FILTER (WHERE amount > 0) as total_income,
  ABS(SUM(amount) FILTER (WHERE amount < 0)) as total_expenses
FROM valid_transactions
GROUP BY upload_id, category;

COMMENT ON VIEW transaction_summary_by_category IS 'Aggregated transaction statistics by category per upload';
