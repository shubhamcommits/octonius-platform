# Octonius Platform

A modern, scalable platform built with Node.js, Express, and PostgreSQL.

## Features

- **Database Replication**: Read-write separation with PostgreSQL
  - Write operations directed to primary database
  - Read operations distributed to replica database
  - Automatic failover support
- **Redis Caching**: High-performance caching layer
  - Key-based caching
  - Prefix-based key management
  - Automatic cache invalidation
- **Docker Support**: Containerized deployment
  - Multi-container setup
  - PostgreSQL replication configuration
  - Redis caching service
- **Structured Logging**: Comprehensive logging system
  - Service-specific logging (Database, Redis, Application)
  - Color-coded log levels
  - Detailed metadata for debugging
- **Cluster Support**: Multi-process architecture
  - Automatic worker process management
  - Load balancing across CPU cores
  - Graceful worker recovery

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/en/download/) (Latest LTS version recommended)
- Package manager of your choice:
  - [npm](https://www.npmjs.com/) (comes with Node.js)
  - [Yarn](https://classic.yarnpkg.com/en/docs/install/)
- Docker and Docker Compose
- PostgreSQL (v15 or higher)
- Redis (v7 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Octonius/octonius-platform.git
   cd octonius-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment:
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Application Environment
   HOST=localhost
   APP_NAME='Octonius Platform'
   PORT=3000
   NODE_ENV=dev
   CLUSTER=false
   DOMAIN=dev.api.octonius.com

   # JWT Configuration
   JWT_ACCESS_KEY='your-secure-key-here'
   JWT_ACCESS_TIME=30d

   # Redis Credentials
   REDIS_HOST='127.0.0.1'
   REDIS_PORT=6379

   # Database (Writer)
   DB_WRITER_HOST=postgres-writer
   DB_PORT=5432
   DB_USER=postgres
   DB_PASS=your_password
   DB_NAME=octonius

   # Database (Reader)
   DB_READER_HOST=postgres-reader

   # Connection Pool
   MAX_POOL=20
   MIN_POOL=0
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn run dev
   ```
   The server will start on port 3000.

### Deploy Infrastructure

```bash
# Set required environment variables
export AWS_ACCOUNT_ID="your-account-id"
export DEV_S3_BUCKET="dev-octonius-platform-deployment-bucket-eu-central-1"

# Deploy to development
./scripts/deploy-infrastructure.sh --env dev

# Preview deployment without making changes
./scripts/deploy-infrastructure.sh --env dev --dry-run
```

### Query Deployment History

```bash
# Show latest deployment
./scripts/deployment-tracker.sh latest --env dev

# Show deployment history
./scripts/deployment-tracker.sh history --env dev --limit 5

# Check deployment status
./scripts/deployment-tracker.sh status --env dev
```

## 📋 Development Guidelines

### Branch Management

#### Branch Naming Convention
Branches should follow the pattern: `type_CapitalizedName`

**Types:**
- `bugfix`: For fixing bugs
- `feature`: For new features
- `release`: For release preparation
- `hotfix`: For critical production fixes

**Example:**
```bash
git checkout -b bugfix_EditPostContent
```

#### Daily Workflow

1. **Before Starting Work:**
   ```bash
   # Switch to your branch
   git checkout your-branch-name
   
   # Pull latest changes
   git pull
   ```

2. **After Completing Work:**
   ```bash
   # Push your changes
   git push
   ```

### Pull Request Process

1. **Update Development Branch:**
   ```bash
   git checkout development
   git pull
   ```

2. **Rebase Your Feature Branch:**
   ```bash
   git checkout your-feature-branch
   git rebase development
   ```

   > ⚠️ **Important:** 
   > - Notify team members before rebasing
   > - Resolve any conflicts in your branch
   > - Test thoroughly after resolving conflicts

3. **Create Pull Request:**
   - Open a PR from your branch to `development`
   - Notify team members about the PR
   - Wait for review and approval

4. **Clean Up:**
   ```bash
   # Delete local branch after PR is merged
   git branch -d your-branch-name
   ```

### Resuming Work on Old Branches

1. **Update Main Branch:**
   ```bash
   git checkout main
   git pull
   ```

2. **Update Feature Branch:**
   ```bash
   git checkout feature-branch
   git pull
   ```

3. **Rebase and Push:**
   ```bash
   git rebase main
   git push
   ```

   > ⚠️ **Important:** 
   > - Notify team members before rebasing
   > - Resolve any conflicts before continuing work

## 🤝 Contributing

1. Always branch from `development`, never from `main`
2. Follow the branch naming conventions
3. Keep your branches up to date
4. Test thoroughly before creating PRs
5. Communicate with the team about your changes

## 📝 License

This project is proprietary and confidential. All rights reserved.

## Docker Setup

The application can be run using Docker Compose:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The Docker setup includes:
- Application container
- PostgreSQL writer container
- PostgreSQL reader container
- Redis container

## Database Replication

The platform uses PostgreSQL replication for read-write separation:

- **Writer Node**: Handles all write operations
  - Located at `DB_WRITER_HOST`
  - Handles INSERT, UPDATE, DELETE operations
  - Primary database for data consistency

- **Reader Node**: Handles read operations
  - Located at `DB_READER_HOST`
  - Handles SELECT queries
  - Improves read performance

## Redis Caching

Redis is used for caching with the following features:

- **Key Management**:
  - Prefix-based key organization
  - Automatic key cleanup
  - Bulk key operations

- **Cache Operations**:
  - Set/Get operations
  - Key deletion by prefix
  - Key listing by prefix

## Logging

The application uses a structured logging system:

- **Database Logs**: `Database \t: [message]`
- **Redis Logs**: `Redis \t: [message]`
- **Application Logs**: `Application \t: [message]`

Log levels:
- INFO: General information
- ERROR: Error messages
- DEBUG: Debug information (development only)

## Development

1. Start the development environment:
   ```bash
   npm run dev
   ```

2. The application will automatically:
   - Connect to the database
   - Set up Redis caching
   - Start worker processes
   - Enable development logging

## Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Start in production mode:
   ```bash
   npm start
   ```

3. The application will:
   - Use production database settings
   - Enable caching
   - Start in cluster mode
   - Use production logging

## 📁 Architecture

### Deployment Scripts (New ✨)

We've refactored from complex YAML workflows to reusable, testable deployment scripts:

| Script | Purpose | Usage |
|--------|---------|-------|
| **`deploy-infrastructure.sh`** | Main deployment with bootstrap & tracking | `./scripts/deploy-infrastructure.sh --env dev` |
| **`deployment-tracker.sh`** | Query deployment history & status | `./scripts/deployment-tracker.sh latest --env dev` |
| **`cleanup-cdk-bootstrap.sh`** | Clean up failed CDK stacks | `./scripts/cleanup-cdk-bootstrap.sh --force` |

**Benefits:**
- ✅ **96% reduction** in YAML complexity (300 → 12 lines)
- ✅ **Local testing** and debugging capability
- ✅ **Reusable** across different CI/CD platforms
- ✅ **Enhanced error handling** with automatic recovery

### Infrastructure

| Component | Purpose | Location |
|-----------|---------|----------|
| **CDK Stacks** | Infrastructure as Code | `cdk/lib/` |
| **S3 Buckets** | Assets, backups, deployment tracking | Auto-created or custom |
| **CloudFront** | CDN for frontend and media | `cdk/lib/frontend-stack.ts` |
| **VPC** | Network isolation | `cdk/lib/vpc-stack.ts` |
| **ECS** | Container orchestration | `cdk/lib/ecs-stack.ts` |

## 📚 Documentation

> 📁 **All documentation is organized in the [`docs/`](docs/) folder** - [Browse documentation index](docs/README.md)

- **[Deployment Scripts Architecture](docs/DEPLOYMENT_SCRIPTS.md)** - New script-based deployment system
- **[CDK Error Handling](docs/CDK_ERROR_HANDLING.md)** - Robust bootstrap and error recovery  
- **[Deployment Tracking](docs/DEPLOYMENT_TRACKING.md)** - Complete deployment history and monitoring
- **[CDK Bootstrap Options](docs/CDK_BOOTSTRAP_OPTIONS.md)** - Custom bucket configurations
- **[Environment Variables](docs/ENV_VARIABLES.md)** - Required and optional configuration

## 🛠️ Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Build project
npm run build

# Deploy to dev environment with tracking
./scripts/deploy-infrastructure.sh --env dev --verbose

# Test deployment without changes
./scripts/deploy-infrastructure.sh --env dev --dry-run

# Check deployment status
./scripts/deployment-tracker.sh latest --env dev
```

### GitHub Actions

The deployment automatically runs via GitHub Actions using the simplified workflow:

```yaml
- name: Deploy Infrastructure
  run: |
    ./scripts/deploy-infrastructure.sh \
      --env ${{ inputs.environment }} \
      --region ${{ env.AWS_REGION }} \
      --verbose
```

## 🔧 Configuration

### Required Environment Variables

```bash
AWS_ACCOUNT_ID                    # Your AWS Account ID
AWS_CDK_POLICY_ARN_FROM_FILE     # Comma-separated policy ARNs
```

### Optional Environment Variables

```bash
AWS_REGION="eu-central-1"        # AWS Region
DEV_S3_BUCKET                    # Custom dev bucket name
PROD_S3_BUCKET                   # Custom prod bucket name
```

### GitHub Secrets

Set these in your repository secrets for automated deployments:

- `AWS_ACCOUNT_ID` - AWS Account ID
- `AWS_REGION` - Deployment region  
- `AWS_ROLE_NAME` - IAM role for GitHub Actions
- `DEV_S3_BUCKET` - Development assets bucket
- `PROD_S3_BUCKET` - Production assets bucket
- `DEV_CLOUDFRONT_ID` - Development CloudFront distribution
- `PROD_CLOUDFRONT_ID` - Production CloudFront distribution

## 🚨 Troubleshooting

### CDK Bootstrap Issues

If you encounter CDK bootstrap failures:

```bash
# Clean up failed stack automatically
./scripts/cleanup-cdk-bootstrap.sh

# Or force cleanup
./scripts/cleanup-cdk-bootstrap.sh --force

# Then deploy normally
./scripts/deploy-infrastructure.sh --env dev
```

### Common Issues

**AWS Credentials:**
```bash
aws configure
# or
export AWS_PROFILE=your-profile
```

**Missing Dependencies:**
```bash
npm install -g aws-cdk
pip install awscli
```

**Permission Errors:**
```bash
chmod +x scripts/*.sh
```

### Debug Mode

```bash
# Verbose logging
./scripts/deploy-infrastructure.sh --env dev --verbose

# Bash debug mode
bash -x ./scripts/deploy-infrastructure.sh --env dev --dry-run
```

## 📊 Deployment Tracking

Every deployment creates detailed tracking manifests with:

- **Deployment metadata** - Git commit, actor, timestamp
- **Infrastructure details** - AWS account, region, deployed stacks  
- **Performance metrics** - Deployment duration and status
- **History tracking** - Complete audit trail in S3

### Example Deployment Manifest

```json
{
  "deploymentId": "deploy-20231201-120000-abc123",
  "environment": "dev",
  "gitCommit": "abc123def456",
  "gitActor": "john.doe", 
  "status": "success",
  "deployedStacks": "dev-octonius-cdk-stack-eu-central-1",
  "duration": "330 seconds",
  "bootstrapBucket": "dev-octonius-platform-deployment-bucket-eu-central-1"
}
```

## 🌟 Features

- **🛡️ Fault-tolerant bootstrap** - Automatic recovery from failed CDK stacks
- **📊 Complete deployment tracking** - Full audit trail and history
- **🎯 Smart bucket management** - Custom or auto-generated S3 buckets
- **🔄 Multi-environment support** - Dev, staging, prod configurations
- **🚀 CI/CD ready** - Works with GitHub Actions, GitLab, Jenkins
- **🔍 Comprehensive logging** - Colored output with debug modes
- **⚡ Fast recovery** - Automatic cleanup and retry logic

## 🏗️ Project Structure

```
.
├── docs/                         # Documentation
│   ├── DEPLOYMENT_SCRIPTS.md     # Script-based deployment system
│   ├── CDK_ERROR_HANDLING.md     # Bootstrap error recovery
│   ├── DEPLOYMENT_TRACKING.md    # Deployment history & monitoring
│   ├── CDK_BOOTSTRAP_OPTIONS.md  # Custom bucket configurations
│   └── ENV_VARIABLES.md          # Environment variable reference
├── cdk/                          # CDK Infrastructure
│   ├── lib/                      # CDK Stack definitions
│   ├── bin/                      # CDK app entry point
│   └── *.json                    # IAM policies and configurations
├── scripts/                      # Deployment scripts
│   ├── deploy-infrastructure.sh  # Main deployment script
│   ├── deployment-tracker.sh     # Deployment history queries
│   └── cleanup-cdk-bootstrap.sh  # CDK cleanup utilities
├── .github/workflows/            # GitHub Actions
├── src/                          # Application source code
├── services/                     # Service layer
└── README.md                     # This file
```

---

## Getting Started

1. **Clone the repository**
2. **Set up AWS credentials** (`aws configure`)
3. **Install dependencies** (`npm install`)
4. **Deploy to dev** (`./scripts/deploy-infrastructure.sh --env dev`)
5. **Track deployment** (`./scripts/deployment-tracker.sh latest --env dev`)

For detailed documentation, see the linked guides above. For issues, check the troubleshooting section or create an issue.
