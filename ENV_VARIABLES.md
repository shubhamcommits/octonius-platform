# Environment Variables Documentation

This document lists all environment variables used in the Octonius Platform.

## CDK Deployment Variables

These variables are used when deploying infrastructure with AWS CDK:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AWS_ACCOUNT_ID` | AWS Account ID | - | Yes |
| `AWS_ACCOUNT_NUMBER` | Legacy alias for AWS_ACCOUNT_ID | - | No |
| `AWS_REGION` | AWS Region for deployment | `eu-central-1` | Yes |
| `NODE_ENV` | Environment name | `dev` | Yes |
| `APP_NAME` | Application name | `octonius` | Yes |
| `DOMAIN_NAME` | Domain name for the application | `octonius.example.com` | Yes |
| `OWNER` | Owner tag for resources | `Octonius Team` | No |

## GitHub Actions Secrets

These secrets are set by the `configure-aws-github-integration.yml` workflow:

| Secret | Description | Set By |
|--------|-------------|--------|
| `AWS_ACCOUNT_ID` | AWS Account ID | configure-aws-github-integration |
| `AWS_ROLE_NAME` | IAM Role for GitHub Actions | configure-aws-github-integration |
| `AWS_REGION` | AWS Region | configure-aws-github-integration |
| `REPO_NAME` | GitHub Repository name | configure-aws-github-integration |
| `DEV_S3_BUCKET` | Development S3 bucket name | configure-aws-github-integration |
| `PROD_S3_BUCKET` | Production S3 bucket name | configure-aws-github-integration |
| `DEV_CLOUDFRONT_ID` | Development CloudFront ID | configure-aws-github-integration |
| `PROD_CLOUDFRONT_ID` | Production CloudFront ID | configure-aws-github-integration |

## Application Runtime Variables

These variables are used by the application at runtime:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | Database host | `localhost` | Yes |
| `DB_PORT` | Database port | `5432` | Yes |
| `DB_NAME` | Database name | `octonius` | Yes |
| `DB_USER` | Database user | `postgres` | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `REDIS_HOST` | Redis host | `localhost` | Yes |
| `REDIS_PORT` | Redis port | `6379` | Yes |
| `REDIS_PASSWORD` | Redis password | - | No |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRATION` | JWT token expiration | `7d` | No |

## Setting Up Environment Variables

### For Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` with your specific configuration.

### For GitHub Actions

1. Run the `configure-aws-github-integration.yml` workflow to automatically set up AWS-related secrets.

2. Manually add any additional secrets through GitHub UI:
   - Go to Settings → Secrets and variables → Actions
   - Add the required secrets

### For CDK Deployment

CDK deployment uses environment variables from:
1. GitHub Actions secrets (when run in CI/CD)
2. Local `.env` file (when run locally with `NODE_ENV=local`)
3. Shell environment variables 