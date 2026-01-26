# Validators

Zod schemas for request/response validation.

## Structure

Each validator file should:
- Define Zod schemas
- Export typed validators
- Provide type inference

## Example

```typescript
import { z } from 'zod';

export const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number(),
  category: z.string(),
  description: z.string().optional(),
});

export type Transaction = z.infer<typeof transactionSchema>;
```
