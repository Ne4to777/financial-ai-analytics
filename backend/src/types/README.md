# Types

TypeScript type definitions and interfaces.

## Files

- `upload.types.ts` - Upload API types (file, CSV, validation, responses)
- `index.ts` - Central export point for all types

## Key Types

### File & Upload
- `FileMetadata` - Uploaded file information
- `StoredFileInfo` - File storage details
- `UploadResponse` - API response (success or error)

### CSV & Data
- `Transaction` - Financial transaction from CSV
- `CSVRow` - Generic CSV row data
- `ParsedCSVMetadata` - CSV parsing metadata

### Validation
- `ValidationError` - Field/row validation error
- `UploadValidationResult` - Validation result with errors/warnings

### Error Handling
- `APIErrorCode` - Enum of all error codes
- `HTTPStatusCode` - HTTP status codes

## Constants

- `REQUIRED_COLUMNS` - ['date', 'amount', 'category']
- `OPTIONAL_COLUMNS` - ['description']
- `ALL_COLUMNS` - All valid column names

## Type Guards

- `isUploadSuccess(response)` - Check if response is success
- `isUploadError(response)` - Check if response is error

## Usage

```typescript
import { UploadResponse, APIErrorCode, Transaction } from '../types';

// Type-safe response
const response: UploadResponse = {
  success: true,
  message: 'File uploaded successfully',
  data: { ... }
};

// Type guard
if (isUploadSuccess(response)) {
  console.log(response.data.uploadId);
}
```

## Guidelines

- Use interfaces for object shapes
- Use types for unions and complex types
- Use enums for fixed sets of values
- Export all types from index.ts
- Document complex types with JSDoc
- Use type guards for discriminated unions
