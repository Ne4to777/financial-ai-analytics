-- Migration: 001_create_uploads_table.sql
-- Description: Creates the uploads table to track CSV file uploads
-- Date: 2026-01-27

-- Create uploads table
CREATE TABLE IF NOT EXISTS uploads (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- File information
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  
  -- Upload status
  status VARCHAR(50) NOT NULL DEFAULT 'processing',
  -- Status values: 'processing', 'completed', 'failed', 'partial'
  
  -- CSV metadata
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  
  -- Validation statistics
  validation_rate DECIMAL(5,2), -- Percentage (0.00 to 100.00)
  total_warnings INTEGER NOT NULL DEFAULT 0,
  
  -- Date range from transactions
  earliest_transaction_date DATE,
  latest_transaction_date DATE,
  
  -- Financial summary
  total_amount DECIMAL(15,2),
  total_income DECIMAL(15,2),
  total_expenses DECIMAL(15,2),
  net_balance DECIMAL(15,2),
  
  -- Processing metadata
  processing_time_ms INTEGER, -- Processing time in milliseconds
  error_message TEXT, -- Error message if status is 'failed'
  error_details JSONB, -- Additional error details
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('processing', 'completed', 'failed', 'partial')),
  CONSTRAINT valid_validation_rate CHECK (validation_rate >= 0 AND validation_rate <= 100),
  CONSTRAINT valid_row_counts CHECK (total_rows >= 0 AND valid_rows >= 0 AND invalid_rows >= 0),
  CONSTRAINT consistent_row_counts CHECK (total_rows = valid_rows + invalid_rows)
);

-- Create indexes for common queries
CREATE INDEX idx_uploads_status ON uploads(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_uploads_created_at ON uploads(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_uploads_status_created_at ON uploads(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_uploads_validation_rate ON uploads(validation_rate) WHERE deleted_at IS NULL;

-- Create index for soft-deleted records
CREATE INDEX idx_uploads_deleted_at ON uploads(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add comment to table
COMMENT ON TABLE uploads IS 'Tracks CSV file uploads and their processing status';

-- Add comments to key columns
COMMENT ON COLUMN uploads.id IS 'Unique identifier for the upload';
COMMENT ON COLUMN uploads.status IS 'Current status: processing, completed, failed, partial';
COMMENT ON COLUMN uploads.validation_rate IS 'Percentage of valid rows (0-100)';
COMMENT ON COLUMN uploads.processing_time_ms IS 'Time taken to process the upload in milliseconds';
COMMENT ON COLUMN uploads.deleted_at IS 'Soft delete timestamp (NULL if not deleted)';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_uploads_updated_at
  BEFORE UPDATE ON uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate completed uploads
CREATE OR REPLACE FUNCTION validate_completed_upload()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set completed_at when status changes to completed
CREATE TRIGGER set_completed_at
  BEFORE INSERT OR UPDATE ON uploads
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION validate_completed_upload();
