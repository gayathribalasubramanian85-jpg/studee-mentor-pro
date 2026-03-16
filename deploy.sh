#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo "📝 Uncommitted changes found. Committing..."
    git add .
    echo "Enter commit message (or press Enter for default):"
    read commit_message
    if [ -z "$commit_message" ]; then
        commit_message="Deploy: Updated application with latest changes"
    fi
    git commit -m "$commit_message"
else
    echo "✅ Git is clean, no changes to commit"
fi

# Push to main branch
echo "📤 Pushing to main branch..."
git push origin main

# Check deployment platform and deploy
echo "🔍 Detecting deployment platform..."

if command -v vercel &> /dev/null; then
    echo "🟢 Deploying to Vercel..."
    vercel --prod
elif command -v railway &> /dev/null; then
    echo "🟣 Deploying to Railway..."
    railway up
elif command -v heroku &> /dev/null; then
    echo "🟪 Deploying to Heroku..."
    git push heroku main
else
    echo "⚠️  No deployment CLI found. Please deploy manually through your platform's dashboard."
fi

echo "✅ Deployment process completed!"
echo "🧪 Don't forget to test your email functionality at: /api/test/test-email"