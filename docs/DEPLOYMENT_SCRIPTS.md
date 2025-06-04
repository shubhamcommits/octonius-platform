# Deployment Scripts Architecture

This document explains the refactored, script-based deployment architecture that replaces complex YAML logic with reusable, testable scripts.

## Architecture Overview

### Before: Complex YAML 📄
- 300+ lines of embedded bash in GitHub Actions YAML
- Hard to test, debug, and maintain
- Difficult to reuse outside GitHub Actions
- Complex error handling scattered throughout workflow

### After: Clean Scripts 🚀
- **96% reduction** in YAML complexity (300 → 12 lines of deployment logic)
- Reusable deployment script that works anywhere
- Easy to test locally and debug
- Clean separation of concerns

## File Structure

```
scripts/
├── deploy-infrastructure.sh      # Main deployment script (NEW)
├── deployment-tracker.sh         # Query deployment history
└── cleanup-cdk-bootstrap.sh      # Clean up failed CDK stacks

.github/workflows/
└── provision-aws-infrastructure.yml   # Simplified workflow (REFACTORED)
```

## Main Deployment Script

### Features

**🎯 Smart Bootstrap**
- Automatic detection and cleanup of failed CDK stacks
- Graceful fallback from custom bucket to CDK-generated bucket
- Enhanced error handling and recovery

**📊 Deployment Tracking**
- Creates detailed deployment manifests
- Tracks deployment history with full metadata
- Automatic status updates on success/failure

**🔧 Developer Experience**
- Comprehensive help documentation
- Dry-run mode for testing
- Verbose logging for debugging
- Works locally or in CI/CD

### Usage Examples

#### Local Development
```bash
# Set required environment variables
export AWS_ACCOUNT_ID="123456789012"
export DEV_S3_BUCKET="dev-octonius-platform-deployment-bucket-eu-central-1"
export AWS_CDK_POLICY_ARN_FROM_FILE="arn:aws:iam::123456789012:policy/dev-cdk-base-policy,..."

# Deploy to dev environment
./scripts/deploy-infrastructure.sh --env dev --verbose

# Test deployment without making changes
./scripts/deploy-infrastructure.sh --env dev --dry-run

# Skip bootstrap (if already done)
./scripts/deploy-infrastructure.sh --env dev --skip-bootstrap

# Deploy to different region
./scripts/deploy-infrastructure.sh --env prod --region us-east-1
```

#### GitHub Actions (Automatic)
```yaml
- name: Deploy Infrastructure
  run: |
    ./scripts/deploy-infrastructure.sh \
      --env ${{ inputs.environment }} \
      --region ${{ env.AWS_REGION }} \
      --verbose
```

#### Other CI/CD Systems
```bash
# GitLab CI, Jenkins, Azure DevOps, etc.
./scripts/deploy-infrastructure.sh --env ${CI_ENVIRONMENT} --verbose
```

## Benefits

### 🛠️ **Maintainability**
- **Single source of truth** for deployment logic
- **Easy debugging** with standard bash tools
- **Version control** of deployment logic changes
- **Clear error messages** with colored output

### 🧪 **Testability**
- **Local testing** without GitHub Actions
- **Dry-run mode** to preview changes
- **Unit testable** functions
- **Isolated error scenarios** for testing

### 🔄 **Reusability**
- **Works anywhere** - local, CI/CD, containers
- **Environment agnostic** - dev, staging, prod
- **CI/CD platform agnostic** - GitHub, GitLab, Jenkins
- **Docker compatible** for containerized deployments

### 📈 **Scalability**
- **Modular functions** for complex workflows
- **Easy to extend** with new features
- **Plugin architecture** for custom logic
- **Multi-region deployments** supported

## Script Functions

### Core Functions

| Function | Purpose | Error Handling |
|----------|---------|----------------|
| `bootstrap_cdk()` | CDK bootstrap with fallbacks | Auto-cleanup, graceful degradation |
| `cleanup_failed_stack()` | Remove failed CDK stacks | Safe deletion with confirmation |
| `create_deployment_manifest()` | Track deployment metadata | Graceful failure if bucket unavailable |
| `deploy_cdk()` | Execute CDK deployment | Proper exit codes and status tracking |
| `update_deployment_status()` | Final status and metrics | Always runs via trap |

### Utility Functions

| Function | Purpose |
|----------|---------|
| `determine_bootstrap_bucket()` | Smart bucket selection |
| `log_info()`, `log_error()`, etc. | Colored, structured logging |
| `show_help()` | Comprehensive usage documentation |

## Error Handling

### Automatic Recovery
- **Failed CDK stacks**: Automatically detected and cleaned up
- **Bucket conflicts**: Falls back to CDK-generated buckets
- **Tag validation**: Uses ECR-compatible tag formats
- **Network issues**: Retries with exponential backoff

### Clear Error Messages
```bash
[ERROR] AWS credentials not configured or invalid
[ERROR] CDK CLI not found. Please install AWS CDK
[ERROR] AWS_ACCOUNT_ID environment variable is required
[WARNING] Bootstrap with existing bucket failed, will try fallback approach
```

## Environment Variables

### Required
```bash
AWS_ACCOUNT_ID          # AWS Account ID
AWS_CDK_POLICY_ARN_FROM_FILE  # Comma-separated policy ARNs
```

### Optional
```bash
AWS_REGION              # AWS Region (default: eu-central-1)
NODE_ENV                # Environment override
DEV_S3_BUCKET           # Development bucket name
PROD_S3_BUCKET          # Production bucket name
GITHUB_SHA              # Git commit (auto-set in GitHub Actions)
GITHUB_REF              # Git reference
GITHUB_ACTOR            # Git actor
```

## Migration Guide

### From Old YAML Approach

**✅ What Changed**
- GitHub workflow is now **12 lines** instead of 200+
- All deployment logic moved to `scripts/deploy-infrastructure.sh`
- Same functionality, better organization

**✅ What Stayed the Same**
- All existing deployment tracking features
- Same environment variables and secrets
- Same CDK bootstrap behavior
- Same error handling capabilities

**✅ What's Better**
- Can test deployments locally
- Easier to debug issues
- Reusable across different CI/CD systems
- Cleaner git diffs for deployment changes

### Testing Migration

1. **Test locally first:**
   ```bash
   ./scripts/deploy-infrastructure.sh --env dev --dry-run
   ```

2. **Run in GitHub Actions:**
   - Use the simplified workflow
   - Same secrets and environment variables

3. **Verify deployment tracking:**
   ```bash
   ./scripts/deployment-tracker.sh latest --env dev
   ```

## Advanced Usage

### Custom Deployment Pipelines

```bash
#!/bin/bash
# Custom deployment pipeline

# Pre-deployment checks
./scripts/deploy-infrastructure.sh --env staging --dry-run

# Deploy to staging
./scripts/deploy-infrastructure.sh --env staging --verbose

# Run integration tests
npm run test:integration

# Deploy to production
./scripts/deploy-infrastructure.sh --env prod --verbose

# Post-deployment verification
./scripts/deployment-tracker.sh latest --env prod
```

### Docker Integration

```dockerfile
FROM node:20-alpine

RUN apk add --no-cache aws-cli bash jq

COPY scripts/ /app/scripts/
COPY package*.json /app/
WORKDIR /app

RUN npm install && npm install -g aws-cdk

ENTRYPOINT ["./scripts/deploy-infrastructure.sh"]
```

```bash
# Build and run in container
docker build -t octonius-deploy .
docker run -e AWS_ACCOUNT_ID=123456 octonius-deploy --env dev --dry-run
```

### Integration with Other Tools

```bash
# Terraform integration
./scripts/deploy-infrastructure.sh --env dev
terraform apply -var "cdk_bucket=${BOOTSTRAP_BUCKET}"

# Ansible integration
ansible-playbook deploy.yml -e "deployment_id=${DEPLOYMENT_ID}"

# Monitoring integration
curl -X POST "https://monitoring.example.com/deployments" \
  -H "Content-Type: application/json" \
  -d "$(./scripts/deployment-tracker.sh latest --env prod --json)"
```

## Troubleshooting

### Common Issues

**Script permissions:**
```bash
chmod +x scripts/deploy-infrastructure.sh
```

**Missing dependencies:**
```bash
# Install required tools
npm install -g aws-cdk
pip install awscli
```

**Environment variables:**
```bash
# Check required variables
./scripts/deploy-infrastructure.sh --env dev 2>&1 | grep "required"
```

### Debug Mode

```bash
# Enable verbose logging
./scripts/deploy-infrastructure.sh --env dev --verbose

# Bash debug mode
bash -x ./scripts/deploy-infrastructure.sh --env dev --dry-run
```

This script-based architecture provides a much more maintainable, testable, and reusable deployment system while maintaining all the robust error handling and tracking features of the original implementation. 