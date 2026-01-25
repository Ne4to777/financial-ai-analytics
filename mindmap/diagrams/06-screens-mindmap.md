# 6. Mind Map экранов приложения

**Полная структура экранов** для всех tier с навигацией по детальным диаграммам.

```mermaid
graph TB
    tier1["<b>📱 Tier 1: MVP Screens</b><br/>Landing + Upload + Analysis"]
    tier2["<b>📱 Tier 2: Production Screens</b><br/>+ Auth + Dashboard + History + Profile"]
    tier3["<b>📱 Tier 3: Enterprise Screens</b><br/>+ Team + Audit + Integrations + Admin"]
    
    prototypes["<b>🎨 HTML Прототипы</b><br/>Интерактивные прототипы MVP"]
    
    tier1 ~~~ tier2 ~~~ tier3 ~~~ prototypes
    
    tier1 --> landing
    
    subgraph mvp ["🟢 MVP Экраны (Tier 1)"]
        direction LR
        
        landing["<b>🏠 Landing Page</b><br/>Hero + Features<br/>How it works + CTA"]
        upload["<b>📤 Upload Screen</b><br/>Drag & drop<br/>CSV example<br/>Requirements"]
        analysis["<b>📊 Analysis Results</b><br/>6 метрик + 3 риска<br/>5 рекомендаций + прогноз<br/>CTA: Sign Up"]
        
        landing ~~~ upload ~~~ analysis
    end
    
    landing -->|"Попробовать"| upload
    upload -->|"Анализ"| analysis
    analysis -->|"Sign Up"| signup
    
    tier2 --> signup
    
    subgraph prod ["🟡 Production Экраны (Tier 2)"]
        direction LR
        
        signup["<b>📝 Sign Up</b><br/>Email + OAuth<br/>План выбора"]
        login["<b>🔐 Login</b><br/>Auth + 2FA<br/>Password reset"]
        dashboard["<b>📊 Dashboard</b><br/>Overview + Trends<br/>Quick actions<br/>Usage stats"]
        history["<b>📁 History</b><br/>Список отчетов<br/>Search + Filters<br/>Export actions"]
        profile["<b>👤 Profile</b><br/>Personal info<br/>Subscription<br/>Billing + Settings"]
        
        signup ~~~ login ~~~ dashboard ~~~ history ~~~ profile
    end
    
    signup --> dashboard
    login --> dashboard
    dashboard --> history
    history --> analysis
    
    tier3 --> team
    
    subgraph enterprise ["🔴 Enterprise Экраны (Tier 3)"]
        direction LR
        
        team["<b>👥 Team Mgmt</b><br/>Members + Roles<br/>Permissions"]
        audit["<b>🔍 Audit Logs</b><br/>Event journal<br/>Compliance export"]
        integrations["<b>🔌 Integrations</b><br/>1C/SAP/QuickBooks<br/>Webhooks"]
        sync["<b>🔄 Data Sync</b><br/>Auto sync<br/>Mapping + Schedule"]
        advanced["<b>📈 Advanced Analytics</b><br/>Custom reports<br/>ML forecasts<br/>Benchmarking"]
        settings["<b>⚙️ Settings</b><br/>SSO + Security<br/>Compliance<br/>Branding"]
        admin["<b>👑 Admin Panel</b><br/>Usage monitoring<br/>Billing<br/>Support"]
        
        team ~~~ audit ~~~ integrations ~~~ sync ~~~ advanced ~~~ settings ~~~ admin
    end
    
    dashboard -->|"Tier 3"| team
    team --> audit
    integrations --> sync
    
    style mvp fill:#e1f5e1,stroke:#2e7d32,stroke-width:3px
    style prod fill:#fff4e1,stroke:#e65100,stroke-width:3px
    style enterprise fill:#ffebee,stroke:#c62828,stroke-width:3px
    
    style tier1 fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff,cursor:pointer
    style tier2 fill:#ed8936,stroke:#c05621,stroke-width:2px,color:#fff,cursor:pointer
    style tier3 fill:#e53e3e,stroke:#c53030,stroke-width:2px,color:#fff,cursor:pointer
    style prototypes fill:#667eea,stroke:#764ba2,stroke-width:2px,color:#fff,cursor:pointer
    
    click tier1 "#diagram-06a" "Детальная диаграмма Tier 1"
    click tier2 "#diagram-06b" "Детальная диаграмма Tier 2"
    click tier3 "#diagram-06c" "Детальная диаграмма Tier 3"
    click prototypes "#prototypes" "HTML Прототипы"
```

---

## 📱 Детальные диаграммы по Tier

### 🟢 [Tier 1: MVP Screens](06a-screens-tier1.md)
**3 экрана | Без регистрации**

- 🏠 **Landing Page** - Hero, Features, CTA
- 📤 **Upload Screen** - Drag & drop, CSV validation
- 📊 **Analysis Results** - Метрики, риски, рекомендации, прогноз

**Доступны HTML прототипы:** `mindmap/prototypes/`

---

### 🟡 [Tier 2: Production Screens](06b-screens-tier2.md)
**+5 новых экранов | Регистрация + История**

- 📝 **Sign Up** - Email + OAuth, план выбора
- 🔐 **Login** - Auth + 2FA
- 📊 **Dashboard** - Overview + trends
- 📁 **History** - Управление отчетами
- 👤 **Profile** - Подписка + биллинг

---

### 🔴 [Tier 3: Enterprise Screens](06c-screens-tier3.md)
**+7 новых экранов | Enterprise функции**

- 👥 **Team Management** - Роли + права
- 🔍 **Audit Logs** - SOC 2 compliance
- 🔌 **Integrations** - 1C/SAP/QuickBooks
- 🔄 **Data Sync** - Автоматизация
- 📈 **Advanced Analytics** - ML прогнозы
- ⚙️ **Enterprise Settings** - SSO + брендинг
- 👑 **Admin Panel** - Monitoring + support

---

## 🎨 HTML Прототипы

**Интерактивные прототипы для MVP** доступны в `mindmap/prototypes/`

### 📂 Файлы:
- `index.html` - Навигация по прототипам
- `01-landing.html` - Landing Page (Hero + Features)
- `02-upload.html` - Upload Screen (Drag & drop)
- `03-analysis.html` - Analysis Results (Полный анализ)

### 🚀 Как открыть:

**Вариант 1: Через Viewer (рекомендуется)**
- Нажмите кнопку "🎨 HTML Прототипы" в диаграмме выше
- Или выберите "🎨 HTML Прототипы (открыть)" в меню слева

**Вариант 2: Напрямую в браузере**
```bash
open mindmap/prototypes/index.html
```

**Вариант 3: Через локальный сервер (лучший опыт)**
```bash
cd mindmap
npx live-server --port=8001
# Откройте http://localhost:8001/prototypes/
```

### 📖 Документация:
- [prototypes/README.md](../prototypes/README.md) - Полное описание прототипов
- [06a-screens-tier1.md](06a-screens-tier1.md) - Детальная диаграмма MVP экранов

---

## 📊 Сравнение Tier

| Фича | Tier 1 (MVP) | Tier 2 (Production) | Tier 3 (Enterprise) |
|------|--------------|---------------------|---------------------|
| Экранов | 3 | 8 (+5) | 15 (+7) |
| Регистрация | ❌ | ✅ | ✅ |
| История | ❌ | ✅ | ✅ |
| Команды | ❌ | ❌ | ✅ |
| Интеграции | ❌ | ❌ | ✅ |
| SSO | ❌ | ❌ | ✅ |
| Audit logs | ❌ | ❌ | ✅ |
| ML прогнозы | ❌ | ❌ | ✅ |

---

## 🔗 Связанные диаграммы

- **[← Roadmap](10-roadmap.md)** - план разработки всех tier
- **[📐 Архитектура MVP](02a-architecture-mvp.md)** - Tier 1 architecture
- **[📐 Архитектура Production](02b-architecture-tier2.md)** - Tier 2 architecture
- **[📐 Архитектура Enterprise](02c-architecture-tier3.md)** - Tier 3 architecture
- **[🎨 HTML Прототипы](../prototypes/README.md)** - интерактивные прототипы
