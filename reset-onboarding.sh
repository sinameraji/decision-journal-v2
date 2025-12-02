#!/bin/bash

# Script to reset onboarding state for testing
# Run this before testing the new onboarding flow

echo "🔄 Resetting onboarding state..."

# Reset SQLite database (desktop mode)
DB_PATH="$HOME/Library/Application Support/com.sinameraji.decisionjournal/decision-journal.db"

if [ -f "$DB_PATH" ]; then
  echo "📦 Found database at: $DB_PATH"
  sqlite3 "$DB_PATH" "UPDATE user_preferences SET onboarding_completed_at = NULL WHERE id = 'singleton';" 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ Database onboarding state cleared"
  else
    echo "⚠️  Failed to update database (this is OK if app hasn't been run yet)"
  fi
else
  echo "ℹ️  Database not found (this is OK if app hasn't been run yet)"
fi

echo ""
echo "✨ Database onboarding state reset complete!"
echo ""
echo "⚠️  IMPORTANT: You must also clear localStorage!"
echo ""
echo "The app caches UI state in localStorage which must be cleared separately."
echo ""
echo "Option 1 - Run this in the browser DevTools console:"
echo "  localStorage.removeItem('decision-journal-storage')"
echo "  location.reload()"
echo ""
echo "Option 2 - Visit this page in your browser:"
echo "  http://localhost:5173/reset-onboarding-browser.html"
echo "  (Click 'Reset Onboarding' button)"
echo ""
echo "📋 Next steps:"
echo "  1. Clear localStorage using one of the options above"
echo "  2. Close the Decision Journal app if it's running"
echo "  3. Run: npm run tauri:dev"
echo "  4. The app should show the new 5-step onboarding flow"
echo ""
echo "🧪 Test scenarios:"
echo "  - Fresh install (no Ollama): See platform-specific instructions"
echo "  - Ollama running: Step 2 should auto-detect and advance"
echo "  - Model download: See progress bar if no models installed"
echo "  - Permissions: Test notifications and microphone (both optional)"
echo "  - Dark mode: Toggle and verify Matrix green theme"
echo ""
