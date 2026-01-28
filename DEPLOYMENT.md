# CSV Processing API - Deployment Guide

## 🎯 Prerequisites

Before deploying, ensure you have:

1. **Supabase Project** (database)
2. **Node.js 18+** on deployment platform
3. **Environment variables** configured
4. **Git repository** access

---

## 📋 Pre-Deployment Checklist

- [ ] Database migrations run in production Supabase
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] Tests passing (`npm test`)
- [ ] TypeScript compiled (`npm run typecheck`)
- [ ] Production build tested locally

---

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Note your **Project URL** and **anon (public) key**

### Step 2: Run Migrations

1. Go to **SQL Editor** in Supabase Dashboard
2. Run migrations in order:

**Migration 1: Uploads Table**
```sql
-- Copy content from: backend/database/migrations/001_create_uploads_table.sql
-- Paste and execute in SQL Editor
```

**Migration 2: Transactions Table**
```sql
-- Copy content from: backend/database/migrations/002_create_transactions_table.sql
-- Paste and execute in SQL Editor
```

### Step 3: Verify Setup

Run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('uploads', 'transactions');
```

You should see both tables listed.

---

## 🔐 Environment Variables

Create `.env` file (or configure in hosting platform):

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Optional
PORT=3001
NODE_ENV=production
HOST=0.0.0.0
LOG_LEVEL=info
```

**⚠️ Security Notes:**
- Never commit `.env` to git (already in `.gitignore`)
- Use different Supabase projects for dev/staging/prod
- Rotate keys if exposed

---

## 🌐 Deployment Options

### Option 1: Railway (Recommended - Easiest)

**Why Railway:**
- ✅ Zero-config deployment
- ✅ Free tier: $1/month credit (Free Trial: $5 for 30 days)
- ✅ Automatic HTTPS
- ✅ Easy environment variables
- ✅ GitHub integration
- ✅ Pay-as-you-go after free credit

**Steps:**

1. **Install Railway CLI** (optional):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy via Dashboard:**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Set root directory to `/backend`
   - Add environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
   - Deploy!

3. **Or Deploy via CLI:**
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```

4. **Add Environment Variables:**
   ```bash
   railway variables set SUPABASE_URL=your-url
   railway variables set SUPABASE_ANON_KEY=your-key
   railway variables set NODE_ENV=production
   ```

5. **Get URL:**
   ```bash
   railway domain
   ```

**Build Command:** `npm install && npm run build`  
**Start Command:** `npm start`

---

### Option 2: Render

**Why Render:**
- ✅ Free tier: 512MB RAM (sleeps after 15min inactivity)
- ✅ Auto-deploy from GitHub
- ✅ Built-in SSL
- ✅ Easy scaling
- ✅ No credit card required for free tier

**Steps:**

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name:** csv-processing-api
   - **Root Directory:** backend
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or upgrade)

5. Add Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `NODE_ENV=production`

6. Click "Create Web Service"

**Note:** Free tier sleeps after 15 minutes of inactivity (50ms cold start).

---

### Option 3: Vercel (Serverless)

**Why Vercel:**
- ✅ Excellent for serverless
- ✅ Free tier with good limits
- ✅ Auto-scaling
- ✅ Global CDN

**Steps:**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Create `vercel.json` in backend:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/server.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. Deploy:
   ```bash
   cd backend
   npm run build
   vercel
   ```

4. Set environment variables:
   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_ANON_KEY
   ```

5. Redeploy:
   ```bash
   vercel --prod
   ```

---

### Option 4: Docker (Self-Hosted)

**Why Docker:**
- ✅ Consistent environments
- ✅ Easy rollbacks
- ✅ Portable
- ✅ Works anywhere

**Create `Dockerfile` in backend:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start app
CMD ["npm", "start"]
```

**Create `.dockerignore`:**
```
node_modules
dist
*.log
.env
.git
tests
*.md
```

**Build and Run:**
```bash
cd backend

# Build
docker build -t csv-processing-api .

# Run
docker run -d \
  -p 3001:3001 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_ANON_KEY=your-key \
  -e NODE_ENV=production \
  --name csv-api \
  csv-processing-api

# Check logs
docker logs -f csv-api

# Stop
docker stop csv-api
```

**Docker Compose (`docker-compose.yml`):**
```yaml
version: '3.8'

services:
  api:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
```

**Run with Docker Compose:**
```bash
docker-compose up -d
```

---

### Option 5: Traditional VPS (DigitalOcean, AWS, etc.)

**Prerequisites:**
- Ubuntu 22.04+ server
- SSH access
- Domain name (optional)

**Step 1: Setup Server**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install nginx (reverse proxy)
sudo apt install -y nginx

# Install certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

**Step 2: Deploy Application**

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/Ne4to777/financial-ai-analytics.git
cd financial-ai-analytics/backend

# Install dependencies
sudo npm ci --only=production

# Build
sudo npm run build

# Create .env
sudo nano .env
# Add: SUPABASE_URL, SUPABASE_ANON_KEY, NODE_ENV=production

# Start with PM2
sudo pm2 start dist/server.js --name csv-api
sudo pm2 startup
sudo pm2 save
```

**Step 3: Configure Nginx**

```bash
sudo nano /etc/nginx/sites-available/csv-api
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/csv-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL
sudo certbot --nginx -d your-domain.com
```

**Step 4: Configure Firewall**

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**Step 5: Setup Auto-Deploy (Optional)**

Create deploy script:
```bash
sudo nano /var/www/deploy.sh
```

```bash
#!/bin/bash
cd /var/www/financial-ai-analytics
git pull origin main
cd backend
npm ci --only=production
npm run build
pm2 restart csv-api
```

```bash
sudo chmod +x /var/www/deploy.sh
```

---

## 💰 Platform Pricing Comparison

| Platform | Free Tier | Resources | Limitations | Best For |
|----------|-----------|-----------|-------------|----------|
| **Railway** | $1/month credit<br>($5 for 30 days trial) | 1 vCPU<br>0.5GB RAM<br>0.5GB storage | Pay-as-you-go after credit | Quick prototypes<br>Pay for what you use |
| **Render** | ✅ Forever free | 512MB RAM<br>Shared CPU | Sleeps after 15min<br>Cold start ~50ms | Side projects<br>Low-traffic apps |
| **Vercel** | ✅ Forever free | Serverless<br>Auto-scaling | 100GB bandwidth/month<br>10s execution limit | Serverless APIs<br>High traffic spikes |
| **Docker** | Depends on host | Host-dependent | Infrastructure management | Full control<br>Self-hosted |
| **VPS** | From $5/month | 1GB+ RAM<br>1+ vCPU | Manual setup & maintenance | Production<br>Custom requirements |

**Recommendations:**
- **Starting out?** → Railway (free trial $5) or Render (forever free)
- **Need serverless?** → Vercel
- **Production ready?** → Railway (paid) or VPS
- **Full control?** → Docker on VPS

---

## 🔍 Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-api-url.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123.456,
  "environment": "production"
}
```

### 2. API Info
```bash
curl https://your-api-url.com/
```

### 3. Test Upload
```bash
curl -X POST https://your-api-url.com/api/upload \
  -F "file=@test.csv" \
  -H "Content-Type: multipart/form-data"
```

### 4. Check Logs

**Railway:** `railway logs`  
**Render:** Check dashboard  
**Vercel:** `vercel logs`  
**Docker:** `docker logs csv-api`  
**PM2:** `pm2 logs csv-api`

---

## 📊 Monitoring & Logging

### Application Logs

Logs are output via Pino in JSON format:
```json
{
  "level": 30,
  "time": 1705332600000,
  "msg": "Request completed",
  "req": {...},
  "res": {...}
}
```

**Log Levels:**
- `10` - trace
- `20` - debug
- `30` - info (default)
- `40` - warn
- `50` - error
- `60` - fatal

### Recommended Monitoring Tools

1. **Sentry** (Error Tracking)
   - Sign up at https://sentry.io
   - Add `@sentry/node` to dependencies
   - Configure in server.ts

2. **Datadog** (APM & Logs)
   - Comprehensive monitoring
   - Good for production

3. **Better Stack** (formerly Logtail)
   - Log aggregation
   - Easy setup

4. **UptimeRobot** (Uptime Monitoring)
   - Free tier
   - Ping `/health` endpoint every 5 minutes

---

## 🔒 Security Best Practices

### 1. Environment Variables
- ✅ Use secure vault (Railway Secrets, Render Environment Variables)
- ✅ Rotate Supabase keys regularly
- ✅ Different keys for dev/staging/prod

### 2. CORS Configuration
Update in production:
```typescript
await fastify.register(cors, {
  origin: ['https://your-frontend.com'],
  credentials: true,
});
```

### 3. Rate Limiting
Install and configure:
```bash
npm install @fastify/rate-limit
```

```typescript
import rateLimit from '@fastify/rate-limit';

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes'
});
```

### 4. Helmet (Security Headers)
```bash
npm install @fastify/helmet
```

```typescript
import helmet from '@fastify/helmet';

await fastify.register(helmet);
```

### 5. File Upload Limits
Already configured (10MB), but adjust if needed:
```typescript
await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
});
```

---

## 🚀 Performance Optimization

### 1. Enable Compression
```bash
npm install @fastify/compress
```

```typescript
import compress from '@fastify/compress';

await fastify.register(compress);
```

### 2. Connection Pooling
Supabase client already uses connection pooling, but you can configure:
```typescript
const supabase = createClient(url, key, {
  db: { schema: 'public' },
  global: { headers: { 'x-my-custom-header': 'my-app' } },
});
```

### 3. Caching
Add Redis for caching (optional):
```bash
npm install @fastify/redis
```

---

## 🔄 CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd backend && npm ci
      - run: cd backend && npm test
      - run: cd backend && npm run typecheck

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      # Add deployment steps for your platform
      # Railway: railway up
      # Render: Auto-deploys on push
      # Vercel: vercel --prod
```

---

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx, AWS ALB)
- Multiple instances via Railway/Render
- Session storage if needed (currently stateless ✅)

### Vertical Scaling
- Upgrade instance size
- Monitor CPU/memory usage
- Consider splitting services

### Database Scaling
- Supabase handles this automatically
- Consider connection pooling if needed
- Monitor query performance

---

## 🆘 Troubleshooting

### Issue: 502 Bad Gateway
**Cause:** App not starting or crashed  
**Fix:** Check logs, verify environment variables

### Issue: Database Connection Error
**Cause:** Invalid Supabase credentials  
**Fix:** Verify SUPABASE_URL and SUPABASE_ANON_KEY

### Issue: File Upload Fails
**Cause:** File size limit or permissions  
**Fix:** Check multipart config, verify disk space

### Issue: Slow Response Times
**Cause:** Database queries or large files  
**Fix:** Add indexes, enable compression, optimize queries

---

## 📞 Support

**Documentation:**
- API Docs: `/docs` (Swagger UI)
- API Reference: `API.md`
- Database: `database/README.md`

**Logs:**
- Application logs via Pino (JSON format)
- Check platform-specific logging

**Health Check:**
- Endpoint: `GET /health`
- Expected: `200 OK` with status object

---

## ✅ Deployment Checklist

- [ ] Database migrations run in production
- [ ] Environment variables configured
- [ ] Application deployed and running
- [ ] Health check passing (`/health`)
- [ ] SSL certificate configured (HTTPS)
- [ ] CORS configured for production domain
- [ ] Monitoring setup (Sentry, etc.)
- [ ] Logs accessible
- [ ] Backup strategy (Supabase auto-backups)
- [ ] Documentation updated with production URL

---

## 🎉 Quick Start (Railway - Recommended)

```bash
# 1. Run database migrations in Supabase

# 2. Deploy to Railway
cd backend
npm install -g @railway/cli
railway login
railway init
railway up

# 3. Set environment variables
railway variables set SUPABASE_URL=your-url
railway variables set SUPABASE_ANON_KEY=your-key
railway variables set NODE_ENV=production

# 4. Get URL
railway domain

# 5. Test
curl https://your-app.railway.app/health
```

**Done! Your API is live! 🚀**

---

**Last Updated:** January 27, 2026  
**Version:** 1.0.0
