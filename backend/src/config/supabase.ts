import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Supabase configuration
 */
export const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

/**
 * Validate Supabase configuration
 */
function validateConfig(): void {
  if (!supabaseConfig.url) {
    throw new Error('SUPABASE_URL is not defined in environment variables');
  }

  if (!supabaseConfig.anonKey) {
    throw new Error('SUPABASE_ANON_KEY is not defined in environment variables');
  }

  // Validate URL format
  try {
    new URL(supabaseConfig.url);
  } catch (error) {
    throw new Error('SUPABASE_URL is not a valid URL');
  }
}

/**
 * Create Supabase client instance
 * Uses anon key by default (for client-side operations)
 */
export function createSupabaseClient(): SupabaseClient {
  validateConfig();

  const client = createClient(
    supabaseConfig.url!,
    supabaseConfig.anonKey!,
    {
      auth: {
        persistSession: false, // Server-side, no session persistence
        autoRefreshToken: false,
      },
    }
  );

  return client;
}

/**
 * Create Supabase admin client instance
 * Uses service role key (for admin operations, bypasses RLS)
 * ⚠️ Use with caution - has full access to database
 */
export function createSupabaseAdminClient(): SupabaseClient {
  validateConfig();

  if (!supabaseConfig.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables');
  }

  const client = createClient(
    supabaseConfig.url!,
    supabaseConfig.serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return client;
}

/**
 * Test Supabase connection
 * @returns Promise<boolean> - true if connection successful
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    validateConfig();

    const client = createSupabaseClient();

    // Try to query a system table to verify connection
    const { error } = await client.from('_test_connection').select('*').limit(1);

    // If error is "relation does not exist", connection is OK
    // (table doesn't exist but we connected successfully)
    if (error && !error.message.includes('does not exist')) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export singleton instance for convenience
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create Supabase client singleton
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
}
