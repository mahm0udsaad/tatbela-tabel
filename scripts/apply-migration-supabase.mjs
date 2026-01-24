#!/usr/bin/env node

/**
 * Apply the B2B search migration using Supabase client library
 * Uses the existing @supabase/supabase-js package
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse .env file manually
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf8');
const env = {};

envContent.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the migration SQL
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260124000000_allow_b2b_products_in_public_search.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('📦 Applying migration: 20260124000000_allow_b2b_products_in_public_search.sql');
console.log('🔗 Supabase URL:', SUPABASE_URL);
console.log('🚀 Executing migration via Supabase client...\n');

try {
  // Use raw SQL execution via REST API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ sql: migrationSQL })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  console.log('✅ Migration applied successfully!');
  if (data) {
    console.log('📝 Response:', JSON.stringify(data, null, 2));
  }
  console.log('\n🎉 Done! The search function has been updated.');
  console.log('   B2B products will now appear in public search with hidden prices.');

} catch (error) {
  console.log('⚠️  Automatic execution failed:', error.message);
  console.log('\n📋 Manual steps required:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n1. Open your Supabase Dashboard:');
  console.log(`   https://supabase.com/dashboard/project/${SUPABASE_URL.match(/https:\/\/([^.]+)/)[1]}/sql/new`);
  console.log('\n2. Copy the SQL from:');
  console.log('   supabase/migrations/20260124000000_allow_b2b_products_in_public_search.sql');
  console.log('\n3. Paste it into the SQL Editor');
  console.log('\n4. Click "RUN" to execute');
  console.log('\n═══════════════════════════════════════════════════════════════');
  process.exit(1);
}
