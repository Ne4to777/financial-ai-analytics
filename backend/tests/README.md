# Tests

Test files for the CSV Processing API.

## Structure

Mirror the `src/` directory structure:
- `routes/` - Route handler tests
- `services/` - Service logic tests
- `validators/` - Schema validation tests
- `utils/` - Utility function tests

## Test Framework

Using **Vitest** for unit and integration tests.

## Guidelines

- Name test files: `*.test.ts`
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies
- Test happy paths and error cases

## Running Tests

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
npm run test:coverage # Coverage report
```
