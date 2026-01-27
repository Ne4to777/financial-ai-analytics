# 🚀 Деплой CSV API на Vercel

## Быстрый старт (3 минуты)

### Предварительные требования

✅ У вас уже есть аккаунт Vercel  
✅ У вас настроен Supabase проект  
✅ Код в GitHub

---

## 📝 Шаг 1: Подготовка базы данных

### 1.1 Запустите миграции в Supabase

Откройте **Supabase Dashboard** → **SQL Editor**

**Миграция 1: Таблица uploads**
```sql
-- Скопируйте и выполните:
-- backend/database/migrations/001_create_uploads_table.sql
```

**Миграция 2: Таблица transactions**
```sql
-- Скопируйте и выполните:
-- backend/database/migrations/002_create_transactions_table.sql
```

### 1.2 Получите credentials

В Supabase: **Settings** → **API**

Сохраните:
- `Project URL` (например: `https://xxxxx.supabase.co`)
- `anon public` key

---

## 🚀 Шаг 2: Деплой на Vercel

### Вариант A: Через Dashboard (Рекомендуется)

1. **Откройте Vercel Dashboard**
   - Перейдите на https://vercel.com/dashboard

2. **Создайте новый проект**
   - Click **"Add New..."** → **"Project"**
   - Выберите ваш GitHub репозиторий: `Ne4to777/financial-ai-analytics`

3. **Настройте проект**
   - **Project Name:** `csv-processing-api` (или любое другое)
   - **Framework Preset:** Other
   - **Root Directory:** `backend` ⚠️ **ВАЖНО!**
   - **Build Command:** `npm run build` (или оставьте пустым)
   - **Output Directory:** (оставьте пустым)
   - **Install Command:** `npm install`

4. **Добавьте Environment Variables**
   
   Нажмите **"Environment Variables"**, добавьте:
   
   ```
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_ANON_KEY = your-anon-key-here
   NODE_ENV = production
   LOG_LEVEL = info
   ```

5. **Deploy!**
   - Нажмите **"Deploy"**
   - Ждите 2-3 минуты
   - ✅ Готово!

---

### Вариант B: Через CLI

```bash
# 1. Установите Vercel CLI (если еще нет)
npm install -g vercel

# 2. Войдите в аккаунт
vercel login

# 3. Перейдите в папку backend
cd backend

# 4. Первый деплой (interactive)
vercel

# Ответьте на вопросы:
# - Set up and deploy? → Y
# - Which scope? → Ваш username/team
# - Link to existing project? → N
# - Project name? → csv-processing-api
# - In which directory? → ./ (уже в backend)
# - Want to override settings? → N

# 5. Добавьте environment variables
vercel env add SUPABASE_URL
# Введите значение: https://your-project.supabase.co

vercel env add SUPABASE_ANON_KEY
# Введите ваш anon key

vercel env add NODE_ENV
# Введите: production

# 6. Production деплой
vercel --prod
```

---

## ✅ Шаг 3: Проверка

### 3.1 Получите URL

После деплоя вы получите URL типа:
```
https://csv-processing-api.vercel.app
```

### 3.2 Проверьте endpoints

**Health Check:**
```bash
curl https://csv-processing-api.vercel.app/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T...",
  "environment": "production"
}
```

**API Info:**
```bash
curl https://csv-processing-api.vercel.app/
```

**Swagger Docs:**
Откройте в браузере:
```
https://csv-processing-api.vercel.app/docs
```

### 3.3 Протестируйте Upload

```bash
# Создайте тестовый CSV файл
cat > test.csv << 'EOF'
Date,Description,Amount,Category
2024-01-15,Grocery Store,50.00,Food
2024-01-16,Gas Station,30.00,Transport
2024-01-17,Restaurant,25.50,Food
EOF

# Загрузите файл
curl -X POST https://csv-processing-api.vercel.app/api/upload \
  -F "file=@test.csv" \
  -H "Content-Type: multipart/form-data"
```

---

## 🔧 Шаг 4: Настройка (опционально)

### 4.1 Обновите Swagger URL

Отредактируйте `backend/src/serverless.ts`:

```typescript
servers: [
  {
    url: 'https://csv-processing-api.vercel.app', // ← Ваш реальный URL
    description: 'Production server',
  },
],
```

Commit и push → Vercel автоматически задеплоит обновление.

### 4.2 Настройте Custom Domain (опционально)

В Vercel Dashboard:
1. **Settings** → **Domains**
2. Добавьте ваш домен
3. Настройте DNS записи

---

## 🔄 Автоматический деплой (CI/CD)

Vercel **автоматически** деплоит при push в GitHub!

- **Push в `main`** → Production deployment
- **Push в другие ветки** → Preview deployment
- **Pull Request** → Preview deployment с уникальным URL

### Настройка GitHub Actions (опционально)

Файл уже создан: `.github/workflows/deploy.yml`

Раскомментируйте секцию `deploy-vercel` и добавьте секреты:

**GitHub Secrets** (Settings → Secrets and variables → Actions):
- `VERCEL_TOKEN` - получите на https://vercel.com/account/tokens
- `VERCEL_ORG_ID` - найдите в Vercel → Settings → General
- `VERCEL_PROJECT_ID` - найдите в Vercel → Project Settings → General

---

## 📊 Мониторинг

### Логи

**Vercel Dashboard:**
1. Выберите ваш проект
2. **Deployments** → выберите deployment
3. **View Function Logs**

**CLI:**
```bash
vercel logs csv-processing-api.vercel.app
```

### Метрики

В Vercel Dashboard → **Analytics** вы увидите:
- Requests per second
- Response times
- Error rates
- Bandwidth usage

---

## ⚙️ Важные настройки Vercel

### Limits (Free Tier)

| Параметр | Лимит |
|----------|-------|
| **Bandwidth** | 100 GB/месяц |
| **Function Execution** | 100 GB-Hours/месяц |
| **Function Duration** | 10 секунд (Hobby)<br>60 секунд (Pro) |
| **Deployments** | Неограниченно |
| **Team Members** | 1 (Hobby) |

### Увеличение лимитов

Если нужно больше:
- ⏱️ **Function Duration:** Upgrade to Pro ($20/месяц) для 60 секунд
- 💾 **Bandwidth:** $40 per 100 GB сверх лимита
- 🚀 **GB-Hours:** $20 per 100 GB-Hours сверх лимита

---

## 🔒 Безопасность

### CORS Configuration

Обновите в `backend/src/serverless.ts`:

```typescript
await app.register(cors, {
  origin: [
    'https://your-frontend.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true,
});
```

### Rate Limiting

Установите:
```bash
npm install @fastify/rate-limit
```

Добавьте в `serverless.ts`:
```typescript
import rateLimit from '@fastify/rate-limit';

await app.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes'
});
```

---

## 🐛 Troubleshooting

### Ошибка: "Function execution timed out"

**Причина:** Функция выполняется дольше 10 секунд  
**Решение:**
- Upgrade to Vercel Pro для 60-секундного лимита
- Оптимизируйте обработку CSV (стримминг, батчинг)

### Ошибка: "Database connection failed"

**Причина:** Неверные Supabase credentials  
**Решение:**
```bash
# Проверьте переменные
vercel env ls

# Обновите при необходимости
vercel env rm SUPABASE_URL
vercel env add SUPABASE_URL
```

### Ошибка: "Module not found"

**Причина:** Не все зависимости установлены  
**Решение:**
```bash
# Проверьте package.json
cd backend
npm install
git add package.json package-lock.json
git commit -m "fix: update dependencies"
git push
```

### Upload не работает

**Причина:** Vercel может иметь ограничения на размер body  
**Решение:**
- Free tier: 4.5 MB limit для body
- Pro tier: 10 MB limit
- Убедитесь, что `vercel.json` правильно настроен

---

## 📈 Оптимизация

### Холодные старты

Serverless функции могут "засыпать". Оптимизации:

1. **Keep-alive pings:**
   ```bash
   # Добавьте в cron (каждые 5 минут)
   curl https://csv-processing-api.vercel.app/health
   ```

2. **Vercel Pro:** Guaranteed faster cold starts

### Кэширование

Добавьте в `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/health",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

---

## 🎯 Checklist

После деплоя проверьте:

- [ ] ✅ `GET /health` возвращает 200 OK
- [ ] ✅ `GET /` возвращает API info
- [ ] ✅ `GET /docs` открывает Swagger UI
- [ ] ✅ `POST /api/upload` обрабатывает CSV
- [ ] ✅ Database записывает данные
- [ ] ✅ Environment variables настроены
- [ ] ✅ Логи доступны в Dashboard
- [ ] ✅ Auto-deploy работает (push to GitHub)
- [ ] ✅ CORS настроен для вашего frontend
- [ ] ✅ Custom domain добавлен (если нужно)

---

## 🚀 Готово!

Ваш CSV Processing API теперь live на Vercel! 🎉

**Полезные ссылки:**
- 📖 Документация: `https://your-app.vercel.app/docs`
- 📊 Dashboard: https://vercel.com/dashboard
- 📝 Логи: Vercel Dashboard → Deployments → Function Logs
- 🔧 Настройки: Vercel Dashboard → Project Settings

---

## 📞 Поддержка

**Проблемы с деплоем?**
1. Проверьте логи в Vercel Dashboard
2. Посмотрите раздел Troubleshooting выше
3. Документация Vercel: https://vercel.com/docs

**Ошибки в API?**
- Проверьте логи: `vercel logs`
- Проверьте environment variables
- Убедитесь, что миграции Supabase выполнены

---

**Last Updated:** January 27, 2026  
**Version:** 1.0.0
