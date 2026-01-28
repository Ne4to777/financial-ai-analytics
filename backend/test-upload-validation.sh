#!/bin/bash

# Test upload route with validation
# This script tests the enhanced upload route with row validation and business rules

set -e

echo "🧪 Testing Upload Route with Validation"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create test CSV files
TEST_DIR="test-validation-upload"
mkdir -p "$TEST_DIR"

# Test 1: Valid CSV with all valid data
echo -e "${BLUE}Test 1: Valid CSV with all valid data${NC}"
cat > "$TEST_DIR/valid.csv" << 'EOF'
date,amount,category,description
2024-01-15,1500.00,Salary,Monthly payment
2024-01-16,-50.00,Groceries,Weekly shopping
2024-01-17,100.50,Transport,Taxi fare
EOF

# Test 2: CSV with validation errors
echo -e "${BLUE}Test 2: CSV with validation errors${NC}"
cat > "$TEST_DIR/with-errors.csv" << 'EOF'
date,amount,category,description
2024-01-15,100.00,Food,Valid row
invalid-date,50.00,Transport,Invalid date
2024-01-17,0.001,Shopping,Amount too small
2024-01-18,abc,Other,Invalid amount
EOF

# Test 3: CSV with business rule warnings
echo -e "${BLUE}Test 3: CSV with duplicates and unusual amounts${NC}"
cat > "$TEST_DIR/with-warnings.csv" << 'EOF'
date,amount,category,description
2024-01-15,100.00,Food,First purchase
2024-01-15,100.00,Food,Duplicate purchase
2024-01-16,15000.00,Income,Unusual large amount
2024-01-17,50.00,UnknownCategory,Unknown category warning
EOF

# Start server in background
echo ""
echo -e "${YELLOW}Starting server...${NC}"
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Wait for server to start
echo "Waiting for server to be ready..."
sleep 3

# Function to make request and check response
test_upload() {
  local file=$1
  local test_name=$2
  
  echo ""
  echo -e "${BLUE}Testing: $test_name${NC}"
  echo "File: $file"
  
  response=$(curl -s -X POST http://localhost:3001/upload \
    -F "file=@$file" \
    -H "Accept: application/json")
  
  # Check if response is valid JSON
  if echo "$response" | jq empty 2>/dev/null; then
    echo -e "${GREEN}✓ Valid JSON response${NC}"
    
    # Extract key metrics
    success=$(echo "$response" | jq -r '.success')
    total=$(echo "$response" | jq -r '.data.statistics.totalRows // 0')
    valid=$(echo "$response" | jq -r '.data.statistics.validRows // 0')
    invalid=$(echo "$response" | jq -r '.data.statistics.invalidRows // 0')
    warnings=$(echo "$response" | jq -r '.data.statistics.warnings // 0')
    
    echo "  Success: $success"
    echo "  Total Rows: $total"
    echo "  Valid Rows: $valid"
    echo "  Invalid Rows: $invalid"
    echo "  Warnings: $warnings"
    
    # Check if validation field exists
    if echo "$response" | jq -e '.data.validation' > /dev/null 2>&1; then
      echo -e "${GREEN}  ✓ Validation data present${NC}"
      
      successRate=$(echo "$response" | jq -r '.data.validation.successRate')
      businessWarnings=$(echo "$response" | jq -r '.data.validation.businessRuleWarnings | length')
      
      echo "  Success Rate: $successRate%"
      echo "  Business Rule Warnings: $businessWarnings"
      
      # Show common errors if any
      commonErrorsCount=$(echo "$response" | jq -r '.data.validation.commonErrors | length')
      if [ "$commonErrorsCount" -gt 0 ]; then
        echo "  Common Errors:"
        echo "$response" | jq -r '.data.validation.commonErrors[] | "    - \(.field): \(.message) (count: \(.count))"'
      fi
      
      # Show business rule warnings summary
      if [ "$businessWarnings" -gt 0 ]; then
        echo "  Business Rule Warnings:"
        echo "$response" | jq -r '.data.validation.businessRuleWarnings[] | "    - Row \(.row): \(.code) - \(.message)"' | head -5
      fi
    else
      echo -e "${RED}  ✗ Validation data missing${NC}"
    fi
    
    # Check preview has validation status
    previewCount=$(echo "$response" | jq -r '.data.preview | length')
    if [ "$previewCount" -gt 0 ]; then
      hasValidation=$(echo "$response" | jq -r '.data.preview[0] | has("_validation")')
      if [ "$hasValidation" = "true" ]; then
        echo -e "${GREEN}  ✓ Preview includes validation status${NC}"
      else
        echo -e "${YELLOW}  ! Preview missing validation status${NC}"
      fi
    fi
    
  else
    echo -e "${RED}✗ Invalid JSON response${NC}"
    echo "$response"
  fi
}

# Run tests
test_upload "$TEST_DIR/valid.csv" "All valid data"
test_upload "$TEST_DIR/with-errors.csv" "With validation errors"
test_upload "$TEST_DIR/with-warnings.csv" "With business rule warnings"

# Cleanup
echo ""
echo -e "${YELLOW}Cleaning up...${NC}"
kill $SERVER_PID 2>/dev/null || true
rm -rf "$TEST_DIR"

echo ""
echo -e "${GREEN}✓ Tests completed!${NC}"
