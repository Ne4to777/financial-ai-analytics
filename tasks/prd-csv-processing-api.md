# PRD: CSV Processing API

**Создано:** 26 января 2026  
**Автор:** AI Assistant (via @generate-prd)  
**Проект:** FinAI Analytics  
**Phase:** 2 (Backend Integration)

---

## 1. 🎯 Goals

### Primary Goals
1. **Позволить пользователям загружать CSV файлы** с финансовыми данными через RESTful API
2. **Валидировать данные** перед сохранением (формат, required columns, business rules)
3. **Сохранять данные** в Supabase PostgreSQL для последующего AI-анализа
4. **Давать понятные ошибки** с рекомендациями по исправлению

### Success Metrics
- **Upload success rate:** > 95%
- **API response time:** < 2 seconds для файлов до 10MB
- **Error clarity score:** > 4.5/5 (user feedback)
- **Data quality:** < 1% invalid records проходят валидацию
- **Developer experience:** API integration < 30 minutes

---

## 2. 📖 User Stories

### As a финансовый аналитик:
- **US-001:** I WANT загрузить CSV файл через API, SO THAT могу анализировать свои финансовые данные
- **US-002:** I WANT увидеть preview загруженных данных, SO THAT могу убедиться что всё корректно
- **US-003:** I WANT получить детальные ошибки, SO THAT могу исправить файл и загрузить снова

### As a разработчик фронтенда:
- **US-004:** I WANT простое API с понятной документацией, SO THAT могу быстро интегрировать upload
- **US-005:** I WANT получать прогресс загрузки, SO THAT могу показать progress bar пользователю
- **US-006:** I WANT structured error responses, SO THAT могу показать понятные сообщения

### As a system administrator:
- **US-007:** I WANT логи всех операций, SO THAT могу debugging issues
- **US-008:** I WANT rate limiting, SO THAT система защищена от abuse

---

## 3. ✅ Functional Requirements

### P0 (Must Have - MVP)

#### File Upload
- [ ] **FR-001:** POST `/api/upload` endpoint для загрузки CSV
- [ ] **FR-002:** Поддержка multipart/form-data
- [ ] **FR-003:** Max file size: 10MB
- [ ] **FR-004:** Только .csv формат
- [ ] **FR-005:** Сохранение файла в local filesystem (`uploads/` directory)

#### Validation
- [ ] **FR-006:** Проверка required columns:
  - `date` (YYYY-MM-DD или DD.MM.YYYY)
  - `amount` (number)
  - `category` (string)
  - `description` (string, опционально)
- [ ] **FR-007:** Проверка data types для каждой колонки
- [ ] **FR-008:** Проверка date formats (поддержка RU и ISO)
- [ ] **FR-009:** Проверка value ranges (amount > 0 для начислений, < 0 для оплат)
- [ ] **FR-010:** Duplicate detection (по date + amount + category)
- [ ] **FR-011:** Business rules:
  - Даты не в будущем
  - Суммы в разумных пределах (0.01 - 1,000,000)
  - Категории из предопределённого списка (или новые помечаются)

#### Data Storage
- [ ] **FR-012:** Сохранение metadata в Supabase:
  - `uploads` table: id, filename, upload_date, status, row_count
- [ ] **FR-013:** Сохранение parsed данных в Supabase:
  - `transactions` table: id, upload_id, date, amount, category, description
- [ ] **FR-014:** Atomic операции (rollback при ошибках)

#### API Response
- [ ] **FR-015:** Success response (200):
  ```json
  {
    "success": true,
    "upload_id": "uuid",
    "stats": {
      "total_rows": 1247,
      "valid_rows": 1245,
      "invalid_rows": 2,
      "columns": ["date", "amount", "category", "description"]
    },
    "preview": [/* first 5 rows */],
    "warnings": [
      {
        "row": 10,
        "field": "amount",
        "message": "Amount seems unusually high: 500,000",
        "severity": "warning"
      }
    ]
  }
  ```

#### Error Handling
- [ ] **FR-016:** Детальные error responses с suggestions:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_CSV_FORMAT",
      "message": "CSV file is missing required columns",
      "details": {
        "missing_columns": ["date", "amount"],
        "found_columns": ["дата", "сумма", "category"]
      },
      "suggestions": [
        "Rename column 'дата' to 'date'",
        "Rename column 'сумма' to 'amount'",
        "Download our CSV template"
      ]
    }
  }
  ```
- [ ] **FR-017:** HTTP status codes:
  - 200: Success
  - 400: Bad request (validation errors)
  - 413: File too large
  - 415: Unsupported media type (not CSV)
  - 500: Server error

### P1 (Should Have - Near Future)

- [ ] **FR-018:** Column mapping endpoint:
  - POST `/api/upload/map-columns` для mapping user columns → required columns
- [ ] **FR-019:** Batch upload (multiple files)
- [ ] **FR-020:** Progress tracking via WebSocket
- [ ] **FR-021:** CSV template download endpoint: GET `/api/template`
- [ ] **FR-022:** Encoding detection & conversion (UTF-8, Windows-1251, UTF-16)
- [ ] **FR-023:** Async processing для больших файлов (> 5MB)
- [ ] **FR-024:** Rate limiting: 10 uploads/hour per IP

### P2 (Nice to Have - Future)

- [ ] **FR-025:** Excel file support (.xlsx)
- [ ] **FR-026:** JSON/XML upload
- [ ] **FR-027:** Data preview без сохранения (POST `/api/preview`)
- [ ] **FR-028:** Automatic data cleaning (trim whitespace, fix casing)
- [ ] **FR-029:** Export processed data (GET `/api/uploads/:id/export`)

---

## 4. 🏗️ Technical Architecture

### Tech Stack
- **Runtime:** Node.js 20.x
- **Framework:** Fastify 4.x
- **Language:** TypeScript 5.x
- **Database:** Supabase (PostgreSQL 15)
- **File Storage:** Local filesystem (`uploads/` directory)
- **CSV Parser:** Papa Parse
- **Validation:** Zod
- **Testing:** Vitest

### Project Structure
```
backend/
├── src/
│   ├── routes/
│   │   └── upload.routes.ts      # POST /api/upload
│   ├── services/
│   │   ├── csv.service.ts         # CSV parsing & validation
│   │   ├── storage.service.ts     # File storage
│   │   └── database.service.ts    # Supabase operations
│   ├── validators/
│   │   ├── csv.validator.ts       # Validation rules
│   │   └── business.rules.ts      # Business logic validation
│   ├── types/
│   │   └── upload.types.ts        # TypeScript interfaces
│   ├── utils/
│   │   ├── errors.ts              # Custom error classes
│   │   └── logger.ts              # Winston logger
│   └── server.ts                  # Fastify app
├── uploads/                       # Uploaded files (gitignored)
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
└── .env.example
```

### Environment Variables
```bash
# .env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_MIME_TYPES=text/csv,application/csv

# Rate Limiting
RATE_LIMIT_WINDOW=3600000  # 1 hour in ms
RATE_LIMIT_MAX=10          # 10 uploads per window
```

---

## 5. 📡 API Specification

### Endpoint: Upload CSV

**Request:**
```http
POST /api/upload HTTP/1.1
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="transactions.csv"
Content-Type: text/csv

date,amount,category,description
2024-01-15,1500.00,Salary,Monthly salary
2024-01-16,-50.00,Food,Groceries
------WebKitFormBoundary--
```

**Success Response (200):**
```json
{
  "success": true,
  "upload_id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "transactions.csv",
  "uploaded_at": "2026-01-26T15:30:00Z",
  "stats": {
    "total_rows": 1247,
    "valid_rows": 1245,
    "invalid_rows": 2,
    "columns": ["date", "amount", "category", "description"],
    "date_range": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    },
    "amount_summary": {
      "total": 125000.50,
      "positive": 150000.00,
      "negative": -24999.50,
      "avg": 100.24
    }
  },
  "preview": [
    {
      "row": 1,
      "date": "2024-01-15",
      "amount": 1500.00,
      "category": "Salary",
      "description": "Monthly salary"
    },
    {
      "row": 2,
      "date": "2024-01-16",
      "amount": -50.00,
      "category": "Food",
      "description": "Groceries"
    }
    // ... 3 more rows
  ],
  "warnings": [
    {
      "row": 10,
      "field": "amount",
      "message": "Amount seems unusually high: 500,000.00",
      "severity": "warning",
      "value": 500000.00
    },
    {
      "row": 15,
      "field": "category",
      "message": "Unknown category 'Car Repair'. Added to custom categories.",
      "severity": "info",
      "value": "Car Repair"
    }
  ]
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "CSV file contains invalid data",
    "timestamp": "2026-01-26T15:30:00Z",
    "errors": [
      {
        "row": 5,
        "field": "date",
        "message": "Invalid date format. Expected YYYY-MM-DD or DD.MM.YYYY",
        "value": "15/01/2024",
        "suggestion": "Change to '2024-01-15' or '15.01.2024'"
      },
      {
        "row": 8,
        "field": "amount",
        "message": "Amount must be a number",
        "value": "abc",
        "suggestion": "Enter a valid number like 100.50"
      }
    ],
    "suggestions": [
      "Fix 2 validation errors and try again",
      "Download our CSV template for correct format"
    ]
  }
}
```

**Error Response (413):**
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 10MB limit",
    "details": {
      "file_size": 15728640,
      "max_size": 10485760
    },
    "suggestions": [
      "Split your CSV into smaller files",
      "Remove unnecessary columns",
      "Contact support for enterprise limits"
    ]
  }
}
```

---

## 6. 🗄️ Data Model

### Supabase Tables

#### Table: `uploads`
```sql
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'processing',
    -- values: 'processing', 'completed', 'failed'
  row_count INTEGER,
  valid_row_count INTEGER,
  invalid_row_count INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uploads_status ON uploads(status);
CREATE INDEX idx_uploads_upload_date ON uploads(upload_date);
```

#### Table: `transactions`
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  is_valid BOOLEAN DEFAULT true,
  validation_errors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_upload_id ON transactions(upload_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_amount ON transactions(amount);
```

#### Table: `categories` (optional, for P1)
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL,  -- 'income', 'expense'
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate with common categories
INSERT INTO categories (name, type, is_default) VALUES
  ('Salary', 'income', true),
  ('Food', 'expense', true),
  ('Transport', 'expense', true),
  ('Utilities', 'expense', true),
  ('Entertainment', 'expense', true);
```

---

## 7. ✅ Validation Rules

### File-Level Validation
```typescript
interface FileValidationRules {
  maxSize: 10 * 1024 * 1024;  // 10MB
  allowedExtensions: ['.csv'];
  allowedMimeTypes: ['text/csv', 'application/csv', 'text/plain'];
  requiredColumns: ['date', 'amount', 'category'];
  optionalColumns: ['description'];
}
```

### Row-Level Validation
```typescript
interface RowValidationRules {
  date: {
    required: true;
    formats: ['YYYY-MM-DD', 'DD.MM.YYYY', 'DD/MM/YYYY'];
    range: { min: '2020-01-01', max: 'today' };
    message: 'Invalid date format or date is in the future';
  };
  
  amount: {
    required: true;
    type: 'number';
    range: { min: 0.01, max: 1000000 };
    decimals: 2;
    message: 'Amount must be between 0.01 and 1,000,000';
  };
  
  category: {
    required: true;
    type: 'string';
    maxLength: 100;
    trimWhitespace: true;
    message: 'Category is required (max 100 characters)';
  };
  
  description: {
    required: false;
    type: 'string';
    maxLength: 500;
    trimWhitespace: true;
  };
}
```

### Business Rules
```typescript
interface BusinessRules {
  // Duplicate detection
  checkDuplicates: {
    fields: ['date', 'amount', 'category'];
    action: 'warn';  // 'warn' or 'reject'
    message: 'Possible duplicate transaction detected';
  };
  
  // Unusual amounts
  unusualAmount: {
    threshold: 10000;  // > $10k
    action: 'warn';
    message: 'Amount seems unusually high';
  };
  
  // Unknown categories
  unknownCategory: {
    action: 'warn';
    message: 'Category not in predefined list. Adding to custom categories.';
  };
  
  // Date sequence
  dateSequence: {
    checkGaps: true;
    maxGapDays: 90;
    action: 'warn';
    message: 'Large gap detected between transactions';
  };
}
```

---

## 8. 🚨 Error Handling

### Error Codes
```typescript
enum ErrorCode {
  // File errors (4xx)
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_EMPTY = 'FILE_EMPTY',
  FILE_CORRUPT = 'FILE_CORRUPT',
  
  // Validation errors (4xx)
  MISSING_REQUIRED_COLUMNS = 'MISSING_REQUIRED_COLUMNS',
  INVALID_CSV_FORMAT = 'INVALID_CSV_FORMAT',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  DUPLICATE_DETECTED = 'DUPLICATE_DETECTED',
  
  // Server errors (5xx)
  DATABASE_ERROR = 'DATABASE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

### Error Response Structure
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    timestamp: string;
    details?: Record<string, any>;
    errors?: ValidationError[];
    suggestions: string[];
  };
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
  suggestion: string;
}
```

### Logging
```typescript
// Use Winston for structured logging
logger.info('CSV upload started', {
  filename: 'transactions.csv',
  size: 1024000,
  ip: req.ip,
});

logger.error('CSV validation failed', {
  filename: 'transactions.csv',
  errorCount: 5,
  errors: validationErrors,
});

logger.warn('Unusual amount detected', {
  uploadId: 'uuid',
  row: 10,
  amount: 500000,
});
```

---

## 9. ❌ Non-Goals (What We're NOT Building)

### Out of Scope for MVP:
- ❌ **Authentication/Authorization** - API is public for MVP (add in Phase 2.1)
- ❌ **Excel/XLSX support** - CSV only (add in P2)
- ❌ **Real-time processing WebSocket** - Simple HTTP only (add in P1)
- ❌ **Data visualization** - API only, frontend does visualization
- ❌ **AI Analysis** - Separate feature in Phase 3
- ❌ **Multi-tenancy** - Single tenant for MVP
- ❌ **Cloud storage (S3/Cloudinary)** - Local filesystem for MVP
- ❌ **Data export** - Upload only (export in P2)
- ❌ **Automatic data cleaning** - Manual fix only (cleaning in P2)

### Explicit Boundaries:
- **Not a full ERP system** - Only CSV upload & validation
- **Not a data warehouse** - Simple transactional storage
- **Not a BI tool** - No aggregations/reports in API
- **Not a file converter** - CSV only, no format conversion

---

## 10. ❓ Open Questions

### Technical Decisions Needed:
1. **File retention:** How long to keep uploaded CSV files?
   - Option A: 30 days
   - Option B: Until manually deleted
   - Option C: Forever (with archiving after 90 days)

2. **Concurrency:** Max simultaneous uploads per server?
   - Option A: 10 concurrent uploads
   - Option B: 50 concurrent uploads
   - Option C: Unlimited (с queue)

3. **Validation strictness:** Reject or warn for soft validation failures?
   - Option A: Strict (reject any warnings)
   - Option B: Permissive (warn but allow)
   - Option C: Configurable per request

4. **Error recovery:** What to do with partially valid files?
   - Option A: All or nothing (reject entire file)
   - Option B: Save valid rows, skip invalid
   - Option C: Save all with is_valid flag

### Product Questions:
5. **CSV template:** Should we provide a downloadable template?
   - Yes → Add GET `/api/template` endpoint (P1)
   
6. **Column aliases:** Support alternative column names?
   - Example: 'дата' = 'date', 'сумма' = 'amount'
   - Yes → Add column mapping (P1)

7. **Bulk delete:** Delete uploaded data?
   - Yes → Add DELETE `/api/uploads/:id` (P1)

---

## 11. 📝 Implementation Notes

### Phase 1: Basic Upload (Week 1)
1. Setup Fastify + TypeScript project
2. Configure Supabase connection
3. Implement POST `/api/upload` with basic file handling
4. Add local file storage
5. Basic CSV parsing (Papa Parse)

### Phase 2: Validation (Week 1-2)
6. Implement Zod schemas for validation
7. Add business rules validation
8. Implement duplicate detection
9. Create detailed error responses

### Phase 3: Database (Week 2)
10. Create Supabase tables (uploads, transactions)
11. Implement atomic save operations
12. Add rollback on errors
13. Optimize queries with indexes

### Phase 4: Polish (Week 2-3)
14. Add comprehensive logging
15. Write unit tests (80%+ coverage)
16. Write integration tests
17. API documentation (Swagger/OpenAPI)
18. Performance testing (load 10MB file < 2s)

---

## 12. 🎯 Acceptance Criteria

### Definition of Done:
- [ ] API endpoint responds to POST `/api/upload`
- [ ] File size validation works (reject > 10MB)
- [ ] CSV parsing works for valid files
- [ ] All required columns validated
- [ ] Data types validated (date, amount, string)
- [ ] Business rules applied (dates not in future, amounts in range)
- [ ] Duplicate detection works
- [ ] Data saved to Supabase (uploads + transactions tables)
- [ ] Success response includes stats + preview + warnings
- [ ] Error responses include detailed messages + suggestions
- [ ] All error codes implemented
- [ ] Unit tests written (80%+ coverage)
- [ ] Integration tests written
- [ ] API documentation created
- [ ] Performance meets requirements (< 2s for 10MB)
- [ ] Logging implemented
- [ ] Frontend can integrate in < 30 minutes

---

## 13. 📚 References

### Dependencies:
- Fastify: https://www.fastify.io/
- Papa Parse: https://www.papaparse.com/
- Zod: https://zod.dev/
- Supabase JS: https://supabase.com/docs/reference/javascript
- Winston: https://github.com/winstonjs/winston

### Related PRDs:
- (Future) PRD: Authentication System
- (Future) PRD: AI Analysis Engine
- (Future) PRD: Data Export API

---

**Status:** ✅ Ready for Implementation  
**Estimated Effort:** 2-3 weeks (1 developer)  
**Risk Level:** Medium (Supabase setup, validation complexity)  

---

_This PRD was generated using @generate-prd skill based on user answers:_
- _1B: Fastify + TypeScript_
- _2D: Supabase_
- _3A: Local filesystem_
- _4A: No auth (MVP)_
- _5C: Full validation_
- _6D: Detailed response_
- _7C: Detailed errors + suggestions_
