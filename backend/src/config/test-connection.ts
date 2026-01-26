/**
 * Test script for Supabase connection
 * Run with: npm run dev src/config/test-connection.ts
 */

import { testSupabaseConnection, supabaseConfig } from './supabase';

async function main() {
  console.log('🔍 Testing Supabase connection...\n');

  console.log('Configuration:');
  console.log(`  URL: ${supabaseConfig.url || '❌ NOT SET'}`);
  console.log(`  Anon Key: ${supabaseConfig.anonKey ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`  Service Role Key: ${supabaseConfig.serviceRoleKey ? '✅ SET' : '⚠️  NOT SET (optional)'}\n`);

  const result = await testSupabaseConnection();

  if (result.success) {
    console.log('✅ Supabase connection successful!');
    console.log('   Database is reachable and credentials are valid.\n');
    process.exit(0);
  } else {
    console.error('❌ Supabase connection failed!');
    console.error(`   Error: ${result.error}\n`);
    console.error('Please check:');
    console.error('  1. .env file exists with correct values');
    console.error('  2. SUPABASE_URL is correct');
    console.error('  3. SUPABASE_ANON_KEY is correct');
    console.error('  4. Network connectivity to Supabase\n');
    process.exit(1);
  }
}

main();
