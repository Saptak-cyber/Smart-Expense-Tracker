# Smart Expense Tracker - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account with project created
- Google Gemini API key
- Vercel account (for deployment)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd smart-expense-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Database Setup

1. Go to your Supabase Dashboard → SQL Editor
2. Run the following SQL files in order:
   - `supabase-schema.sql` - Creates all tables and RLS policies
   - `supabase-chat-history.sql` - Adds AI chat persistence
   - `supabase-fix-profiles.sql` - Ensures profile creation trigger

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

### Option 1: Vercel (Recommended)

#### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/smart-expense-tracker)

#### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   
   In Vercel Dashboard → Project Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`

5. **Redeploy**
   ```bash
   vercel --prod
   ```

### Option 2: Docker

1. **Build Docker Image**
   ```bash
   docker build -t expense-tracker .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_SUPABASE_URL=your_url \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
     -e GEMINI_API_KEY=your_key \
     expense-tracker
   ```

### Option 3: VPS (DigitalOcean, AWS, etc.)

1. **SSH into your server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Clone repository**
   ```bash
   git clone <your-repo-url>
   cd smart-expense-tracker
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create environment file**
   ```bash
   nano .env.local
   # Add your environment variables
   ```

5. **Build application**
   ```bash
   npm run build
   ```

6. **Install PM2**
   ```bash
   npm install -g pm2
   ```

7. **Start application**
   ```bash
   pm2 start npm --name "expense-tracker" -- start
   pm2 save
   pm2 startup
   ```

8. **Setup Nginx as reverse proxy**
   ```bash
   sudo nano /etc/nginx/sites-available/expense-tracker
   ```

   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/expense-tracker /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

9. **Setup SSL with Let's Encrypt**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## CI/CD Pipeline

### GitHub Actions Setup

The project includes a CI/CD pipeline in `.github/workflows/ci-cd.yml`.

**Required GitHub Secrets:**

Go to Repository → Settings → Secrets and variables → Actions:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `VERCEL_TOKEN` (from Vercel account settings)
- `VERCEL_ORG_ID` (from Vercel project settings)
- `VERCEL_PROJECT_ID` (from Vercel project settings)

### Pipeline Stages

1. **Lint & Type Check** - Validates code quality
2. **Build** - Compiles Next.js application
3. **Deploy** - Deploys to Vercel (main branch only)
4. **Lighthouse** - Runs performance audit

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run successfully
- [ ] Test user signup and login
- [ ] Test expense creation
- [ ] Verify AI chatbot functionality
- [ ] Check receipt upload and OCR
- [ ] Test all CRUD operations
- [ ] Verify analytics dashboard
- [ ] Check mobile responsiveness
- [ ] Test PWA functionality
- [ ] Run Lighthouse audit (target: >90 score)
- [ ] Setup error monitoring (Sentry)
- [ ] Configure backup strategy
- [ ] Setup uptime monitoring

## Database Backups

### Automated Backups (Supabase)

Supabase provides automatic daily backups for paid plans. For free tier:

1. Go to Supabase Dashboard → Database → Backups
2. Manually trigger backup before major changes

### Manual Backup

```bash
# Export database schema
supabase db dump --schema public > backup-schema.sql

# Export database data
supabase db dump --data-only > backup-data.sql
```

## Monitoring & Logs

### Vercel Logs

View logs in Vercel Dashboard → Project → Logs

### PM2 Logs (VPS)

```bash
pm2 logs expense-tracker
```

### Error Tracking with Sentry (Optional)

1. Create Sentry account
2. Install SDK:
   ```bash
   npm install @sentry/nextjs
   ```
3. Configure:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

## Performance Optimization

### Build Optimization

Already implemented:
- Server Components for reduced JavaScript
- Code splitting by route
- Image optimization with Next.js Image
- CSS purging with Tailwind

### Runtime Optimization

- Enable Vercel Edge Functions for API routes
- Use Vercel Edge Cache for static assets
- Enable compression in Nginx (VPS)

## Security Checklist

- [x] Environment variables secured
- [x] HTTPS enabled
- [x] Input validation with Zod
- [x] Rate limiting implemented
- [x] SQL injection protection (Parameterized queries)
- [x] XSS prevention (React escaping + CSP)
- [x] CSRF protection (Next.js built-in)
- [x] Row-level security (RLS)
- [ ] Regular dependency updates
- [ ] Security headers configured
- [ ] API authentication enforced

## Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

- Verify Supabase URL and keys
- Check RLS policies are correctly configured
- Ensure database is not paused (Supabase free tier)

### AI Chatbot Not Working

- Verify Gemini API key is valid
- Check API quota limits
- Review API route logs

### Receipt Upload Fails

- Verify file size < 5MB
- Check Supabase Storage bucket exists
- Ensure correct CORS configuration

## Scaling Considerations

### When to Scale

- > 1000 daily active users
- > 100 concurrent requests
- Database query times > 500ms

### Scaling Options

1. **Vercel Pro Plan**
   - Increased bandwidth
   - Better build times
   - Analytics included

2. **Supabase Pro Plan**
   - Dedicated database
   - Point-in-time recovery
   - Read replicas

3. **Edge Functions**
   - Move API routes to Edge
   - Reduce latency globally

4. **CDN Optimization**
   - Use Vercel Edge Network
   - Cache static assets aggressively

## Support

For issues and questions:
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Review [PRODUCTION_README.md](PRODUCTION_README.md)
- Open GitHub issue
- Contact: support@yourapp.com

## License

MIT License - See LICENSE file

---

**Last Updated:** 2026-02-09
**Version:** 1.0.0
