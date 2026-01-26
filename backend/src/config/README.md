# Configuration

Application configuration files.

## Supabase Setup

### 1. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (safe to use client-side)
   - **service_role key** (optional, server-only, keep secret!)

### 2. Create `.env` File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update with your credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Test Connection

Run the connection test:

```bash
npm run test:connection
```

Expected output:

```
✅ Supabase connection successful!
   Database is reachable and credentials are valid.
```

## Files

- `supabase.ts` - Supabase client configuration
  - `createSupabaseClient()` - Create client instance
  - `createSupabaseAdminClient()` - Create admin client (requires service role key)
  - `getSupabaseClient()` - Get singleton instance
  - `testSupabaseConnection()` - Test connection

- `test-connection.ts` - Connection test script

## Usage in Code

```typescript
import { getSupabaseClient } from './config/supabase';

const supabase = getSupabaseClient();

// Query database
const { data, error } = await supabase
  .from('uploads')
  .select('*')
  .limit(10);
```

## Security Notes

- ⚠️ Never commit `.env` file to Git
- ⚠️ Never use service role key client-side
- ✅ Use anon key for most operations (respects RLS)
- ✅ Use service role key only for admin operations
