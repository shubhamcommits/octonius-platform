# Development Workflow

## Branching Strategy
- `development`: Main integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Urgent production fixes
- `release/*`: Release preparation

## Commit Messages
- Use [Conventional Commits](https://www.conventionalcommits.org/)
- Example: `feat(auth): add OTP login flow`

## Pull Requests
- PRs must target `development`
- Reference related issues in the PR description
- Include screenshots or test evidence for UI changes
- Use clear, descriptive titles

## Linting & Formatting
- Run `npm run lint` and `npm run format` before pushing
- Pre-commit hooks run automatically (see `.pre-commit-config.yaml`)

## Code Review
- At least one approval required
- Address all review comments before merging

## Testing
- Add/maintain tests for new features
- See `/docs/testing.md` for details 