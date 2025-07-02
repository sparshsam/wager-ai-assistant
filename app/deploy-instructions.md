# Wager AI Betting Assistant v2.0 - Deployment Instructions

## Quick Deploy to Vercel

1. **GitHub Repository Setup**
   - Create a new repository on GitHub named "wager-ai-assistant"
   - Push this code to the repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/wager-ai-assistant.git
   git push -u origin main
   ```

2. **Database Setup (Choose one option)**

   **Option A: Supabase (Recommended)**
   - Go to https://supabase.com
   - Create a new project
   - Copy the database URL from Settings > Database
   
   **Option B: Railway**
   - Go to https://railway.app
   - Create new project > Add PostgreSQL
   - Copy the connection string

   **Option C: Render**
   - Go to https://render.com
   - Create new PostgreSQL database (free tier)
   - Copy the external database URL

3. **Vercel Deployment**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Set environment variables:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
     - `NEXTAUTH_URL`: Your Vercel app URL (e.g., https://your-app.vercel.app)
     - `OPENAI_API_KEY`: Your OpenAI API key

4. **Database Schema Setup**
   After deployment, run these commands locally:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

## Environment Variables Template

```env
DATABASE_URL="postgresql://username:password@host:port/database"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="https://your-app.vercel.app"
OPENAI_API_KEY="sk-your-openai-key"
```

## Default Login Credentials
- Email: john@doe.com
- Password: johndoe123

## Features Included
- Authentication system with NextAuth.js
- League schedule management and uploads
- Betting script management and uploads
- CIS (Comprehensive Information Summary) generation with GPT integration
- Manual stats input and injury validation
- Betting script execution and pick generation
- Pick logging and export functionality
- Responsive dashboard with modern UI
