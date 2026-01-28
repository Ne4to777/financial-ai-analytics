#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials in .env file');
  process.exit(1);
}

console.log(`📡 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

try {
  // Test 1: Check if tables exist
  console.log('Test 2: Checking tables...');
  
  const { data: uploadsData, error: uploadsError } = await supabase
    .from('uploads')
    .select('id')
    .limit(1);
  
  if (uploadsError) {
    if (uploadsError.code === '42P01') {
      console.log('⚠️  Table "uploads" does not exist');
      console.log('   Run migrations in Supabase SQL Editor!\n');
    } else {
      console.error('❌ Error checking uploads table:', uploadsError.message);
    }
  } else {
    console.log('✅ Table "uploads" exists');
  }

  const { data: transactionsData, error: transactionsError } = await supabase
    .from('transactions')
    .select('id')
    .limit(1);
  
  if (transactionsError) {
    if (transactionsError.code === '42P01') {
      console.log('⚠️  Table "transactions" does not exist');
      console.log('   Run migrations in Supabase SQL Editor!\n');
    } else {
      console.error('❌ Error checking transactions table:', transactionsError.message);
    }
  } else {
    console.log('✅ Table "transactions" exists');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (!uploadsError && !transactionsError) {
    console.log('✅ All checks passed! Ready to deploy! 🚀');
  } else {
    console.log('⚠️  Please run migrations in Supabase SQL Editor:');
    console.log('   1. Open: https://ggxbqcctwforkngwhqpl.supabase.co/project/_/sql/new');
    console.log('   2. Run: database/migrations/001_create_uploads_table.sql');
    console.log('   3. Run: database/migrations/002_create_transactions_table.sql');
  }
  console.log('='.repeat(50) + '\n');

} catch (err) {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
}
