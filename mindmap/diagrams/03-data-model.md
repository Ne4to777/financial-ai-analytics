# 3. Схема базы данных - Prisma модель

**Детальная схема БД** с типами, ограничениями и индексами для генерации Prisma.

```mermaid
erDiagram
    Report ||--o{ FinancialData : "1:N"
    Report ||--o| Analysis : "1:0..1"
    Analysis ||--o{ Risk : "1:N"
    Analysis ||--o{ Recommendation : "1:N"
    
    Report {
        String id PK "UUID @id @default(uuid())"
        String fileName "NOT NULL"
        String fileType "NOT NULL ENUM csv,excel"
        DateTime uploadedAt "NOT NULL @default(now())"
        String status "NOT NULL ENUM pending,processing,completed,failed DEFAULT pending"
        Int fileSize "NOT NULL CHECK gt 0"
        String userId "NOT NULL"
        DateTime createdAt "@default(now())"
        DateTime updatedAt "@updatedAt"
    }
    
    FinancialData {
        String id PK "UUID @id @default(uuid())"
        String reportId FK "NOT NULL @relation Report"
        String category "NOT NULL ENUM income,expense,other"
        Decimal amount "NOT NULL Decimal(15,2)"
        DateTime period "NOT NULL"
        String currency "NOT NULL DEFAULT USD"
        Json rawData "NULLABLE"
    }
    
    Analysis {
        String id PK "UUID @id @default(uuid())"
        String reportId FK "NOT NULL @unique @relation Report"
        DateTime analyzedAt "NOT NULL @default(now())"
        String aiProvider "NOT NULL ENUM openai,anthropic"
        String summary "NOT NULL Text"
        Json fullAnalysis "NOT NULL"
        String status "NOT NULL ENUM pending,processing,completed,failed DEFAULT pending"
        DateTime createdAt "@default(now())"
        DateTime updatedAt "@updatedAt"
    }
    
    Risk {
        String id PK "UUID @id @default(uuid())"
        String analysisId FK "NOT NULL @relation Analysis"
        String category "NOT NULL"
        String severity "NOT NULL ENUM high,medium,low"
        String description "NOT NULL Text"
        Decimal impact "NULLABLE Decimal(10,2)"
        Int priority "NOT NULL CHECK 1-10"
        DateTime createdAt "@default(now())"
    }
    
    Recommendation {
        String id PK "UUID @id @default(uuid())"
        String analysisId FK "NOT NULL @relation Analysis"
        String type "NOT NULL ENUM optimization,cost_reduction,revenue_growth"
        String description "NOT NULL Text"
        Decimal expectedImprovement "NULLABLE Decimal(10,2)"
        String priority "NOT NULL ENUM high,medium,low"
        Json actionItems "NOT NULL"
        DateTime createdAt "@default(now())"
    }
```

## Индексы (для production)

```prisma
@@index([userId, uploadedAt(sort: Desc)])  // Report: поиск по пользователю
@@index([status])                          // Report: фильтр по статусу
@@index([reportId])                        // FinancialData: связь с отчетом
@@index([category])                        // FinancialData: фильтр по категории
@@index([reportId])                        // Analysis: связь с отчетом
@@index([analysisId, severity])            // Risk: фильтр рисков
@@index([analysisId, priority])            // Recommendation: сортировка
```

## Ограничения (Constraints)

- **Foreign Keys**: ON DELETE CASCADE
- **UUID**: Используется для всех ID
- **Timestamps**: createdAt, updatedAt автоматически
- **Enum**: Строгие значения для статусов
- **Decimal**: Для денежных значений (precision 15, scale 2)
