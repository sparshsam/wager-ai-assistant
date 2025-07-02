# Wager AI Betting Assistant v2.0

A comprehensive AI-powered betting assistant built with Next.js 14, TypeScript, and modern web technologies.

## 🚀 One-Click Deploy to Vercel

[![Deploy with Vercel](https://b1410584.smushcdn.com/1410584/wp-content/uploads/2022/11/v2-1024x727.png?lossy=0&strip=1&webp=1)

## 🎯 Features

- **Authentication System**: Secure login/registration with NextAuth.js
- **League Schedule Management**: Upload and manage sports schedules
- **Betting Script Management**: Upload and manage betting strategies
- **CIS Generation**: AI-powered Comprehensive Information Summary
- **Manual Stats Input**: Input and validate team/player statistics
- **Betting Script Execution**: Execute betting strategies with AI analysis
- **Pick Logging**: Track and export betting picks and results
- **Responsive Dashboard**: Modern UI with dark/light theme support

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **AI Integration**: OpenAI GPT-4
- **UI Components**: Radix UI + shadcn/ui
- **Deployment**: Vercel

## 📋 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# AI Integration
OPENAI_API_KEY="sk-your-openai-api-key"
```

## 🗄 Database Setup

### Option 1: Supabase (Recommended)
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Copy the database URL from Settings > Database

### Option 2: Railway
1. Go to [Railway](https://railway.app)
2. Create new project > Add PostgreSQL
3. Copy the connection string

### Option 3: Render
1. Go to [Render](https://render.com)
2. Create new PostgreSQL database
3. Copy the external database URL

## 🚀 Local Development

1. Clone the repository:
```bash
git clone https://github.com/your-username/wager-ai-assistant.git
cd wager-ai-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see above)

4. Set up the database:
```bash
npx prisma db push
npx prisma db seed
```

5. Start the development server:
```bash
npm run dev
```

## 🔑 Default Login

- **Email**: john@doe.com
- **Password**: johndoe123

## 📱 Usage

1. **Login**: Use the default credentials or register a new account
2. **Upload Schedules**: Go to League Schedules and upload CSV/Excel files
3. **Upload Scripts**: Go to Betting Scripts and upload your betting strategies
4. **Generate CIS**: Use the CIS Generator for AI-powered analysis
5. **Execute Scripts**: Run betting scripts against your data
6. **Log Picks**: Track your betting picks and results

## 🔧 API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `GET/POST /api/schedules` - Schedule management
- `GET/POST /api/scripts` - Script management
- `POST /api/generate-cis` - CIS generation
- `POST /api/execute-betting-script` - Script execution
- `GET/POST /api/picks` - Pick management

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, please open an issue on GitHub or contact the development team.
