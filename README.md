# Smart Expense Tracker

🚀 **Production-Ready** AI-powered personal finance management platform with real-time analytics, intelligent insights, and advanced expense tracking.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)

> **📖 For comprehensive documentation, see [PRODUCTION_README.md](PRODUCTION_README.md)**

## ✨ Key Features

### 💰 Complete Expense Management

- Full CRUD operations with validation
- Category organization with custom icons
- Receipt upload with OCR text extraction
- Bulk export (CSV, PDF, Excel)
- Infinite scroll pagination

### 🤖 AI-Powered Intelligence

- **Conversational Chatbot** with voice input support
- Natural language expense queries
- Personalized financial insights
- Chat history persistence
- Smart categorization suggestions

### 📊 Advanced Analytics

- Interactive spending trends charts
- Category breakdown visualizations
- Monthly comparisons & forecasts
- Top merchants analysis
- Custom time range filtering
- Exportable reports (PDF/Excel)

### 🔄 Automation Features

- **Recurring Expenses** (bills, subscriptions)
- Auto-generation based on frequency
- **Smart Alerts** at 75%, 90%, 100% budget
- Budget performance tracking
- Email/SMS notifications

### 🎨 Modern UI/UX

- Beautiful dark theme with glassmorphism
- Sidebar navigation (fixed/collapsible)
- Responsive mobile-first design
- Loading states & skeleton loaders
- Toast notifications
- Purple/blue gradient branding

### 🛡️ Security & Performance

- Input validation with Zod schemas
- Rate limiting (100 req/min)
- Row-level security (RLS)
- SQL injection protection
- Server components optimization
- React Query caching

## Features

- 📊 **Smart Analytics** - Real-time insights into spending patterns
- 🤖 **AI Assistant** - Powered by Gemini 2.0 Flash for personalized financial advice
- 💰 **Expense Tracking** - Easy-to-use expense management
- 📈 **Visual Reports** - Interactive charts and graphs
- 📁 **Export** - Download CSV reports
- 🔒 **Secure Auth** - Supabase authentication with RLS
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([sign up free](https://supabase.com))
- Google Gemini API key ([get one here](https://ai.google.dev))

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd smart-expense-tracker

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# 4. Set up Supabase database
# Run supabase-schema.sql in Supabase SQL Editor
# Run supabase-chat-history.sql
# Run supabase-fix-profiles.sql (if needed)

# 5. Run development server
npm run dev

# 6. Open http://localhost:3000
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

## 📁 Project Structure

```
app/
├── (auth)/              # Authentication pages
├── dashboard/           # Main app pages
├── api/                 # API routes
└── layout.tsx           # Root layout

components/
├── layout/              # Layout components
├── dashboard/           # Dashboard widgets
├── charts/              # Visualization components
├── chatbot/             # AI assistant
└── ui/                  # shadcn/ui components

lib/
├── supabase.ts          # Database client
├── gemini.ts            # AI integration
├── validations.ts       # Zod schemas
└── rate-limit.ts        # API protection
```

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui (Radix UI)
- **Charts**: Recharts
- **State**: React Query (@tanstack/react-query)
- **Forms**: React Hook Form + Zod

### Backend

- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: Google Gemini 1.5 Flash
- **OCR**: Tesseract.js

## 📚 Documentation

- **[PRODUCTION_README.md](PRODUCTION_README.md)** - Comprehensive production guide
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Database setup instructions
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

## 🎯 API Endpoints

| Method | Endpoint               | Description               |
| ------ | ---------------------- | ------------------------- |
| GET    | `/api/expenses`        | List expenses (paginated) |
| POST   | `/api/expenses`        | Create expense            |
| PATCH  | `/api/expenses`        | Update expense            |
| DELETE | `/api/expenses`        | Delete expense            |
| GET    | `/api/analytics`       | Get analytics data        |
| POST   | `/api/budgets`         | Create budget             |
| GET    | `/api/alerts`          | List alerts               |
| POST   | `/api/ai/chat`         | AI chatbot                |
| POST   | `/api/receipts/upload` | Upload receipt with OCR   |
| POST   | `/api/export`          | Export expenses           |

## 🔐 Security Features

- ✅ Input validation with Zod
- ✅ Rate limiting (100 req/min)
- ✅ SQL injection protection
- ✅ XSS prevention (CSP headers)
- ✅ CSRF protection
- ✅ Row-level security (RLS)
- ✅ Environment validation
- ✅ Secure authentication (JWT)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd smart-expense-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and paste the contents of `supabase-schema.sql`
3. Execute the SQL to create tables, views, and policies
4. Get your project URL and anon key from Settings > API

### 4. Set up Gemini API

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Copy `.env.local.example` to `.env.local`
3. Fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Fix Profile Issues (If Needed)

If you get a "foreign key constraint" error when adding expenses:

**Option A - Automatic Fix**:
Visit http://localhost:3001/fix-profile and it will automatically create your profile.

**Option B - Manual Fix**:
Run `supabase-fix-profiles.sql` in Supabase SQL Editor to fix existing users and improve the trigger.

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more details.

## Project Structure

```
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page
│   │   └── signup/         # Signup page
│   ├── dashboard/
│   │   ├── page.tsx        # Main dashboard
│   │   ├── expenses/       # Expense management
│   │   └── analytics/      # Analytics page
│   ├── api/
│   │   ├── expenses/       # Expense CRUD
│   │   ├── analytics/      # Analytics data
│   │   ├── ai/chat/        # AI chatbot
│   │   └── export/         # CSV export
│   └── layout.tsx
├── components/
│   ├── layout/             # Layout components
│   ├── dashboard/          # Dashboard widgets
│   ├── charts/             # Chart components
│   ├── modals/             # Modal dialogs
│   └── chatbot/            # AI chatbot UI
├── lib/
│   ├── supabase.ts         # Supabase client
│   └── gemini.ts           # Gemini AI integration
└── supabase-schema.sql     # Database schema
```

## Key Features Explained

### Database Architecture

- **Row Level Security (RLS)** - Users can only access their own data
- **Automatic profile creation** - Triggered on user signup
- **Optimized views** - Pre-computed analytics for performance
- **Budget alerts** - Automatic notifications when limits exceeded

### AI Integration

- Uses Gemini 2.0 Flash for fast, accurate responses
- Context-aware prompts with user spending data
- Cached insights to reduce API calls
- Non-judgmental, actionable advice

### Export System

- CSV format with full transaction history
- Filterable by date range and categories
- Clean, professional formatting

## API Endpoints

### Expenses

- `GET /api/expenses` - List expenses with filters
- `POST /api/expenses` - Create new expense

### Analytics

- `GET /api/analytics?type=monthly` - Monthly summary
- `GET /api/analytics?type=categories` - Category breakdown

### AI

- `POST /api/ai/chat` - Chat with AI assistant

### Export

- `POST /api/export` - Generate CSV export

## Security

- All API routes require authentication
- Row Level Security on all tables
- Environment variables for sensitive data
- Secure password hashing via Supabase Auth

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

## Future Enhancements

- [ ] PDF export with charts
- [ ] Budget management UI
- [ ] Recurring expenses
- [ ] Multi-currency support
- [ ] Mobile app (React Native)
- [ ] Receipt scanning with OCR
- [ ] Bank integration
- [ ] Shared budgets for families

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first.
