#!/usr/bin/env node

/**
 * Apply the B2B search migration directly to the database
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const connectionString = process.env.SUPABASE_POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error('❌ Missing SUPABASE_POSTGRES_URL_NON_POOLING in .env file');
  process.exit(1);
}

// Read the migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260124000000_allow_b2b_products_in_public_search.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('📦 Applying migration: 20260124000000_allow_b2b_products_in_public_search.sql');
console.log('🔗 Database connection configured');
console.log('🚀 Executing migration...\n');

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const result = await client.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    console.log('📝 Result:', result.command || 'Function created');
    
  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    console.error('Details:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
