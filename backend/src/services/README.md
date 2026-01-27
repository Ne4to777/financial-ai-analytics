# Services

Business logic and external service integrations.

## Structure

Each service should:
- Contain pure business logic
- Be framework-agnostic
- Be easily testable
- Handle specific domain concerns

## Example Services

- `csvService.ts` - CSV parsing and validation
- `supabaseService.ts` - Database operations
- `uploadService.ts` - File handling
- `validationService.ts` - Business rule validation
