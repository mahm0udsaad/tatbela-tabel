#!/bin/bash

# Apply the B2B search migration directly to the database
# This script uses curl to send the SQL to Supabase

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's/https?:\/\/([^.]+).*/\1/')

echo "📦 Applying migration: 20260124000000_allow_b2b_products_in_public_search.sql"
echo "🔗 Project: $PROJECT_REF"
echo "🚀 Executing migration..."
echo ""

# Read the migration SQL
MIGRATION_SQL=$(cat supabase/migrations/20260124000000_allow_b2b_products_in_public_search.sql)

# Execute via psql if available
if command -v psql &> /dev/null; then
    echo "Using psql to execute migration..."
    PGPASSWORD="$SUPABASE_POSTGRES_PASSWORD" psql "$SUPABASE_POSTGRES_URL_NON_POOLING" -c "$MIGRATION_SQL"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migration applied successfully!"
        exit 0
    else
        echo ""
        echo "❌ Migration failed!"
        exit 1
    fi
else
    echo "❌ psql not found. Please install PostgreSQL client or apply the migration manually:"
    echo ""
    echo "1. Go to your Supabase Dashboard > SQL Editor"
    echo "2. Open the file: supabase/migrations/20260124000000_allow_b2b_products_in_public_search.sql"
    echo "3. Copy and paste the SQL"
    echo "4. Run the migration"
    exit 1
fi
