#!/bin/bash
# Quick Test Script for Agbejo Features

echo "🧪 Agbejo Feature Testing"
echo "========================"
echo ""

# Check if server is running
echo "1. Checking if dev server is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Start with: npm run dev"
    exit 1
fi

echo ""
echo "2. Testing API Endpoints..."
echo ""

# Test get all deals
echo "Testing GET /api/deals..."
curl -s http://localhost:3000/api/deals | jq '.' > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ GET /api/deals - OK"
else
    echo "❌ GET /api/deals - FAILED"
fi

# Test reputation endpoint
echo "Testing GET /api/reputation..."
curl -s "http://localhost:3000/api/reputation?accountId=0.0.12345&type=seller" | jq '.' > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ GET /api/reputation - OK"
else
    echo "❌ GET /api/reputation - FAILED"
fi

# Test on-ramp endpoint
echo "Testing POST /api/onramp/url..."
curl -s -X POST http://localhost:3000/api/onramp/url \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"currency":"HBAR","walletAddress":"0.0.12345"}' | jq '.' > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ POST /api/onramp/url - OK"
else
    echo "❌ POST /api/onramp/url - FAILED"
fi

echo ""
echo "3. Testing Frontend Routes..."
echo ""

# Test public deal page route exists
if curl -s http://localhost:3000/deal/test-deal-123 | grep -q "Deal"; then
    echo "✅ Public deal page route - OK"
else
    echo "⚠️  Public deal page route - Check manually"
fi

echo ""
echo "✅ Quick tests complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Connect your wallet"
echo "3. Create a test deal"
echo "4. Test all features according to TESTING_GUIDE.md"

