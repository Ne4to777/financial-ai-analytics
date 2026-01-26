# Tasks: CSV Processing API

**Generated from:** tasks/prd-csv-processing-api.md  
**Created:** 26 января 2026  
**Project:** FinAI Analytics  
**Estimated Total Time:** 2-3 weeks (1 developer)

---

## 📊 Phase Overview

| Phase | Tasks | Estimated Time | Priority |
|-------|-------|----------------|----------|
| Phase 0: Setup | 5 tasks | 1 day | P0 |
| Phase 1: Basic Upload | 7 tasks | 3-4 days | P0 |
| Phase 2: Validation | 8 tasks | 3-4 days | P0 |
| Phase 3: Database | 6 tasks | 2-3 days | P0 |
| Phase 4: Error Handling | 5 tasks | 2 days | P0 |
| Phase 5: Testing & Documentation | 6 tasks | 2-3 days | P0 |
| Phase 6: Polish & Deploy | 4 tasks | 1-2 days | P1 |

**Total:** 41 tasks

---

## Phase 0: Project Setup & Infrastructure

### Task 0.0: Create feature branch
- [ ] **0.0** Create feature branch
  - [ ] 0.0.1 Create branch: `git checkout -b feat/csv-processing-api-$(date +%Y%m%d)`
  - [ ] 0.0.2 Push to remote: `git push -u origin HEAD`
  - [ ] 0.0.3 Verify branch in GitHub

**Priority:** P0  
**Estimated Time:** 5 minutes  
**Dependencies:** None

---

### Task 0.1: Initialize backend project
- [ ] **0.1** Setup Node.js + TypeScript project
  - [ ] 0.1.1 Create `backend/` directory
  - [ ] 0.1.2 Initialize npm: `npm init -y`
  - [ ] 0.1.3 Install TypeScript: `npm install -D typescript @types/node`
  - [ ] 0.1.4 Create `tsconfig.json` with strict mode
  - [ ] 0.1.5 Add npm scripts: `build`, `dev`, `start`

**Priority:** P0  
**Estimated Time:** 30 minutes  
**Files:**
- `backend/package.json`
- `backend/tsconfig.json`

---

### Task 0.2: Install dependencies
- [ ] **0.2** Install core dependencies
  - [ ] 0.2.1 Install Fastify: `npm install fastify`
  - [ ] 0.2.2 Install Fastify multipart: `npm install @fastify/multipart`
  - [ ] 0.2.3 Install Supabase: `npm install @supabase/supabase-js`
  - [ ] 0.2.4 Install Papa Parse: `npm install papaparse @types/papaparse`
  - [ ] 0.2.5 Install Zod: `npm install zod`
  - [ ] 0.2.6 Install Winston: `npm install winston`
  - [ ] 0.2.7 Install dotenv: `npm install dotenv`

**Priority:** P0  
**Estimated Time:** 15 minutes  
**Files:**
- `backend/package.json`
- `backend/package-lock.json`

---

### Task 0.3: Setup project structure
- [ ] **0.3** Create directory structure
  - [ ] 0.3.1 Create `src/` directory
  - [ ] 0.3.2 Create `src/routes/` for API routes
  - [ ] 0.3.3 Create `src/services/` for business logic
  - [ ] 0.3.4 Create `src/validators/` for validation
  - [ ] 0.3.5 Create `src/types/` for TypeScript types
  - [ ] 0.3.6 Create `src/utils/` for utilities
  - [ ] 0.3.7 Create `uploads/` directory for files
  - [ ] 0.3.8 Create `tests/` directory
  - [ ] 0.3.9 Add `uploads/` to `.gitignore`

**Priority:** P0  
**Estimated Time:** 10 minutes  
**Files:**
- Multiple directories

---

### Task 0.4: Configure Supabase
- [ ] **0.4** Setup Supabase connection
  - [ ] 0.4.1 Create `.env.example` with Supabase variables
  - [ ] 0.4.2 Create `.env` (local) with real credentials
  - [ ] 0.4.3 Add `.env` to `.gitignore`
  - [ ] 0.4.4 Create `src/config/supabase.ts` with client setup
  - [ ] 0.4.5 Test connection with simple query

**Priority:** P0  
**Estimated Time:** 30 minutes  
**Files:**
- `backend/.env.example`
- `backend/.env` (gitignored)
- `backend/src/config/supabase.ts`

---

## Phase 1: Basic File Upload

### Task 1.0: Create basic Fastify server
- [ ] **1.0** Setup Fastify application
  - [ ] 1.0.1 Create `src/server.ts` with Fastify instance
  - [ ] 1.0.2 Configure CORS (allow all origins for MVP)
  - [ ] 1.0.3 Register multipart plugin
  - [ ] 1.0.4 Add health check endpoint: GET `/health`
  - [ ] 1.0.5 Start server on port 3001
  - [ ] 1.0.6 Add graceful shutdown
  - [ ] 1.0.7 Test server starts successfully

**Priority:** P0  
**Estimated Time:** 1 hour  
**Files:**
- `backend/src/server.ts`

**Acceptance Criteria:**
- Server starts without errors
- `GET http://localhost:3001/health` returns 200

---

### Task 1.1: Create upload route
- [ ] **1.1** Implement POST `/api/upload` endpoint
  - [ ] 1.1.1 Create `src/routes/upload.routes.ts`
  - [ ] 1.1.2 Define route handler for POST `/api/upload`
  - [ ] 1.1.3 Accept multipart/form-data with file field
  - [ ] 1.1.4 Extract file from request
  - [ ] 1.1.5 Log received file info (name, size, mimetype)
  - [ ] 1.1.6 Return success response with file metadata
  - [ ] 1.1.7 Register route in server.ts

**Priority:** P0  
**Estimated Time:** 1.5 hours  
**Files:**
- `backend/src/routes/upload.routes.ts`

**Acceptance Criteria:**
- Endpoint accepts file upload
- Returns 200 with file metadata

---

### Task 1.2: Implement file validation
- [ ] **1.2** Validate uploaded file
  - [ ] 1.2.1 Create `src/validators/file.validator.ts`
  - [ ] 1.2.2 Check file exists
  - [ ] 1.2.3 Check file size <= 10MB
  - [ ] 1.2.4 Check file extension is `.csv`
  - [ ] 1.2.5 Check MIME type is `text/csv` or `application/csv`
  - [ ] 1.2.6 Return validation errors with error codes
  - [ ] 1.2.7 Add unit tests for validator

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/validators/file.validator.ts`
- `backend/tests/unit/file.validator.test.ts`

**Acceptance Criteria:**
- Rejects files > 10MB with 413 error
- Rejects non-CSV files with 415 error
- Unit tests pass

---

### Task 1.3: Implement file storage service
- [ ] **1.3** Save uploaded files to local filesystem
  - [ ] 1.3.1 Create `src/services/storage.service.ts`
  - [ ] 1.3.2 Generate unique filename (UUID + timestamp)
  - [ ] 1.3.3 Save file to `uploads/` directory
  - [ ] 1.3.4 Return file path and metadata
  - [ ] 1.3.5 Handle storage errors (disk full, permissions)
  - [ ] 1.3.6 Add cleanup method (optional, for testing)
  - [ ] 1.3.7 Add unit tests

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/services/storage.service.ts`
- `backend/tests/unit/storage.service.test.ts`

**Acceptance Criteria:**
- Files saved with unique names
- Returns correct file path
- Handles errors gracefully

---

### Task 1.4: Implement CSV parsing service
- [ ] **1.4** Parse CSV files with Papa Parse
  - [ ] 1.4.1 Create `src/services/csv.service.ts`
  - [ ] 1.4.2 Configure Papa Parse options (header: true, skipEmptyLines: true)
  - [ ] 1.4.3 Parse CSV file from file path
  - [ ] 1.4.4 Extract columns from header
  - [ ] 1.4.5 Extract rows data
  - [ ] 1.4.6 Handle parsing errors (malformed CSV, encoding issues)
  - [ ] 1.4.7 Return parsed data structure
  - [ ] 1.4.8 Add unit tests with sample CSV files

**Priority:** P0  
**Estimated Time:** 2.5 hours  
**Files:**
- `backend/src/services/csv.service.ts`
- `backend/tests/unit/csv.service.test.ts`
- `backend/tests/fixtures/sample.csv`

**Acceptance Criteria:**
- Parses valid CSV files
- Returns columns and rows
- Handles malformed CSV gracefully

---

### Task 1.5: Create TypeScript types
- [ ] **1.5** Define type interfaces
  - [ ] 1.5.1 Create `src/types/upload.types.ts`
  - [ ] 1.5.2 Define `UploadRequest` interface
  - [ ] 1.5.3 Define `UploadResponse` interface
  - [ ] 1.5.4 Define `FileMetadata` interface
  - [ ] 1.5.5 Define `ParsedCSV` interface
  - [ ] 1.5.6 Define `Transaction` interface
  - [ ] 1.5.7 Define error types

**Priority:** P0  
**Estimated Time:** 1 hour  
**Files:**
- `backend/src/types/upload.types.ts`

**Acceptance Criteria:**
- All types exported
- No TypeScript errors

---

### Task 1.6: Integrate services in upload route
- [ ] **1.6** Connect all services together
  - [ ] 1.6.1 Update `upload.routes.ts` to use validators
  - [ ] 1.6.2 Call storage service to save file
  - [ ] 1.6.3 Call CSV service to parse file
  - [ ] 1.6.4 Build success response with metadata
  - [ ] 1.6.5 Add error handling for each step
  - [ ] 1.6.6 Test end-to-end upload flow

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/routes/upload.routes.ts` (update)

**Acceptance Criteria:**
- File uploads successfully
- Parses CSV
- Returns metadata
- Handles errors at each step

---

## Phase 2: Data Validation

### Task 2.0: Create Zod validation schemas
- [ ] **2.0** Define data validation schemas
  - [ ] 2.0.1 Create `src/validators/schema.validator.ts`
  - [ ] 2.0.2 Create schema for `date` field (ISO or DD.MM.YYYY)
  - [ ] 2.0.3 Create schema for `amount` field (number, 0.01-1000000)
  - [ ] 2.0.4 Create schema for `category` field (string, max 100 chars)
  - [ ] 2.0.5 Create schema for `description` field (optional string, max 500)
  - [ ] 2.0.6 Create combined `TransactionSchema`
  - [ ] 2.0.7 Add unit tests for each schema

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/validators/schema.validator.ts`
- `backend/tests/unit/schema.validator.test.ts`

**Acceptance Criteria:**
- All schemas defined
- Validates correct data
- Rejects invalid data
- Tests pass

---

### Task 2.1: Implement column validation
- [ ] **2.1** Check required columns exist
  - [ ] 2.1.1 Create `src/validators/csv.validator.ts`
  - [ ] 2.1.2 Check required columns: date, amount, category
  - [ ] 2.1.3 Return missing columns list
  - [ ] 2.1.4 Suggest column mapping if similar names found
  - [ ] 2.1.5 Add unit tests

**Priority:** P0  
**Estimated Time:** 1.5 hours  
**Files:**
- `backend/src/validators/csv.validator.ts`
- `backend/tests/unit/csv.validator.test.ts`

**Acceptance Criteria:**
- Detects missing columns
- Returns helpful error messages
- Suggests alternatives

---

### Task 2.2: Implement row-level validation
- [ ] **2.2** Validate each row with Zod
  - [ ] 2.2.1 Update CSV service to validate rows
  - [ ] 2.2.2 Loop through each row and apply TransactionSchema
  - [ ] 2.2.3 Collect validation errors per row
  - [ ] 2.2.4 Mark rows as valid/invalid
  - [ ] 2.2.5 Return validation results
  - [ ] 2.2.6 Add integration tests

**Priority:** P0  
**Estimated Time:** 2.5 hours  
**Files:**
- `backend/src/services/csv.service.ts` (update)
- `backend/tests/integration/validation.test.ts`

**Acceptance Criteria:**
- Validates all rows
- Collects errors
- Returns structured results

---

### Task 2.3: Implement date format validation
- [ ] **2.3** Support multiple date formats
  - [ ] 2.3.1 Create `src/utils/date.utils.ts`
  - [ ] 2.3.2 Parse YYYY-MM-DD format
  - [ ] 2.3.3 Parse DD.MM.YYYY format
  - [ ] 2.3.4 Parse DD/MM/YYYY format
  - [ ] 2.3.5 Validate date is not in future
  - [ ] 2.3.6 Validate date is after 2020-01-01
  - [ ] 2.3.7 Return normalized ISO format
  - [ ] 2.3.8 Add unit tests for all formats

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/utils/date.utils.ts`
- `backend/tests/unit/date.utils.test.ts`

**Acceptance Criteria:**
- Parses all 3 date formats
- Validates ranges
- Returns ISO format
- Tests pass

---

### Task 2.4: Implement business rules validation
- [ ] **2.4** Add business logic checks
  - [ ] 2.4.1 Create `src/validators/business.rules.ts`
  - [ ] 2.4.2 Check for duplicate transactions (date + amount + category)
  - [ ] 2.4.3 Flag unusual amounts (> $10,000)
  - [ ] 2.4.4 Check for unknown categories
  - [ ] 2.4.5 Detect large date gaps (> 90 days)
  - [ ] 2.4.6 Return warnings (not errors)
  - [ ] 2.4.7 Add unit tests

**Priority:** P0  
**Estimated Time:** 3 hours  
**Files:**
- `backend/src/validators/business.rules.ts`
- `backend/tests/unit/business.rules.test.ts`

**Acceptance Criteria:**
- Detects duplicates
- Flags unusual values
- Returns warnings
- Tests pass

---

### Task 2.5: Implement validation result builder
- [ ] **2.5** Build structured validation response
  - [ ] 2.5.1 Create `src/services/validation.service.ts`
  - [ ] 2.5.2 Aggregate all validation errors
  - [ ] 2.5.3 Aggregate all warnings
  - [ ] 2.5.4 Calculate stats (valid/invalid rows)
  - [ ] 2.5.5 Generate suggestions for fixes
  - [ ] 2.5.6 Return structured ValidationResult
  - [ ] 2.5.7 Add unit tests

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/services/validation.service.ts`
- `backend/tests/unit/validation.service.test.ts`

**Acceptance Criteria:**
- Aggregates all results
- Provides suggestions
- Tests pass

---

### Task 2.6: Generate preview data
- [ ] **2.6** Extract first 5 rows for preview
  - [ ] 2.6.1 Update CSV service to extract preview
  - [ ] 2.6.2 Include row numbers
  - [ ] 2.6.3 Include validation status per row
  - [ ] 2.6.4 Format for API response
  - [ ] 2.6.5 Add tests

**Priority:** P0  
**Estimated Time:** 1 hour  
**Files:**
- `backend/src/services/csv.service.ts` (update)

**Acceptance Criteria:**
- Returns first 5 rows
- Includes validation status
- Formatted correctly

---

### Task 2.7: Calculate statistics
- [ ] **2.7** Calculate upload statistics
  - [ ] 2.7.1 Create `src/services/stats.service.ts`
  - [ ] 2.7.2 Calculate total rows
  - [ ] 2.7.3 Calculate valid/invalid rows
  - [ ] 2.7.4 Calculate date range (min/max)
  - [ ] 2.7.5 Calculate amount summary (total, avg, min, max)
  - [ ] 2.7.6 Count categories
  - [ ] 2.7.7 Add unit tests

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/services/stats.service.ts`
- `backend/tests/unit/stats.service.test.ts`

**Acceptance Criteria:**
- Calculates all stats
- Returns structured object
- Tests pass

---

## Phase 3: Database Integration

### Task 3.0: Create Supabase tables
- [ ] **3.0** Setup database schema
  - [ ] 3.0.1 Create `database/migrations/001_create_uploads_table.sql`
  - [ ] 3.0.2 Create `uploads` table with columns (id, filename, file_path, status, etc.)
  - [ ] 3.0.3 Add indexes on status and upload_date
  - [ ] 3.0.4 Create `002_create_transactions_table.sql`
  - [ ] 3.0.5 Create `transactions` table with columns (id, upload_id, date, amount, etc.)
  - [ ] 3.0.6 Add foreign key to uploads
  - [ ] 3.0.7 Add indexes on upload_id, date, category
  - [ ] 3.0.8 Run migrations in Supabase dashboard

**Priority:** P0  
**Estimated Time:** 1.5 hours  
**Files:**
- `backend/database/migrations/001_create_uploads_table.sql`
- `backend/database/migrations/002_create_transactions_table.sql`

**Acceptance Criteria:**
- Tables created in Supabase
- Indexes created
- Foreign keys work

---

### Task 3.1: Create database service
- [ ] **3.1** Implement database operations
  - [ ] 3.1.1 Create `src/services/database.service.ts`
  - [ ] 3.1.2 Implement `createUpload()` - insert into uploads table
  - [ ] 3.1.3 Implement `createTransactions()` - batch insert into transactions
  - [ ] 3.1.4 Implement `updateUploadStatus()` - update upload record
  - [ ] 3.1.5 Implement `getUploadById()` - fetch upload by ID
  - [ ] 3.1.6 Add error handling for database errors
  - [ ] 3.1.7 Add unit tests (with mocked Supabase client)

**Priority:** P0  
**Estimated Time:** 3 hours  
**Files:**
- `backend/src/services/database.service.ts`
- `backend/tests/unit/database.service.test.ts`

**Acceptance Criteria:**
- All CRUD operations work
- Handles errors
- Tests pass

---

### Task 3.2: Implement atomic save operation
- [ ] **3.2** Save upload + transactions atomically
  - [ ] 3.2.1 Update database service with transaction support
  - [ ] 3.2.2 Begin transaction
  - [ ] 3.2.3 Insert into uploads table
  - [ ] 3.2.4 Insert all transactions (batch)
  - [ ] 3.2.5 Commit transaction on success
  - [ ] 3.2.6 Rollback transaction on error
  - [ ] 3.2.7 Add integration tests

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/services/database.service.ts` (update)
- `backend/tests/integration/database.test.ts`

**Acceptance Criteria:**
- Atomic operations work
- Rollback on error
- Tests pass

---

### Task 3.3: Integrate database in upload flow
- [ ] **3.3** Save validated data to database
  - [ ] 3.3.1 Update upload route to call database service
  - [ ] 3.3.2 Save upload metadata
  - [ ] 3.3.3 Save all valid transactions
  - [ ] 3.3.4 Update upload status to 'completed'
  - [ ] 3.3.5 Handle database errors (return 500)
  - [ ] 3.3.6 Add integration test for full flow

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/routes/upload.routes.ts` (update)
- `backend/tests/integration/upload-flow.test.ts`

**Acceptance Criteria:**
- Data saved to database
- Returns upload_id
- Full flow works

---

### Task 3.4: Add database connection pooling
- [ ] **3.4** Optimize database connections
  - [ ] 3.4.1 Configure Supabase client with connection pooling
  - [ ] 3.4.2 Set max connections limit
  - [ ] 3.4.3 Add connection retry logic
  - [ ] 3.4.4 Add connection health checks
  - [ ] 3.4.5 Test under load

**Priority:** P1  
**Estimated Time:** 1.5 hours  
**Files:**
- `backend/src/config/supabase.ts` (update)

**Acceptance Criteria:**
- Connection pooling works
- Handles connection errors
- Performance improved

---

### Task 3.5: Implement query optimization
- [ ] **3.5** Optimize database queries
  - [ ] 3.5.1 Use batch inserts for transactions
  - [ ] 3.5.2 Add prepared statements
  - [ ] 3.5.3 Verify indexes are used (EXPLAIN ANALYZE)
  - [ ] 3.5.4 Measure query performance
  - [ ] 3.5.5 Optimize slow queries (< 100ms target)

**Priority:** P1  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/services/database.service.ts` (update)

**Acceptance Criteria:**
- Queries < 100ms
- Indexes used
- Batch operations work

---

## Phase 4: Error Handling & Logging

### Task 4.0: Create error classes
- [ ] **4.0** Define custom error types
  - [ ] 4.0.1 Create `src/utils/errors.ts`
  - [ ] 4.0.2 Define `AppError` base class
  - [ ] 4.0.3 Define `ValidationError` class
  - [ ] 4.0.4 Define `DatabaseError` class
  - [ ] 4.0.5 Define `FileError` class
  - [ ] 4.0.6 Add error codes enum
  - [ ] 4.0.7 Add unit tests

**Priority:** P0  
**Estimated Time:** 1.5 hours  
**Files:**
- `backend/src/utils/errors.ts`
- `backend/tests/unit/errors.test.ts`

**Acceptance Criteria:**
- All error classes defined
- Error codes enum complete
- Tests pass

---

### Task 4.1: Implement error handler middleware
- [ ] **4.1** Create global error handler
  - [ ] 4.1.1 Create `src/middleware/error.middleware.ts`
  - [ ] 4.1.2 Catch all errors
  - [ ] 4.1.3 Format error responses
  - [ ] 4.1.4 Map errors to HTTP status codes
  - [ ] 4.1.5 Add error logging
  - [ ] 4.1.6 Hide internal errors in production
  - [ ] 4.1.7 Register middleware in server.ts

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/middleware/error.middleware.ts`

**Acceptance Criteria:**
- Catches all errors
- Returns structured responses
- Logs errors

---

### Task 4.2: Implement suggestion generator
- [ ] **4.2** Generate helpful error suggestions
  - [ ] 4.2.1 Create `src/utils/suggestions.ts`
  - [ ] 4.2.2 Generate suggestions for missing columns
  - [ ] 4.2.3 Generate suggestions for invalid dates
  - [ ] 4.2.4 Generate suggestions for invalid amounts
  - [ ] 4.2.5 Generate suggestions for file errors
  - [ ] 4.2.6 Add unit tests

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/utils/suggestions.ts`
- `backend/tests/unit/suggestions.test.ts`

**Acceptance Criteria:**
- Generates helpful suggestions
- Covers all error types
- Tests pass

---

### Task 4.3: Setup Winston logger
- [ ] **4.3** Configure structured logging
  - [ ] 4.3.1 Create `src/utils/logger.ts`
  - [ ] 4.3.2 Configure Winston with console transport
  - [ ] 4.3.3 Configure file transport (logs/ directory)
  - [ ] 4.3.4 Add log levels (error, warn, info, debug)
  - [ ] 4.3.5 Add structured logging (JSON format)
  - [ ] 4.3.6 Add request ID to all logs
  - [ ] 4.3.7 Add log rotation

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/utils/logger.ts`

**Acceptance Criteria:**
- Logger configured
- Logs to file and console
- Structured JSON format

---

### Task 4.4: Add logging to all operations
- [ ] **4.4** Instrument code with logs
  - [ ] 4.4.1 Add logs to upload route (start, success, error)
  - [ ] 4.4.2 Add logs to CSV service (parsing start/end, errors)
  - [ ] 4.4.3 Add logs to validation service (validation results)
  - [ ] 4.4.4 Add logs to database service (queries, errors)
  - [ ] 4.4.5 Add performance metrics (response time)
  - [ ] 4.4.6 Test logging works

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- Multiple files (update)

**Acceptance Criteria:**
- All operations logged
- Performance metrics captured
- Logs readable

---

## Phase 5: Testing & Documentation

### Task 5.0: Write unit tests
- [ ] **5.0** Achieve 80%+ unit test coverage
  - [ ] 5.0.1 Setup Vitest configuration
  - [ ] 5.0.2 Write tests for validators (file, csv, schema, business)
  - [ ] 5.0.3 Write tests for services (csv, storage, validation, stats, database)
  - [ ] 5.0.4 Write tests for utilities (errors, logger, suggestions, date)
  - [ ] 5.0.5 Write tests for types
  - [ ] 5.0.6 Run coverage report
  - [ ] 5.0.7 Fix coverage gaps until > 80%

**Priority:** P0  
**Estimated Time:** 4 hours  
**Files:**
- Multiple test files

**Acceptance Criteria:**
- 80%+ code coverage
- All tests pass
- Coverage report generated

---

### Task 5.1: Write integration tests
- [ ] **5.1** Test end-to-end flows
  - [ ] 5.1.1 Test successful upload flow
  - [ ] 5.1.2 Test upload with validation errors
  - [ ] 5.1.3 Test file size rejection (> 10MB)
  - [ ] 5.1.4 Test invalid file type rejection
  - [ ] 5.1.5 Test missing columns error
  - [ ] 5.1.6 Test database save flow
  - [ ] 5.1.7 Test error handling

**Priority:** P0  
**Estimated Time:** 3 hours  
**Files:**
- `backend/tests/integration/*.test.ts`

**Acceptance Criteria:**
- All integration tests pass
- Cover happy path and error cases

---

### Task 5.2: Create test fixtures
- [ ] **5.2** Setup test data
  - [ ] 5.2.1 Create `tests/fixtures/valid.csv`
  - [ ] 5.2.2 Create `tests/fixtures/invalid-dates.csv`
  - [ ] 5.2.3 Create `tests/fixtures/invalid-amounts.csv`
  - [ ] 5.2.4 Create `tests/fixtures/missing-columns.csv`
  - [ ] 5.2.5 Create `tests/fixtures/large-file.csv` (> 10MB)
  - [ ] 5.2.6 Create `tests/fixtures/duplicates.csv`

**Priority:** P0  
**Estimated Time:** 1 hour  
**Files:**
- Multiple CSV files in `tests/fixtures/`

**Acceptance Criteria:**
- All fixture files created
- Cover various test scenarios

---

### Task 5.3: Write API documentation
- [ ] **5.3** Create OpenAPI/Swagger spec
  - [ ] 5.3.1 Install Fastify Swagger plugin
  - [ ] 5.3.2 Define OpenAPI schema for POST `/api/upload`
  - [ ] 5.3.3 Document request format (multipart/form-data)
  - [ ] 5.3.4 Document success response (200)
  - [ ] 5.3.5 Document error responses (400, 413, 415, 500)
  - [ ] 5.3.6 Add examples for all responses
  - [ ] 5.3.7 Serve docs at `/docs`

**Priority:** P0  
**Estimated Time:** 2 hours  
**Files:**
- `backend/src/docs/openapi.yaml`
- `backend/src/server.ts` (update)

**Acceptance Criteria:**
- OpenAPI spec complete
- Examples provided
- Docs accessible at `/docs`

---

### Task 5.4: Write README
- [ ] **5.4** Create backend README
  - [ ] 5.4.1 Create `backend/README.md`
  - [ ] 5.4.2 Add project overview
  - [ ] 5.4.3 Add installation instructions
  - [ ] 5.4.4 Add configuration guide (environment variables)
  - [ ] 5.4.5 Add API usage examples (curl)
  - [ ] 5.4.6 Add development guide (npm scripts)
  - [ ] 5.4.7 Add testing guide
  - [ ] 5.4.8 Add deployment guide

**Priority:** P0  
**Estimated Time:** 1.5 hours  
**Files:**
- `backend/README.md`

**Acceptance Criteria:**
- README complete
- All sections covered
- Examples work

---

### Task 5.5: Performance testing
- [ ] **5.5** Test API performance
  - [ ] 5.5.1 Create performance test script
  - [ ] 5.5.2 Test upload 1MB file (should be < 500ms)
  - [ ] 5.5.3 Test upload 5MB file (should be < 1s)
  - [ ] 5.5.4 Test upload 10MB file (should be < 2s)
  - [ ] 5.5.5 Test concurrent uploads (10 simultaneous)
  - [ ] 5.5.6 Measure memory usage
  - [ ] 5.5.7 Optimize if needed

**Priority:** P1  
**Estimated Time:** 2 hours  
**Files:**
- `backend/tests/performance/load.test.ts`

**Acceptance Criteria:**
- Meets performance targets
- No memory leaks
- Handles concurrency

---

## Phase 6: Polish & Deployment

### Task 6.0: Add rate limiting
- [ ] **6.0** Implement rate limiting
  - [ ] 6.0.1 Install @fastify/rate-limit
  - [ ] 6.0.2 Configure rate limit (10 uploads/hour per IP)
  - [ ] 6.0.3 Return 429 when limit exceeded
  - [ ] 6.0.4 Add rate limit headers to response
  - [ ] 6.0.5 Test rate limiting works

**Priority:** P1  
**Estimated Time:** 1 hour  
**Files:**
- `backend/src/server.ts` (update)

**Acceptance Criteria:**
- Rate limiting works
- Returns 429 when exceeded
- Headers included

---

### Task 6.1: Add health check endpoint
- [ ] **6.1** Implement health checks
  - [ ] 6.1.1 Enhance GET `/health` endpoint
  - [ ] 6.1.2 Check database connection
  - [ ] 6.1.3 Check file system write access
  - [ ] 6.1.4 Return status + uptime + version
  - [ ] 6.1.5 Add `/health/ready` for Kubernetes
  - [ ] 6.1.6 Add `/health/live` for Kubernetes

**Priority:** P1  
**Estimated Time:** 1.5 hours  
**Files:**
- `backend/src/routes/health.routes.ts`

**Acceptance Criteria:**
- Health checks work
- Returns detailed status
- Ready for Kubernetes

---

### Task 6.2: Setup production config
- [ ] **6.2** Prepare for deployment
  - [ ] 6.2.1 Create `backend/.env.production.example`
  - [ ] 6.2.2 Add production Supabase URL
  - [ ] 6.2.3 Configure CORS for production domain
  - [ ] 6.2.4 Set NODE_ENV=production
  - [ ] 6.2.5 Add security headers
  - [ ] 6.2.6 Add Helmet middleware
  - [ ] 6.2.7 Test in production mode locally

**Priority:** P1  
**Estimated Time:** 1.5 hours  
**Files:**
- `backend/.env.production.example`
- `backend/src/server.ts` (update)

**Acceptance Criteria:**
- Production config ready
- Security headers added
- Works in production mode

---

### Task 6.3: Create PR and merge
- [ ] **6.3** Deploy to production
  - [ ] 6.3.1 Run all tests one final time
  - [ ] 6.3.2 Generate test coverage report
  - [ ] 6.3.3 Create PR: `feat/csv-processing-api` → `main`
  - [ ] 6.3.4 Use @pr-workflow for automated PR management
  - [ ] 6.3.5 Wait for CI checks to pass
  - [ ] 6.3.6 Address review comments (if any)
  - [ ] 6.3.7 Merge to main when mergeable_state = "clean"

**Priority:** P0  
**Estimated Time:** Variable (depends on review)  
**Dependencies:** All previous tasks completed  

**Use @pr-workflow skill for automated PR management**

---

## 📊 Summary

**Total Tasks:** 41  
**Estimated Total Time:** 2-3 weeks (1 developer)  
**Priority Breakdown:**
- P0 (Must Have): 37 tasks
- P1 (Should Have): 4 tasks

**Phase Completion Order:**
1. ✅ Phase 0: Setup (1 day)
2. ✅ Phase 1: Basic Upload (3-4 days)
3. ✅ Phase 2: Validation (3-4 days)
4. ✅ Phase 3: Database (2-3 days)
5. ✅ Phase 4: Error Handling (2 days)
6. ✅ Phase 5: Testing & Docs (2-3 days)
7. ✅ Phase 6: Polish & Deploy (1-2 days)

---

## 🚀 How to Use These Tasks

### **Option 1: Interactive (Recommended for first time)**
```bash
@ralph-manual
```
AI will do one task at a time, commit, and stop for your review.

### **Option 2: Overnight (For experienced developers)**
```bash
@ralph-hybrid
# Edit scripts/ralph/prd.json to include these tasks
./scripts/ralph/ralph.sh 41  # All 41 tasks
```

### **Option 3: Manual (Traditional)**
Pick tasks one by one and implement yourself.

---

**Generated:** 26 января 2026  
**Generated by:** @generate-tasks skill  
**Based on:** tasks/prd-csv-processing-api.md
