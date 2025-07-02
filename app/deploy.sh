#!/bin/bash

# Wager AI Betting Assistant v2.0 - Automated Deployment Script

echo "🚀 Starting Wager AI Betting Assistant v2.0 deployment..."

# Set environment variables
export PATH=$PATH:/home/ubuntu/.npm-global/bin
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
export NEXTAUTH_URL="https://wager-ai-assistant.vercel.app"

echo "✅ Environment variables configured"

# Create Vercel project configuration
echo "📦 Setting up Vercel project..."

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod --yes --confirm

echo "✅ Deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Set up your database using one of the providers in deploy-instructions.md"
echo "2. Add environment variables in Vercel dashboard"
echo "3. Run 'npx prisma db push' and 'npx prisma db seed'"
echo ""
echo "🔑 Default login: john@doe.com / johndoe123"
