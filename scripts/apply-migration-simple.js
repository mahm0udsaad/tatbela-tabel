#!/usr/bin/env node

/**
 * Apply the B2B search migration directly to the database
 * Uses only Node.js built-in modules
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Manually parse .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
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

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260124000000_allow_b2b_products_in_public_search.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📦 Applying migration: 20260124000000_allow_b2b_products_in_public_search.sql');
console.log('🔗 Supabase URL:', SUPABASE_URL);
console.log('🚀 Executing migration via Supabase Management API...\n');

// Parse the Supabase URL to get the project ref
const url = new URL(SUPABASE_URL);
const projectRef = url.hostname.split('.')[0];

// We'll use the REST API to execute the function creation
// First, let's try using the SQL endpoint directly
const postData = JSON.stringify({
  query: migrationSQL
});

const options = {
  hostname: `${projectRef}.supabase.co`,
  port: 443,
  path: '/rest/v1/rpc/exec', // This might not exist, we'll try
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Prefer': 'return=representation'
  }
};

// Alternative: Use Supabase SQL Editor API
const mgmtOptions = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${projectRef}/database/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  }
};

console.log('Attempting to execute SQL via Supabase Management API...');

const mgmtReq = https.request(mgmtOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Migration applied successfully!');
      console.log('📝 Response:', data || 'Function created');
    } else {
      console.error('❌ Migration failed with status:', res.statusCode);
      console.error('📝 Response:', data);
      console.log('\n⚠️  Alternative: You can apply the migration manually:');
      console.log('1. Go to your Supabase Dashboard > SQL Editor');
      console.log('2. Copy and paste the SQL from:');
      console.log('   supabase/migrations/20260124000000_allow_b2b_products_in_public_search.sql');
      console.log('3. Run the migration');
    }
  });
});

mgmtReq.on('error', (error) => {
  console.error('❌ Error applying migration:', error.message);
  console.log('\n⚠️  Manual migration required:');
  console.log('1. Go to your Supabase Dashboard > SQL Editor');
  console.log('2. Copy and paste the SQL from:');
  console.log('   supabase/migrations/20260124000000_allow_b2b_products_in_public_search.sql');
  console.log('3. Run the migration');
});

mgmtReq.write(postData);
mgmtReq.end();
