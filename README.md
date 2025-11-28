<div align="center">

# 🐙 Octonius Platform

### A Modern, Enterprise-Grade Web Application Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?logo=terraform&logoColor=white)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**[🌐 Live Demo](https://app.octonius.com)** • **[📖 Documentation](docs/)** • **[🚀 Quick Start](#-quick-start)**

---

*Built with modern best practices: Infrastructure as Code, CI/CD automation, microservices architecture, and comprehensive security scanning.*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Technology Stack](#-technology-stack)
- [AWS Infrastructure](#-aws-infrastructure)
- [DevOps & Tooling](#-devops--tooling)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [Infrastructure Management](#-infrastructure-management)
- [Environment Configuration](#-environment-configuration)
- [Deployment](#-deployment)
- [Features](#-features)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Octonius Platform** is a modern, scalable web application platform designed for enterprise-grade deployments. It combines a robust Node.js/TypeScript backend with a sleek Angular frontend, all orchestrated through comprehensive Terraform infrastructure on AWS.

### Key Highlights

- 🏗️ **100% Pipeline-Native Infrastructure** - Everything computed in CI/CD using standard tools
- 🌍 **Branch-Based Environment Mapping** - Automatic environment detection from branch names
- 🔐 **Enterprise Security** - Comprehensive scanning, secret detection, and access control
- 📊 **Cost Transparency** - Built-in infrastructure cost estimation with Infracost
- 🚀 **Zero-Downtime Deployments** - Automated blue-green deployments via AWS App Runner

---

## 🛠 Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 22.x | JavaScript runtime environment |
| **TypeScript** | 5.x | Static type checking and modern JavaScript features |
| **Express.js** | 4.x | Fast, minimalist web framework |
| **Sequelize** | 6.x | Promise-based ORM for PostgreSQL |
| **PostgreSQL** | 16 | Primary relational database |
| **Redis** | 7.0 | In-memory caching and session storage |

### Backend Dependencies

```json
{
  "Core Framework": {
    "express": "REST API framework",
    "ts-node": "TypeScript execution",
    "ts-node-dev": "Development with hot reload"
  },
  "Database & ORM": {
    "pg": "PostgreSQL client",
    "pg-hstore": "PostgreSQL HStore support",
    "sequelize": "ORM for database operations"
  },
  "Authentication & Security": {
    "jsonwebtoken": "JWT token generation and validation",
    "bcrypt": "Password hashing (Blowfish)",
    "bcryptjs": "Pure JavaScript bcrypt implementation"
  },
  "AWS SDK": {
    "@aws-sdk/client-ec2": "EC2 instance management",
    "@aws-sdk/client-s3": "S3 file storage operations",
    "@aws-sdk/client-secrets-manager": "Secrets management",
    "@aws-sdk/s3-request-presigner": "Presigned URL generation"
  },
  "Email Services": {
    "resend": "Transactional email delivery",
    "react-email": "React-based email templates",
    "@react-email/components": "Email component library",
    "@react-email/tailwind": "Tailwind CSS for emails"
  },
  "Utilities": {
    "axios": "HTTP client for external APIs",
    "compression": "Response compression middleware",
    "cors": "Cross-Origin Resource Sharing",
    "dotenv": "Environment variable management",
    "morgan": "HTTP request logging",
    "multer": "File upload handling",
    "uuid": "UUID generation",
    "winston": "Application logging",
    "zod": "Schema validation",
    "opossum": "Circuit breaker pattern"
  }
}
```

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Angular** | 19.x | Component-based frontend framework |
| **TypeScript** | 5.7 | Static typing for JavaScript |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework |
| **DaisyUI** | 4.x | Component library for Tailwind |
| **TipTap** | 2.x | Rich text editor framework |

### Frontend Dependencies

```json
{
  "Angular Ecosystem": {
    "@angular/core": "Core Angular framework",
    "@angular/animations": "Animation support",
    "@angular/router": "Client-side routing",
    "@angular/forms": "Template and reactive forms",
    "@angular/platform-browser": "Browser platform support"
  },
  "Rich Text Editor (TipTap)": {
    "@tiptap/core": "Core editor engine",
    "@tiptap/starter-kit": "Essential extensions bundle",
    "@tiptap/extension-bubble-menu": "Contextual formatting menu",
    "@tiptap/extension-character-count": "Character counting",
    "@tiptap/extension-highlight": "Text highlighting",
    "@tiptap/extension-image": "Image embedding",
    "@tiptap/extension-link": "Hyperlink support",
    "@tiptap/extension-mention": "User mentions",
    "@tiptap/extension-placeholder": "Placeholder text",
    "@tiptap/extension-table": "Table support",
    "@tiptap/extension-task-item": "Task lists",
    "@tiptap/extension-text-align": "Text alignment",
    "@tiptap/extension-underline": "Underline formatting"
  },
  "UI & Styling": {
    "tailwindcss": "Utility-first CSS",
    "daisyui": "Tailwind component library",
    "postcss": "CSS processing",
    "autoprefixer": "CSS vendor prefixing",
    "lucide-angular": "Icon library"
  },
  "Maps & Geolocation": {
    "leaflet": "Interactive maps",
    "@types/leaflet": "TypeScript definitions"
  },
  "Reactive Programming": {
    "rxjs": "Reactive Extensions for JavaScript",
    "zone.js": "Angular change detection"
  },
  "Testing": {
    "karma": "Test runner",
    "jasmine-core": "Testing framework",
    "karma-chrome-launcher": "Chrome browser launcher",
    "karma-coverage": "Code coverage reports"
  }
}
```

---

## ☁️ AWS Infrastructure

### Terraform Modules

The platform uses modular Terraform configurations for infrastructure management:

```
terraform/
├── modules/
│   ├── app_runner/          # AWS App Runner service configuration
│   ├── bastion/             # Bastion host for secure SSH access
│   ├── ecr/                 # Elastic Container Registry
│   ├── elasticache/         # ElastiCache Redis cluster
│   ├── lambda-auto-discovery/ # Lambda function auto-discovery
│   ├── rds/                 # RDS PostgreSQL database
│   ├── vpc/                 # Virtual Private Cloud networking
│   └── web/                 # Static web hosting (S3 + CloudFront)
├── locals.tf                # Local variable definitions
├── main.tf                  # Main Terraform configuration
├── outputs.tf               # Output definitions
├── variables.tf             # Variable declarations
└── versions.tf              # Provider version constraints
```

### AWS Services Used

| Service | Purpose | Terraform Module |
|---------|---------|------------------|
| **VPC** | Isolated network with public/private subnets | `vpc` |
| **App Runner** | Containerized application deployment | `app_runner` |
| **ECR** | Docker image registry | `ecr` |
| **RDS** | PostgreSQL database hosting | `rds` |
| **ElastiCache** | Redis caching layer | `elasticache` |
| **S3** | Static file storage, Terraform state | `web` |
| **CloudFront** | CDN for static assets | `web` |
| **NAT Gateway** | Private subnet internet access | `vpc` |
| **DynamoDB** | Terraform state locking | Auto-created |
| **Secrets Manager** | Secure credential storage | Backend config |
| **CloudWatch** | Logging and monitoring | Integrated |
| **Lambda** | Serverless functions | `lambda-auto-discovery` |
| **EC2** | Bastion host for SSH access | `bastion` |
| **IAM** | Identity and access management | All modules |

### Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS VPC                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Public Subnets                        │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │   NAT GW     │  │   ALB/CDN    │  │   Bastion    │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                               │                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Private Subnets                        │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │  App Runner  │  │     RDS      │  │ ElastiCache  │   │    │
│  │  │   (API)      │  │  PostgreSQL  │  │    Redis     │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Environment-Specific Infrastructure

| Environment | VPC CIDR | NAT Gateway | Cost Profile |
|-------------|----------|-------------|--------------|
| **Production** (`prod`) | `10.0.0.0/16` | Multiple (HA) | High (optimized for availability) |
| **Development** (`dev`) | `10.1.0.0/16` | Single | Medium (balanced) |
| **Feature** (`feature-*`) | `10.{hash}.0.0/16` | Single | Low (minimal) |
| **Hotfix** (`hotfix-*`) | Dynamic | Single | Low (isolated) |

---

## 🔧 DevOps & Tooling

### CI/CD Pipeline (GitHub Actions)

```yaml
# Workflow: platform-deploy.yml
Triggers:
  - Push to master → Auto-deploy to production
  - Push to development → Plan for dev environment
  - Push to feature/* → Plan for feature environment
  - Manual dispatch → Choose environment and action

Features:
  - Automatic S3/DynamoDB bootstrap
  - Environment detection from branch names
  - Terraform plan/apply automation
  - Docker image building and pushing to ECR
```

### Pre-commit Hooks

The platform uses comprehensive pre-commit hooks for code quality:

| Hook | Purpose |
|------|---------|
| **terraform_fmt** | Terraform code formatting |
| **terraform_validate** | Terraform configuration validation |
| **terraform_docs** | Auto-generate Terraform documentation |
| **terraform_tflint** | Terraform linting rules |
| **checkov** | Security and compliance scanning |
| **trailing-whitespace** | Remove trailing whitespace |
| **end-of-file-fixer** | Ensure files end with newline |
| **check-yaml** | YAML syntax validation |
| **check-json** | JSON syntax validation |
| **check-merge-conflict** | Detect merge conflict markers |
| **detect-private-key** | Prevent committing private keys |
| **shellcheck** | Shell script linting |
| **markdownlint** | Markdown file linting |
| **prettier** | YAML/JSON formatting |
| **detect-secrets** | Secret detection in code |

### Infrastructure Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Terraform** | Latest | Infrastructure as Code |
| **TFLint** | Configured | Terraform linting |
| **Infracost** | Latest | Cost estimation |
| **Checkov** | 2.4.9 | Security scanning |
| **Docker** | Latest | Containerization |
| **Docker Compose** | 3.8 | Local development orchestration |

### Infracost Configuration

```yaml
# Cost monitoring and alerts
Cost Thresholds:
  percentage_threshold: 20%  # Alert if cost increases by >20%
  absolute_threshold: $100   # Alert if cost increases by >$100/month

Usage Estimates:
  - NAT Gateway: 100GB/month
  - Load Balancer: 100GB/month
  - RDS Backup: 100GB
  - S3 Standard: 50GB
  - CloudWatch Logs: 10GB ingested, 10GB stored
  - VPC Flow Logs: 5GB/month
```

---

## 📁 Project Structure

```
octonius-platform/
├── .github/
│   └── workflows/
│       └── platform-deploy.yml    # CI/CD workflow
├── docs/                          # Documentation files
├── services/
│   ├── octonius-web/              # Angular frontend application
│   │   ├── public/                # Static assets
│   │   ├── src/                   # Source code
│   │   │   ├── app/               # Angular components
│   │   │   ├── assets/            # Images, fonts, etc.
│   │   │   └── environments/      # Environment configs
│   │   ├── angular.json           # Angular CLI configuration
│   │   ├── tailwind.config.js     # Tailwind CSS configuration
│   │   └── package.json           # Frontend dependencies
│   └── resource-manager-service/  # Resource management microservice
├── src/                           # Backend source code
│   ├── controllers/               # Request handlers
│   ├── models/                    # Database models
│   ├── routes/                    # API route definitions
│   ├── services/                  # Business logic
│   ├── middlewares/               # Express middlewares
│   └── utils/                     # Utility functions
├── terraform/
│   ├── modules/                   # Reusable Terraform modules
│   │   ├── app_runner/
│   │   ├── bastion/
│   │   ├── ecr/
│   │   ├── elasticache/
│   │   ├── lambda-auto-discovery/
│   │   ├── rds/
│   │   ├── vpc/
│   │   └── web/
│   ├── locals.tf
│   ├── main.tf
│   ├── outputs.tf
│   ├── variables.tf
│   └── versions.tf
├── .dockerignore                  # Docker ignore patterns
├── .gitignore                     # Git ignore patterns
├── .infracost.yml                 # Infracost configuration
├── .pre-commit-config.yaml        # Pre-commit hooks configuration
├── .tflint.hcl                    # TFLint rules
├── docker-compose.yml             # Docker Compose configuration
├── docker-entrypoint.sh           # Container entrypoint script
├── Dockerfile                     # Multi-stage Docker build
├── Octonius-Platform-API.postman_collection.json
├── package.json                   # Backend dependencies
├── server.ts                      # Application entry point
└── tsconfig.json                  # TypeScript configuration
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 22.0.0
- **npm** >= 8.0.0
- **Docker** & **Docker Compose**
- **Terraform** (for infrastructure)
- **AWS CLI** (configured with credentials)

### Local Development with Docker

```bash
# Clone the repository
git clone https://github.com/shubhamcommits/octonius-platform.git
cd octonius-platform

# Copy environment template
cp .env.example .env

# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Manual Setup

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd services/octonius-web
npm install
cd ../..

# Start development server
npm run dev

# In another terminal, start frontend
cd services/octonius-web
npm start
```

---

## 💻 Development

### Available Scripts

#### Backend

```bash
# Development
npm run dev          # Start with hot reload (NODE_ENV=dev)
npm run local        # Start local environment
npm run prod         # Start production mode

# Build
npm run build        # Compile TypeScript to JavaScript
npm run lint         # Type checking with TypeScript

# Testing
npm test             # Run Jest tests
npm run test:watch   # Watch mode for tests

# Production
npm run start:dev    # Run compiled code (dev)
npm run start:prod   # Run compiled code (prod)
npm run staging      # Run staging environment
```

#### Frontend (services/octonius-web)

```bash
npm start            # Start Angular dev server
npm run build        # Production build
npm run watch        # Build with watch mode
npm test             # Run Karma tests
ng generate          # Generate components/services
```

### Environment Variables

```env
# Application
HOST=localhost
APP_NAME=Octonius Platform
PORT=3000
NODE_ENV=development
CLUSTER=false
DOMAIN=dev.api.octonius.com

# JWT Configuration
JWT_ACCESS_TIME=30d

# Database (PostgreSQL)
DB_WRITER_HOST=localhost
DB_READER_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=password
DB_NAME=octonius

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS (for production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=

# Email (Resend)
RESEND_API_KEY=
```

---

## 🏗 Infrastructure Management

### Initial Setup

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Create workspace (if needed)
terraform workspace new dev

# Plan infrastructure changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan
```

### Environment Management

```bash
# Switch environments
terraform workspace select dev
terraform workspace select prod

# Destroy environment (be careful!)
terraform destroy
```

### Infracost Analysis

```bash
# Install Infracost
brew install infracost

# Generate cost breakdown
infracost breakdown --path terraform/

# Compare costs between branches
infracost diff --path terraform/ --compare-to master
```

---

## 🌍 Environment Configuration

### Branch-Based Environment Mapping

| Branch Pattern | Environment | Use Case |
|----------------|-------------|----------|
| `master` | `prod` | Production deployment |
| `development` | `dev` | Development testing |
| `feature/*` | `feature-{name}` | Feature development |
| `hotfix/*` | `hotfix-{name}` | Critical fixes |
| Other | `{branch-name}` | Custom environments |

### Auto-Created Resources

When deploying to any environment, the pipeline automatically creates:

- **S3 Bucket** - Terraform state storage
- **DynamoDB Table** - State locking (`{env}-octonius-terraform-locks-{region}`)
- **VPC & Networking** - Environment-specific CIDR ranges
- **Security Groups** - Properly configured firewall rules
- **Tagging** - Comprehensive resource tagging

---

## 🚢 Deployment

### Automated Deployment (Recommended)

```bash
# Production deployment
git checkout master
git push origin master  # Auto-deploys to prod

# Development deployment
git checkout development
git push origin development  # Plans for dev

# Feature deployment
git checkout -b feature/my-feature
git push origin feature/my-feature  # Plans for feature environment
```

### Manual Deployment

```bash
# Build Docker image
docker build -t octonius-platform .

# Tag for ECR
docker tag octonius-platform:latest ${AWS_ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/octonius-platform:latest

# Push to ECR
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com
docker push ${AWS_ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/octonius-platform:latest

# Deploy via Terraform
cd terraform
terraform apply
```

---

## ✨ Features

### User Management
- ✅ OTP-based authentication
- ✅ User profiles with metadata
- ✅ Password hashing with bcrypt
- ✅ JWT token management
- ✅ Session handling with Redis

### Workplace Management
- ✅ Multi-tenant workplaces
- ✅ Branding and customization
- ✅ Member management
- ✅ Role-based access control

### Task Management
- ✅ Kanban boards
- ✅ Task assignments
- ✅ Priority and status tracking
- ✅ Task comments and discussions
- ✅ Due date management

### File Management
- ✅ S3 integration with presigned URLs
- ✅ File metadata tracking
- ✅ Folder organization
- ✅ Drag-and-drop uploads
- ✅ File type icons

### Rich Text Editing
- ✅ TipTap editor integration
- ✅ Tables, lists, and formatting
- ✅ Image embedding
- ✅ User mentions
- ✅ Task lists

### Notification System
- ✅ Email notifications via Resend
- ✅ In-app notifications
- ✅ OTP delivery
- ✅ System announcements

---

## 📖 API Documentation

API documentation is available via Postman:

- **Collection File**: `Octonius-Platform-API.postman_collection.json`

### Authentication

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

---

## 🔐 Security

### Infrastructure Security
- VPC with private subnets
- NAT Gateway for outbound traffic
- Security groups for network isolation
- Encrypted S3 state backend
- DynamoDB state locking
- IAM policies with least privilege

### Application Security
- JWT authentication
- bcrypt password hashing
- CORS configuration
- Helmet security headers
- Rate limiting (planned)
- Input validation with Zod

### DevSecOps
- Checkov security scanning
- Secret detection in pre-commit
- Dependency vulnerability scanning
- Private key detection
- Terraform security rules

---

## 🗺 Roadmap

### Phase 1: Foundation ✅
- [x] Clean Terraform infrastructure
- [x] VPC with public/private subnets
- [x] GitHub Actions CI/CD
- [x] Docker containerization
- [x] 100% Pipeline-native infrastructure

### Phase 2: Core Application ✅
- [x] Authentication system
- [x] User management
- [x] Workplace management
- [x] Task management
- [x] File management with S3
- [x] Angular frontend

### Phase 3: Advanced Features ✅
- [x] My Space module
- [x] Workplace apps
- [x] Kanban boards
- [x] Activity feeds
- [x] Rich text editor

### Phase 4: Infrastructure (In Progress)
- [ ] RDS PostgreSQL optimization
- [ ] ElastiCache Redis setup
- [ ] Application Load Balancer
- [ ] ECS container deployment
- [ ] Database migrations

### Phase 5: Enhanced Infrastructure
- [ ] CloudFront CDN
- [ ] Route53 DNS
- [ ] SSL/TLS certificates
- [ ] Auto-scaling
- [ ] Multi-region deployment

### Phase 6: Observability
- [ ] CloudWatch monitoring
- [ ] ELK logging stack
- [ ] Health checks & alerts
- [ ] APM integration

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Install** pre-commit hooks (`pre-commit install`)
4. **Test** your changes thoroughly
5. **Commit** your changes (`git commit -m 'Add amazing feature'`)
6. **Push** to the branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Pre-commit Setup

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run all hooks manually
pre-commit run --all-files
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community support
- **Documentation**: See `docs/` directory

---

<div align="center">

### 🎉 Successfully Migrated from AWS CDK to Terraform!

*No more CDK bootstrap failures. Clean, readable infrastructure code. Consistent naming conventions.*

**🚀 Ready to scale!**

---

Made with ❤️ by [Shubham Singh](https://github.com/shubhamcommits)

</div>

