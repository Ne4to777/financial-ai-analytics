# CSV Processing API Documentation

## Overview

The CSV Processing API allows you to upload, parse, validate, and store CSV transaction files. It provides comprehensive validation, business rule checks, and advanced statistics.

## Base URL

```
http://localhost:3001
```

## Interactive Documentation

Swagger UI is available at: **http://localhost:3001/docs**

OpenAPI specification (JSON): **http://localhost:3001/documentation/json**

## Endpoints

### 1. Health Check

**GET** `/health`

Check if the service is running.

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T17:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

---

### 2. API Information

**GET** `/`

Get API information and available endpoints.

**Response** (200 OK):
```json
{
  "name": "CSV Processing API",
  "version": "1.0.0",
  "description": "Upload, parse, validate, and store CSV files",
  "endpoints": {
    "health": "GET /health",
    "upload": "POST /upload",
    "docs": "GET /docs"
  }
}
```

---

### 3. Upload CSV File

**POST** `/upload`

Upload and process a CSV file containing transaction data.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `file`: CSV file (required, max 10MB)

**CSV Format:**

Required columns:
- `date`: Transaction date (YYYY-MM-DD, DD.MM.YYYY, or DD/MM/YYYY)
- `amount`: Transaction amount (numeric, can be negative)
- `category`: Transaction category (string, max 100 chars)
- `description`: Transaction description (optional, max 500 chars)

Example CSV:
```csv
date,amount,category,description
2024-01-15,1500.00,Salary,Monthly salary
2024-01-16,-50.00,Food,Groceries
2024-01-17,-30.50,Transport,Bus fare
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "CSV file uploaded and processed successfully",
  "data": {
    "uploadId": "550e8400-e29b-41d4-a716-446655440000",
    "file": {
      "filename": "transactions_1705332600000.csv",
      "mimetype": "text/csv",
      "encoding": "7bit",
      "size": 15420
    },
    "csv": {
      "totalRows": 100,
      "totalColumns": 4,
      "columns": ["date", "amount", "category", "description"],
      "delimiter": ",",
      "linebreak": "\n",
      "hasErrors": false,
      "errorCount": 0
    },
    "preview": [
      {
        "date": "2024-01-15",
        "amount": "1500.00",
        "category": "Salary",
        "description": "Monthly salary",
        "_validation": {
          "row": 1,
          "valid": true,
          "errors": []
        }
      }
    ],
    "statistics": {
      "totalRows": 100,
      "validRows": 98,
      "invalidRows": 2,
      "warnings": 5
    },
    "validation": {
      "successRate": 98.0,
      "errorsByField": {
        "date": 1,
        "amount": 1
      },
      "commonErrors": [
        {
          "field": "date",
          "message": "Invalid date format",
          "count": 1
        }
      ]
    },
    "advancedStatistics": {
      "dateRange": {
        "earliest": "2024-01-01",
        "latest": "2024-12-31",
        "daysCovered": 366
      },
      "amounts": {
        "total": 15000.50,
        "average": 150.005,
        "min": -500.00,
        "max": 5000.00,
        "positiveTotal": 20000.00,
        "negativeTotal": -5000.00
      },
      "categories": {
        "total": 12,
        "topCategories": [
          { "category": "Salary", "count": 12, "percentage": 12.0 },
          { "category": "Food", "count": 30, "percentage": 30.0 }
        ]
      },
      "summary": {
        "totalIncome": 20000.00,
        "totalExpenses": 5000.00,
        "netBalance": 15000.00,
        "averageDailyTransactions": 0.273
      }
    },
    "receivedAt": "2024-01-26T15:30:00.000Z",
    "processingTime": 125
  }
}
```

**Error Responses:**

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "CSV file contains invalid data",
    "timestamp": "2026-01-27T17:00:00.000Z",
    "details": {
      "errors": [
        {
          "row": 5,
          "field": "date",
          "message": "Invalid date format. Expected YYYY-MM-DD or DD.MM.YYYY",
          "value": "15/01/2024",
          "suggestion": "Change to '2024-01-15' or '15.01.2024'"
        }
      ]
    }
  }
}
```

#### 400 Bad Request - Missing Columns
```json
{
  "success": false,
  "error": {
    "code": "CSV_MISSING_COLUMNS",
    "message": "CSV file is missing required columns",
    "timestamp": "2026-01-27T17:00:00.000Z",
    "details": {
      "required": ["date", "amount", "category"],
      "found": ["date", "amount"],
      "missing": ["category"],
      "suggestion": "Add the missing column(s): \"category\""
    }
  }
}
```

#### 413 Payload Too Large
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File too large. Maximum size is 10485760 bytes",
    "timestamp": "2026-01-27T17:00:00.000Z",
    "details": {
      "maxSize": 10485760,
      "actualSize": 15000000
    }
  }
}
```

#### 415 Unsupported Media Type
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Invalid file type. Expected .csv but got .xlsx",
    "timestamp": "2026-01-27T17:00:00.000Z",
    "details": {
      "expected": [".csv"],
      "actual": ".xlsx"
    }
  }
}
```

#### 422 Unprocessable Entity - CSV Parse Error
```json
{
  "success": false,
  "error": {
    "code": "CSV_PARSE_ERROR",
    "message": "Failed to parse CSV: Invalid delimiter",
    "timestamp": "2026-01-27T17:00:00.000Z"
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "timestamp": "2026-01-27T17:00:00.000Z"
  }
}
```

---

## Validation Rules

### Date Validation
- **Formats:** YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY
- **Min Date:** 2020-01-01
- **Max Date:** Today (no future dates)
- **Auto-detection:** Automatically detects and converts formats

### Amount Validation
- **Type:** Number (can be negative for expenses)
- **Min:** 0.01
- **Max:** 1,000,000
- **Format:** No currency symbols or commas allowed
- **Decimals:** Up to 2 decimal places

### Category Validation
- **Type:** String
- **Max Length:** 100 characters
- **Predefined Categories:** Food, Transport, Entertainment, Shopping, Healthcare, Education, Utilities, Housing, Salary, Investment, Other

### Description Validation
- **Type:** String (optional)
- **Max Length:** 500 characters

---

## Business Rules (Warnings)

The API applies business rules that generate warnings (not errors):

1. **Duplicate Transactions:** Same date, amount, and category
2. **Unusual Amounts:** Absolute value > $10,000
3. **Unknown Categories:** Categories not in predefined list
4. **Large Date Gaps:** > 90 days between consecutive transactions

Warnings don't prevent upload but are included in the response for review.

---

## Examples

### cURL Example

```bash
curl -X POST http://localhost:3001/upload \
  -F "file=@transactions.csv" \
  -H "Content-Type: multipart/form-data"
```

### JavaScript Example

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3001/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result);
```

### Python Example

```python
import requests

files = {'file': open('transactions.csv', 'rb')}
response = requests.post('http://localhost:3001/upload', files=files)
print(response.json())
```

---

## Rate Limits

Currently, no rate limiting is enforced. For production use, consider implementing rate limiting.

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "ISO 8601 timestamp",
    "details": {}  // Optional additional information
  }
}
```

Error codes are namespaced by category:
- `FILE_*`: File-related errors
- `CSV_*`: CSV parsing/structure errors
- `VALIDATION_*`: Data validation errors
- `DATABASE_*`: Database errors
- `INTERNAL_*`: Server errors

---

## Response Times

Typical processing times:
- Small files (< 100 rows): 50-150ms
- Medium files (100-1000 rows): 150-500ms
- Large files (1000-10000 rows): 500-2000ms

Processing time is included in the response as `processingTime` (milliseconds).

---

## Support

For issues or questions:
- Check the interactive documentation at `/docs`
- Review this API documentation
- Check server logs for detailed error information

---

## Version

Current Version: **1.0.0**

Last Updated: January 27, 2026
