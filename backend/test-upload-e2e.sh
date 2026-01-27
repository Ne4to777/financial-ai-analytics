#!/bin/bash

# E2E Upload Test Script
# Tests the complete upload flow

set -e

echo "🧪 Starting E2E Upload Tests..."
echo ""

# Start server in background
echo "📦 Starting server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 3

BASE_URL="http://localhost:3001"

# Test 1: Upload valid CSV
echo "✅ Test 1: Upload valid CSV file..."
curl -s -X POST "$BASE_URL/api/upload" \
  -F "file=@tests/fixtures/valid.csv" \
  | jq '.success, .data.uploadId, .data.csv.totalRows' || echo "❌ Test 1 failed"

echo ""

# Test 2: Upload file with missing columns
echo "❌ Test 2: Upload CSV with missing columns (should fail)..."
curl -s -X POST "$BASE_URL/api/upload" \
  -F "file=@tests/fixtures/missing-columns.csv" \
  | jq '.success, .error.code' || echo "❌ Test 2 failed"

echo ""

# Test 3: Upload non-CSV file
echo "❌ Test 3: Upload non-CSV file (should fail)..."
echo "This is not CSV" > /tmp/test.txt
curl -s -X POST "$BASE_URL/api/upload" \
  -F "file=@/tmp/test.txt" \
  | jq '.success, .error.code' || echo "❌ Test 3 failed"

echo ""

# Test 4: Health check
echo "❤️  Test 4: Health check..."
curl -s "$BASE_URL/health" | jq '.status' || echo "❌ Test 4 failed"

echo ""

# Clean up
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
rm -f /tmp/test.txt
wait $SERVER_PID 2>/dev/null || true

echo ""
echo "✨ E2E Tests Complete!"
