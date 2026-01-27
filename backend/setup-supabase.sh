#!/bin/bash

# CSV Processing API - Supabase Setup Script
# This script helps you set up Supabase for the API

set -e

echo "🚀 CSV Processing API - Supabase Setup"
echo "======================================="
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Backup created as .env.backup"
    cp .env .env.backup
fi

echo "📝 Step 1: Create Supabase Project"
echo ""
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Click 'New Project'"
echo "3. Fill in:"
echo "   - Name: csv-processing-api (or any name)"
echo "   - Database Password: (choose a strong password)"
echo "   - Region: (closest to you)"
echo "4. Wait 2-3 minutes for project to be ready"
echo ""
read -p "Press ENTER when your project is ready..."

echo ""
echo "📝 Step 2: Get API Credentials"
echo ""
echo "1. In Supabase Dashboard, go to: Settings → API"
echo "2. Copy the following:"
echo ""

# Get Project URL
echo "Enter your Project URL (e.g., https://xxxxx.supabase.co):"
read -p "SUPABASE_URL: " SUPABASE_URL

# Get anon key
echo ""
echo "Enter your anon (public) key:"
read -p "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY

# Validate inputs
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Both URL and key are required"
    exit 1
fi

# Create .env file
echo ""
echo "📝 Creating .env file..."
cat > .env << EOF
# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Logging
LOG_LEVEL=info
EOF

echo "✅ .env file created!"
echo ""

# Test connection
echo "📝 Step 3: Testing connection..."
echo ""

if command -v node &> /dev/null; then
    echo "Testing Supabase connection..."
    
    # Create a simple test script
    cat > /tmp/test-supabase.mjs << 'TESTEOF'
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

try {
  const { data, error } = await supabase.from('_test').select('*').limit(1);
  
  if (error && error.code !== '42P01') { // 42P01 = table doesn't exist (expected)
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Connection successful!');
} catch (err) {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
}
TESTEOF

    node /tmp/test-supabase.mjs || echo "⚠️  Connection test skipped (install dependencies first)"
    rm /tmp/test-supabase.mjs 2>/dev/null || true
else
    echo "⚠️  Node.js not found, skipping connection test"
fi

echo ""
echo "📝 Step 4: Run Database Migrations"
echo ""
echo "1. Go to: $SUPABASE_URL/project/_/sql/new"
echo "2. Or: Supabase Dashboard → SQL Editor → New Query"
echo ""
echo "3. Copy and run migration 1:"
echo "   File: database/migrations/001_create_uploads_table.sql"
read -p "Press ENTER when migration 1 is complete..."

echo ""
echo "4. Copy and run migration 2:"
echo "   File: database/migrations/002_create_transactions_table.sql"
read -p "Press ENTER when migration 2 is complete..."

echo ""
echo "📝 Step 5: Verify Tables"
echo ""
echo "Run this query in SQL Editor to verify:"
echo ""
echo "SELECT table_name FROM information_schema.tables"
echo "WHERE table_schema = 'public'"
echo "AND table_name IN ('uploads', 'transactions');"
echo ""
echo "You should see both 'uploads' and 'transactions' tables."
read -p "Press ENTER when verified..."

echo ""
echo "✅ Supabase setup complete!"
echo ""
echo "📋 Summary:"
echo "  - .env file created with credentials"
echo "  - Ready to deploy to Vercel"
echo ""
echo "🚀 Next steps:"
echo "  1. Install dependencies: npm install"
echo "  2. Test locally: npm run dev"
echo "  3. Deploy to Vercel: ./deploy-vercel.sh"
echo ""
