# 6b. Экраны приложения - Tier 2 (Production)

**Добавление регистрации, истории и платных функций** для производственного использования.

```mermaid
graph TB
    nav["<b>🔙 Вернуться к Roadmap</b>"]
    arch["<b>📐 Архитектура Tier 2</b>"]
    prevTier["<b>← Tier 1 (MVP)</b>"]
    
    nav ~~~ arch ~~~ prevTier
    
    arch --> landing
    
    subgraph landing ["🏠 Landing Page"]
        direction LR
        
        hero["<b>Hero + Features</b><br/>(из Tier 1)"]
        newCTA["<b>🆕 Новые CTA</b><br/>✅ Sign Up<br/>✅ Log In<br/>✅ Pricing"]
        
        hero ~~~ newCTA
    end
    
    landing -->|"Sign Up"| signup
    landing -->|"Log In"| login
    landing -->|"Try Demo"| upload
    
    subgraph signup ["🆕 📝 Sign Up Screen"]
        direction LR
        
        signupForm["<b>Форма регистрации</b><br/>📧 Email<br/>🔐 Password<br/>👤 Full Name<br/>🏢 Company (optional)"]
        oauth["<b>Social Auth</b><br/>🔵 Google<br/>🔷 Microsoft<br/>⚫ Apple"]
        pricing["<b>План выбора</b><br/>💳 Free (3 анализа/мес)<br/>💼 Pro ($49/мес)<br/>🏢 Business ($199/мес)"]
        
        signupForm ~~~ oauth ~~~ pricing
    end
    
    subgraph login ["🆕 🔐 Login Screen"]
        direction LR
        
        loginForm["<b>Форма входа</b><br/>📧 Email<br/>🔐 Password<br/>🔄 Remember me"]
        loginOauth["<b>Social Auth</b><br/>🔵 Google<br/>🔷 Microsoft<br/>⚫ Apple"]
        forgot["<b>Восстановление</b><br/>🔗 Forgot password?<br/>📧 Email verification"]
        
        loginForm ~~~ loginOauth ~~~ forgot
    end
    
    signup --> dashboard
    login --> dashboard
    
    subgraph dashboard ["🆕 📊 Dashboard"]
        direction LR
        
        overview["<b>Обзор</b><br/>📈 Последние метрики<br/>📊 Графики трендов<br/>⚠️ Активные риски<br/>📅 7/30/90 дней"]
        quickActions["<b>Быстрые действия</b><br/>➕ Новый анализ<br/>📁 Загрузить файл<br/>📤 Экспорт отчета"]
        usage["<b>Использование</b><br/>📊 Осталось анализов<br/>💳 Текущий план<br/>📅 Renewal date"]
        
        overview ~~~ quickActions ~~~ usage
    end
    
    dashboard -->|"Новый анализ"| upload
    dashboard -->|"История"| history
    dashboard -->|"Профиль"| profile
    
    subgraph upload ["📤 Upload Screen"]
        direction LR
        
        uploadBase["<b>Базовый функционал</b><br/>(из Tier 1)"]
        newFeatures["<b>🆕 Новые фичи</b><br/>✅ Сохранение в историю<br/>✅ Назначение тегов<br/>✅ Добавление заметок<br/>✅ Расписание анализа"]
        
        uploadBase ~~~ newFeatures
    end
    
    upload --> analysis
    
    subgraph analysis ["📊 Analysis Results"]
        direction LR
        
        analysisBase["<b>Базовые блоки</b><br/>(из Tier 1)"]
        newActions["<b>🆕 Новые действия</b><br/>💾 Сохранить отчет<br/>📤 Экспорт PDF/Excel<br/>📧 Отправить email<br/>🔗 Поделиться ссылкой<br/>📊 Добавить в дашборд"]
        
        analysisBase ~~~ newActions
    end
    
    analysis -->|"Сохранить"| history
    
    subgraph history ["🆕 📁 History Screen"]
        direction LR
        
        historyList["<b>Список отчетов</b><br/>📅 Сортировка по дате<br/>🔍 Поиск по названию<br/>🏷️ Фильтр по тегам<br/>📊 Группировка"]
        historyPreview["<b>Preview карточка</b><br/>📄 Название + дата<br/>💰 Ключевые метрики<br/>⚠️ Количество рисков<br/>📈 Миниатюра графика"]
        historyActions["<b>Действия</b><br/>👁️ Открыть<br/>📤 Экспорт<br/>🔄 Повторный анализ<br/>🗑️ Удалить"]
        
        historyList ~~~ historyPreview ~~~ historyActions
    end
    
    history -->|"Открыть"| analysis
    history -->|"Новый анализ"| upload
    
    subgraph profile ["🆕 👤 Profile Screen"]
        direction LR
        
        profileInfo["<b>Личные данные</b><br/>👤 Full Name<br/>📧 Email<br/>🏢 Company<br/>📞 Phone (optional)"]
        subscription["<b>Подписка</b><br/>💳 Текущий план<br/>📅 Renewal date<br/>📊 Использование лимитов<br/>🔄 Upgrade/Downgrade"]
        billing["<b>Биллинг</b><br/>💳 Карты<br/>📄 История платежей<br/>🧾 Инвойсы"]
        settings["<b>Настройки</b><br/>🔔 Уведомления<br/>🌐 Язык<br/>🔐 Безопасность<br/>🗑️ Удалить аккаунт"]
        
        profileInfo ~~~ subscription ~~~ billing ~~~ settings
    end
    
    style landing fill:#e1f5e1,stroke:#2e7d32,stroke-width:2px
    style signup fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    style login fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    style dashboard fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    style upload fill:#e1f0ff,stroke:#1565c0,stroke-width:2px
    style analysis fill:#ffe1f0,stroke:#c2185b,stroke-width:2px
    style history fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px
    style profile fill:#fce4ec,stroke:#c2185b,stroke-width:3px
    
    style nav fill:#667eea,stroke:#764ba2,stroke-width:2px,color:#fff,cursor:pointer
    style arch fill:#667eea,stroke:#764ba2,stroke-width:2px,color:#fff,cursor:pointer
    style prevTier fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff,cursor:pointer
    
    click nav "#diagram-10" "Roadmap Tier 2"
    click arch "#diagram-02b" "Архитектура Tier 2"
    click prevTier "#diagram-06a" "Tier 1 Screens"
```

---

## 🆕 Новые экраны в Tier 2

### 1. Sign Up Screen
**Цель:** Регистрация пользователей с выбором тарифа

**Компоненты:**
- **Форма регистрации:** Email, Password, Full Name, Company (optional)
- **Social Auth:** Google, Microsoft, Apple
- **Выбор плана:**
  - 💳 Free: 3 анализа/месяц
  - 💼 Pro: $49/месяц, 50 анализов
  - 🏢 Business: $199/месяц, unlimited

**Валидация:**
- Email verification (код на email)
- Strong password (8+ символов, uppercase, цифры)
- Terms & Conditions acceptance

---

### 2. Login Screen
**Цель:** Авторизация существующих пользователей

**Компоненты:**
- **Форма входа:** Email, Password, Remember me
- **Social Auth:** Google, Microsoft, Apple
- **Восстановление:** Forgot password? → Email reset

**Security:**
- Rate limiting (5 попыток)
- 2FA (optional для Business плана)
- Session management (JWT, 24 часа)

---

### 3. Dashboard
**Цель:** Центральный hub для управления отчетами

**Блоки:**

#### Overview:
- 📈 Последние метрики из всех отчетов
- 📊 Графики трендов (7/30/90 дней)
- ⚠️ Активные риски (все отчеты)
- 💡 Top рекомендации

#### Quick Actions:
- ➕ Новый анализ
- 📁 Загрузить файл
- 📤 Экспорт всех отчетов
- 🔔 Настроить уведомления

#### Usage Stats:
- 📊 Осталось анализов (3/50)
- 💳 Текущий план (Free/Pro/Business)
- 📅 Renewal date
- 🔄 Upgrade CTA

---

### 4. History Screen
**Цель:** Управление всеми сохраненными отчетами

**Функции:**

#### Список отчетов:
- 📅 Сортировка: по дате, названию, рискам
- 🔍 Поиск по названию и описанию
- 🏷️ Фильтр по тегам (Revenue, Costs, Q1, etc.)
- 📊 Группировка по периодам

#### Preview карточка:
- 📄 Название + дата создания
- 💰 Ключевые метрики (Revenue, Profit, Runway)
- ⚠️ Количество рисков (3 critical, 5 high)
- 📈 Миниатюра графика

#### Действия:
- 👁️ Открыть полный отчет
- 📤 Экспорт (PDF/Excel/JSON)
- 🔄 Повторный анализ (с новыми данными)
- 🗑️ Удалить

---

### 5. Profile Screen
**Цель:** Управление аккаунтом и подпиской

**Секции:**

#### Личные данные:
- 👤 Full Name, Email, Company, Phone
- 🖼️ Avatar upload
- 🌐 Язык интерфейса

#### Подписка:
- 💳 Текущий план (Free/Pro/Business)
- 📅 Renewal date / Billing cycle
- 📊 Использование: 3/50 анализов
- 🔄 Upgrade/Downgrade кнопки

#### Биллинг:
- 💳 Сохраненные карты (Stripe)
- 📄 История платежей (table)
- 🧾 Скачать инвойсы (PDF)

#### Настройки:
- 🔔 Email уведомления (новые риски, отчеты)
- 🔐 Изменить пароль
- 🔒 Enable 2FA (Business план)
- 🗑️ Удалить аккаунт (с подтверждением)

---

## 🔄 Обновленные экраны

### Upload Screen (обновлен)
**Новые фичи:**
- ✅ **Сохранение в историю** (автоматически)
- ✅ **Назначение тегов** (Revenue, Q1, Marketing, etc.)
- ✅ **Добавление заметок** (контекст для будущего)
- ✅ **Расписание анализа** (recurring, weekly/monthly)

---

### Analysis Results (обновлен)
**Новые действия:**
- 💾 **Сохранить отчет** → History
- 📤 **Экспорт:** PDF (formatted), Excel (raw data), JSON (API)
- 📧 **Отправить email** (отчет коллегам)
- 🔗 **Поделиться ссылкой** (read-only access, 7 дней)
- 📊 **Добавить в дашборд** (pin metrics)

---

## 📊 User Flow Tier 2

```
Landing → Sign Up → Dashboard → Upload → Analysis → History
                      ↓           ↓          ↓         ↓
                   Overview    Save     Export    Search
```

**Новые пути:**
- **New User:** Landing → Sign Up → Onboarding → First Upload
- **Returning User:** Login → Dashboard → (Upload | History)
- **Free to Paid:** Dashboard → Upgrade CTA → Pricing → Checkout

---

## 🔗 Связанные диаграммы

- **[← Roadmap Tier 2](10-roadmap.md#tier-2-production)** - план разработки Production
- **[📐 Архитектура Tier 2](02b-architecture-tier2.md)** - техническая архитектура
- **[← Экраны Tier 1](06a-screens-tier1.md)** - базовые экраны MVP
- **[→ Экраны Tier 3](06c-screens-tier3.md)** - Enterprise функции

---

## ✅ Что добавилось vs Tier 1

| Фича | Tier 1 (MVP) | Tier 2 (Production) |
|------|--------------|---------------------|
| Регистрация | ❌ | ✅ Email + OAuth |
| Авторизация | ❌ | ✅ JWT + Session |
| История отчетов | ❌ | ✅ Unlimited storage |
| Экспорт | ❌ | ✅ PDF/Excel/JSON |
| Dashboard | ❌ | ✅ Trends + Overview |
| Профиль | ❌ | ✅ Full management |
| Подписки | ❌ | ✅ Free/Pro/Business |
| Биллинг | ❌ | ✅ Stripe integration |

---

## 📈 Метрики успеха Tier 2

**Активация:**
- Регистрация: 15-20% от посетителей
- Первый анализ: 80% новых пользователей (D0)
- Второй анализ: 40% пользователей (D7)

**Retention:**
- D7 retention: 35-40%
- D30 retention: 20-25%
- Платная конверсия: 5-8% (Free → Pro)

**Монетизация:**
- ARPU: $15-20/месяц
- CAC: $50-80
- LTV/CAC ratio: 3-4x

---

**Tier:** 2 (Production)  
**Статус:** 🏗️ В разработке  
**Новых экранов:** 5 (Sign Up, Login, Dashboard, History, Profile)
