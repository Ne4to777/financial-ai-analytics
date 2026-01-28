#!/bin/bash

# Fix ESM imports by adding .js extension to relative imports in TypeScript files

echo "🔧 Fixing ESM imports in TypeScript files..."

# Find all .ts files (excluding test files) and fix imports
find src -name "*.ts" ! -name "*.test.ts" -type f | while read file; do
  # Check if file has imports without .js
  if grep -q "from ['\"]\..*[^s]['\"]" "$file" 2>/dev/null; then
    echo "Fixing: $file"
    
    # Add .js to relative imports that don't already have it
    # Pattern: from './xxx' or from '../xxx' → from './xxx.js' or from '../xxx.js'
    sed -i '' -E "s/from (['\"])(\.\.?\/[^'\"]+)(['\"])/from \1\2.js\3/g" "$file"
    
    # Fix double .js.js if it occurs
    sed -i '' "s/\.js\.js/\.js/g" "$file"
  fi
done

echo "✅ Done! ESM imports fixed."
