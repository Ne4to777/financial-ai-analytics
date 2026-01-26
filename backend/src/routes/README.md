# Routes

Fastify route handlers for API endpoints.

## Structure

Each route file should:
- Define route handlers
- Register routes with Fastify
- Use dependency injection pattern

## Example

```typescript
import { FastifyInstance } from 'fastify';

export default async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/api/upload', async (request, reply) => {
    // Handler logic
  });
}
```
