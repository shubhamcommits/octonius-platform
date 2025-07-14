# Deployment & Environments

## Environments
- **Local**: For development and testing
- **Staging**: Pre-production, mirrors prod infra
- **Production**: Live environment

## Environment Variables
- All secrets/configs are managed via `.env` files (see `.env.example` in each service)
- Never commit real secrets to git

## Local Deployment
- Use Docker Compose for full stack: `docker-compose up`
- Or run backend/frontend separately as in Getting Started

## Staging/Production Deployment
- Use Terraform to provision AWS resources
- Deploy Docker images to ECR/App Runner
- Use CI/CD (GitHub Actions) for automated builds, tests, and deploys

## CI/CD Overview
- Lint, test, and build on every PR
- Deploy to staging on merge to `development`
- Deploy to production on merge to `main` (or via release branch)

## See Also
- `/docs/devops-guide.md`
- `/docs/terraform-guide.md` 