# Testing

## Types of Tests
- **Unit Tests**: Test individual functions/components
- **Integration Tests**: Test modules working together
- **End-to-End (E2E) Tests**: Test the full stack (API + UI)

## Running Tests
### Backend
```sh
cd src
npm run test
```

### Frontend
```sh
cd services/octonius-web
npm run test
```

## Coverage
- Coverage reports are generated in `/coverage` after running tests
- Aim for >80% coverage on new code

## Best Practices
- Write tests for all new features and bugfixes
- Use mocks/stubs for external dependencies
- Review test output in CI/CD 