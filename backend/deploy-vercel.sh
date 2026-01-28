#!/bin/bash

# CSV Processing API - Vercel Deployment Script
# This script helps you deploy to Vercel with proper configuration

set -e

echo "🚀 CSV Processing API - Vercel Deployment"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Run ./setup-supabase.sh first to configure Supabase"
    exit 1
fi

# Load .env
set -a
source .env
set +a

# Validate Supabase config
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env"
    exit 1
fi

echo "✅ Environment configuration found"
echo ""

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found"
    echo "Install it with: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found: $(vercel --version | head -1)"
echo ""

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Not logged in to Vercel. Logging in..."
    vercel login
else
    VERCEL_USER=$(vercel whoami)
    echo "✅ Logged in as: $VERCEL_USER"
fi

echo ""
echo "📦 Building TypeScript..."
npm run build

if [ ! -f dist/serverless.js ]; then
    echo "❌ Error: dist/serverless.js not found after build"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Check if project exists
echo "🔍 Checking for existing Vercel project..."
if [ -f .vercel/project.json ]; then
    PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Found existing project: $PROJECT_ID"
    FIRST_DEPLOY=false
else
    echo "📝 This is your first deployment"
    FIRST_DEPLOY=true
fi

echo ""
echo "🚀 Deploying to Vercel..."
echo ""

if [ "$FIRST_DEPLOY" = true ]; then
    echo "This will create a new Vercel project."
    echo "You'll be asked a few questions..."
    echo ""
    
    # First deployment with environment variables
    vercel --yes \
        --env SUPABASE_URL="$SUPABASE_URL" \
        --env SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
        --env NODE_ENV=production \
        --env LOG_LEVEL=info
    
    echo ""
    echo "📝 Setting up production environment variables..."
    
    # Set production variables
    echo "$SUPABASE_URL" | vercel env add SUPABASE_URL production
    echo "$SUPABASE_ANON_KEY" | vercel env add SUPABASE_ANON_KEY production
    echo "production" | vercel env add NODE_ENV production
    echo "info" | vercel env add LOG_LEVEL production
    
    echo ""
    echo "🚀 Deploying to production..."
    vercel --prod
else
    # Subsequent deployments
    vercel --prod
fi

echo ""
echo "✅ Deployment complete!"
echo ""

# Get deployment URL
echo "📝 Getting deployment URL..."
DEPLOYMENT_URL=$(vercel inspect --wait | grep -o 'https://[^[:space:]]*' | head -1)

if [ -z "$DEPLOYMENT_URL" ]; then
    echo "⚠️  Could not automatically get URL"
    echo "Check your deployment at: https://vercel.com/dashboard"
else
    echo "🌐 Your API is live at:"
    echo "   $DEPLOYMENT_URL"
    echo ""
    echo "📋 Testing endpoints:"
    
    # Test health endpoint
    echo ""
    echo "1. Health check:"
    echo "   curl $DEPLOYMENT_URL/health"
    
    if command -v curl &> /dev/null; then
        echo ""
        HEALTH_RESPONSE=$(curl -s "$DEPLOYMENT_URL/health" || echo "Failed to connect")
        echo "   Response: $HEALTH_RESPONSE"
    fi
    
    echo ""
    echo "2. API info:"
    echo "   curl $DEPLOYMENT_URL/"
    
    echo ""
    echo "3. Swagger docs:"
    echo "   $DEPLOYMENT_URL/docs"
    
    echo ""
    echo "4. Test upload:"
    echo "   curl -X POST $DEPLOYMENT_URL/upload \\"
    echo "     -F \"file=@test.csv\""
fi

echo ""
echo "📖 Documentation:"
echo "  - API docs: $DEPLOYMENT_URL/docs"
echo "  - Full guide: ../VERCEL_DEPLOY.md"
echo ""
echo "🎉 Deployment successful!"
echo ""
