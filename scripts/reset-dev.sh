#!/bin/bash

# Development Environment Reset Script
# Usage: ./scripts/reset-dev.sh [--full|--quick|--env]

echo "🔄 Take Off Credit Builder - Development Reset"
echo "=============================================="
echo ""

# Parse arguments
RESET_TYPE="${1:---quick}"

case "$RESET_TYPE" in
  --full)
    echo "📋 Running FULL RESET (Browser + Database + Server)"
    echo ""
    
    echo "⚠️  WARNING: This will DELETE ALL test data from your database!"
    echo "   Press Ctrl+C to cancel, or Enter to continue..."
    read
    
    echo ""
    echo "1️⃣  Restarting server..."
    pm2 restart all
    
    echo ""
    echo "2️⃣  Database cleanup..."
    echo "   → Please manually clear these tables in Supabase:"
    echo "     • payments"
    echo "     • user_booster_accounts"
    echo "     • user_personal_info"
    echo ""
    echo "   OR run this SQL in Supabase SQL Editor:"
    echo ""
    echo "   DELETE FROM payments;"
    echo "   DELETE FROM user_booster_accounts;"
    echo "   DELETE FROM user_personal_info;"
    echo ""
    
    echo "3️⃣  Browser cleanup instructions:"
    echo "   → Open browser console (F12)"
    echo "   → Run: localStorage.clear(); sessionStorage.clear();"
    echo "   → Navigate to: http://localhost:3000"
    echo ""
    ;;
    
  --quick)
    echo "📋 Running QUICK RESET (Browser State Only)"
    echo ""
    
    echo "1️⃣  Server status:"
    pm2 list
    
    echo ""
    echo "2️⃣  Browser cleanup instructions:"
    echo "   → Open browser console (F12)"
    echo "   → Run: localStorage.clear(); sessionStorage.clear(); window.location.href='/';"
    echo ""
    ;;
    
  --env)
    echo "📋 Running ENV RESET (Environment Variables + Server)"
    echo ""
    
    echo "1️⃣  Restarting server to pick up .env.local changes..."
    pm2 restart all
    
    echo ""
    echo "2️⃣  Clearing server logs..."
    pm2 flush
    
    echo ""
    echo "3️⃣  Browser cleanup instructions:"
    echo "   → Open browser DevTools (F12)"
    echo "   → Application tab → Storage → Clear site data"
    echo "   → Navigate to: http://localhost:3000"
    echo ""
    ;;
    
  *)
    echo "❌ Unknown reset type: $RESET_TYPE"
    echo ""
    echo "Usage: ./scripts/reset-dev.sh [--full|--quick|--env]"
    echo ""
    echo "Options:"
    echo "  --quick    Browser state only (default)"
    echo "  --full     Browser + Database + Server"
    echo "  --env      Environment variables + Server restart"
    echo ""
    exit 1
    ;;
esac

echo "✅ Reset instructions provided!"
echo ""
echo "📚 For more details, see DEVELOPMENT_GUIDE.md"
