#!/usr/bin/env node

/**
 * Apply the B2B search migration directly to the database
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260124000000_allow_b2b_products_in_public_search.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📦 Applying migration: 20260124000000_allow_b2b_products_in_public_search.sql');
console.log('🔗 Supabase URL:', SUPABASE_URL);

// Parse the Supabase URL to get the project ref
const url = new URL(SUPABASE_URL);
const projectRef = url.hostname.split('.')[0];

// Prepare the request
const postData = JSON.stringify({
  query: migrationSQL
});

const options = {
  hostname: `${projectRef}.supabase.co`,
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Executing migration...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Migration applied successfully!');
      console.log('📝 Response:', data || 'No response body');
    } else {
      console.error('❌ Migration failed with status:', res.statusCode);
      console.error('📝 Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error applying migration:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();
