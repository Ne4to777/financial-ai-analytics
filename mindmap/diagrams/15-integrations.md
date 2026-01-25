# 15. Интеграции и форматы данных

**Полная совместимость** с вашими системами и данными.

```mermaid
graph TB
    subgraph formats ["📁 Поддерживаемые форматы"]
        direction LR
        f1["<b>Таблицы</b><br/>CSV, Excel (.xlsx, .xls)<br/>Google Sheets"]
        f2["<b>ERP системы</b><br/>1C, SAP, Oracle<br/>через API/экспорт"]
        f3["<b>Учетные системы</b><br/>QuickBooks, Xero<br/>FreshBooks, Wave"]
        f4["<b>Базы данных</b><br/>PostgreSQL, MySQL<br/>SQL Server, прямое подключение"]
        
        f1 ~~~ f2 ~~~ f3 ~~~ f4
    end
    
    formats ~~~ connectors
    
    subgraph connectors ["🔌 Готовые коннекторы"]
        direction LR
        c1["<b>1C:Бухгалтерия</b><br/>прямая интеграция<br/>автоматический импорт"]
        c2["<b>SAP ERP</b><br/>certified connector<br/>real-time sync"]
        c3["<b>QuickBooks API</b><br/>OAuth 2.0<br/>авто-синхронизация"]
        c4["<b>Power BI</b><br/>двусторонняя связь<br/>дашборды + AI"]
        
        c1 ~~~ c2 ~~~ c3 ~~~ c4
    end
    
    connectors ~~~ import
    
    subgraph import ["⚡ Способы импорта"]
        direction LR
        i1["<b>Drag & Drop</b><br/>просто перетащите<br/>CSV/Excel файл"]
        i2["<b>API интеграция</b><br/>REST API<br/>webhooks"]
        i3["<b>Scheduled sync</b><br/>автоматически<br/>каждую ночь/неделю"]
        i4["<b>Email импорт</b><br/>отправьте на<br/>import@yourcompany.ai"]
        
        i1 ~~~ i2 ~~~ i3 ~~~ i4
    end
    
    import ~~~ validation
    
    subgraph validation ["✅ Валидация данных"]
        direction LR
        v1["<b>Авто-маппинг</b><br/>распознает колонки<br/>income, expenses, etc"]
        v2["<b>Проверка качества</b><br/>находит пропуски<br/>дубликаты, ошибки"]
        v3["<b>Конвертация валют</b><br/>автоматически<br/>20+ валют"]
        v4["<b>Нормализация</b><br/>приводит к единому<br/>формату"]
        
        v1 ~~~ v2 ~~~ v3 ~~~ v4
    end
    
    style formats fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style connectors fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style import fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style validation fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
```

## Детали интеграций

### 1C:Бухгалтерия
```javascript
// Настройка за 5 минут
{
  "connector": "1c_accounting",
  "version": "8.3+",
  "auth": "credentials",
  "sync_schedule": "daily_23:00",
  "entities": ["Проводки", "Счета", "Контрагенты"],
  "auto_mapping": true
}
```

### SAP ERP
```javascript
// Certified SAP Partner
{
  "connector": "sap_erp",
  "versions": ["S/4HANA", "ECC 6.0+"],
  "protocols": ["RFC", "OData", "REST"],
  "modules": ["FI", "CO", "MM"],
  "real_time": true
}
```

### QuickBooks Online
```javascript
// OAuth 2.0 интеграция
{
  "connector": "quickbooks_online",
  "auth": "oauth2",
  "scopes": ["accounting.read", "reports.read"],
  "auto_sync": "hourly",
  "entities": ["Invoices", "Expenses", "P&L", "Balance Sheet"]
}
```

## API для кастомных интеграций

### REST API
```bash
# Импорт данных
POST /api/v1/import
Content-Type: multipart/form-data

# Запрос анализа
POST /api/v1/analysis
{
  "reportId": "uuid",
  "aiProvider": "openai|anthropic",
  "analysis_depth": "quick|standard|deep"
}

# Получение результатов
GET /api/v1/analysis/{analysisId}
```

### Webhooks
```javascript
// Уведомления о завершении анализа
POST https://your-domain.com/webhook
{
  "event": "analysis.completed",
  "analysisId": "uuid",
  "timestamp": "2026-01-25T10:30:00Z",
  "results": { ... }
}
```

## Roadmap поддержки форматов

**Q1 2026 (уже доступно):**
- ✅ CSV, Excel, Google Sheets
- ✅ 1C, QuickBooks, Xero
- ✅ PostgreSQL, MySQL

**Q2 2026:**
- 🔜 SAP ERP connector
- 🔜 Oracle Financials
- 🔜 PDF парсинг (выписки банков)

**Q3 2026:**
- 🔜 Tableau connector
- 🔜 NetSuite ERP
- 🔜 Salesforce Financial Cloud
