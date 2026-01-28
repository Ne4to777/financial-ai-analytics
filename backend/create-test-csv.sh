#!/bin/bash

# Create test CSV file for upload testing

echo "📝 Creating test CSV file..."

cat > test.csv << 'EOF'
Date,Description,Amount,Category
2024-01-15,Grocery Store,50.00,Food
2024-01-16,Gas Station,30.00,Transport
2024-01-17,Restaurant Lunch,25.50,Food
2024-01-18,Movie Tickets,15.00,Entertainment
2024-01-19,Coffee Shop,4.50,Food
2024-01-20,Uber Ride,12.00,Transport
2024-01-21,Grocery Store,75.25,Food
2024-01-22,Phone Bill,45.00,Utilities
2024-01-23,Gym Membership,50.00,Health
2024-01-24,Book Purchase,20.00,Entertainment
EOF

echo "✅ test.csv created with 10 sample transactions"
echo ""
echo "File contents:"
head -5 test.csv
echo "..."
echo ""
echo "You can now test with:"
echo "  curl -X POST http://localhost:3001/upload -F \"file=@test.csv\""
echo ""
