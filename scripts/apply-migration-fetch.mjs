#!/usr/bin/env node

/**
 * Apply the B2B search migration directly to the database
 * Uses Node's built-in fetch API (Node 18+)
 */

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

// Read the migration SQL
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260124000000_allow_b2b_products_in_public_search.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('📦 Applying migration: 20260124000000_allow_b2b_products_in_public_search.sql');
console.log('🔗 Supabase URL:', SUPABASE_URL);
console.log('🚀 Executing migration...\n');

try {
  // Try to execute the SQL using Supabase REST API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: migrationSQL })
  });

  if (response.ok) {
    const data = await response.text();
    console.log('✅ Migration applied successfully!');
    if (data) {
      console.log('📝 Response:', data);
    }
  } else {
    const error = await response.text();
    console.log('⚠️  Direct execution not available. Status:', response.status);
    console.log('\n📋 Please apply the migration manually:');
    console.log('════════════════════════════════════════════════════════════');
    console.log('\n1. Go to your Supabase Dashboard:');
    console.log(`   ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}`);
    console.log('\n2. Navigate to: SQL Editor');
    console.log('\n3. Copy and paste this SQL:\n');
    console.log('────────────────────────────────────────────────────────────');
    console.log(migrationSQL);
    console.log('────────────────────────────────────────────────────────────');
    console.log('\n4. Click "Run" to execute the migration');
    console.log('\n════════════════════════════════════════════════════════════');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n📋 Please apply the migration manually:');
  console.log('════════════════════════════════════════════════════════════');
  console.log('\n1. Go to your Supabase Dashboard:');
  console.log(`   ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}`);
  console.log('\n2. Navigate to: SQL Editor');
  console.log('\n3. Copy and paste this SQL:\n');
  console.log('────────────────────────────────────────────────────────────');
  console.log(migrationSQL);
  console.log('────────────────────────────────────────────────────────────');
  console.log('\n4. Click "Run" to execute the migration');
  console.log('\n════════════════════════════════════════════════════════════');
}
