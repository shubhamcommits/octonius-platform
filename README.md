[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v3/monitor/1za90.svg)](https://uptime.betterstack.com/?utm_source=status_badge)

# 🚀 Octonius Platform

A modern, scalable web application platform built with **Node.js/TypeScript**, **Angular**, and **Terraform** infrastructure on AWS.

## 🎯 Overview

The Octonius Platform provides a robust foundation for web applications with:
- **Frontend**: Modern Angular application with Tailwind CSS and DaisyUI
- **Backend**: Node.js/TypeScript server with Express, PostgreSQL, and Redis
- **Infrastructure**: Clean, modular Terraform setup for AWS resources
- **CI/CD**: Automated GitHub Actions workflows for deployment
- **Monitoring**: Comprehensive logging and monitoring setup

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Octonius Platform                        │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Layer (Angular)                                       │
│  ├── Authentication Module                                      │
│  │   ├── Workplace Selection                                    │
│  │   ├── OTP Verification                                       │
│  │   └── Workplace Login                                        │
│  ├── My Space Module                                           │
│  │   ├── Inbox                                                 │
│  │   ├── Workload                                              │
│  │   └── Files                                                 │
│  └── Shared Components & Services                               │
├─────────────────────────────────────────────────────────────────┤
│  Backend Layer                                                  │
│  ├── Node.js/TypeScript Server (Express)                       │
│  ├── PostgreSQL Database                                        │
│  ├── Redis Cache                                               │
│  └── Winston Logging                                           │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure Layer (Terraform)                              │
│  ├── VPC with Public/Private Subnets                          │
│  ├── NAT Gateways & Internet Gateway                           │
│  ├── Security Groups & NACLs                                   │
│  └── Future: ECS, RDS, ALB, CloudFront                        │
├─────────────────────────────────────────────────────────────────┤
│  CI/CD Pipeline (GitHub Actions)                               │
│  ├── Terraform Plan & Apply                                    │
│  ├── Application Build & Test                                  │
│  └── Deployment Automation                                     │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Frontend Setup (Angular)

```bash
# 1. Navigate to web application
cd services/octonius-web

# 2. Install dependencies
npm install

# 3. Start development server
npm run start

# 4. Build for production
npm run build
```

### Backend Setup

```bash
# 1. Install dependencies
npm install

# 2. Build application
npm run build

# 3. Start development server
npm run dev

# 4. Start production server
npm run start
```

### Infrastructure Setup (Terraform)

**📖 See [README-terraform.md](README-terraform.md) for complete infrastructure documentation**

```bash
# 1. Bootstrap Terraform state management
./scripts/terraform-bootstrap.sh -e dev

# 2. Deploy infrastructure
cd terraform/environments/dev
terraform init
terraform plan
terraform apply
```

## 📁 Project Structure

```
octonius-platform/
├── 📱 Frontend (Angular)
│   ├── services/octonius-web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── modules/
│   │   │   │   │   ├── auth/           # Authentication components
│   │   │   │   │   ├── my-space/       # My Space components
│   │   │   │   │   └── shared/         # Shared components & services
│   │   │   │   ├── app.config.ts
│   │   │   │   └── app.routes.ts
│   │   │   └── environments/           # Environment configurations
│   │   ├── package.json
│   │   └── angular.json
│   │
├── 📱 Backend
│   ├── src/
│   │   ├── auths/                     # Authentication logic
│   │   ├── users/                     # User management
│   │   ├── workplaces/               # Workplace management
│   │   ├── notifications/            # Email & notification system
│   │   └── shared/                   # Shared utilities
│   ├── server.ts                     # Main application server
│   └── package.json                  # Node.js dependencies
│
├── 🏗️ Infrastructure (Terraform)
│   ├── terraform/
│   │   ├── main.tf                   # Main Terraform configuration
│   │   ├── variables.tf              # Variable definitions
│   │   ├── outputs.tf                # Output definitions
│   │   ├── modules/vpc/              # VPC networking module
│   │   └── config/                   # Environment-specific configs
│   └── scripts/
│       └── terraform-bootstrap.sh     # State management setup
│
└── 📚 Documentation
    ├── README.md                     # This file (overview)
    └── README-terraform.md           # Infrastructure documentation
```

## 🔐 Authentication System

The platform implements a secure authentication system with:

- **Workplace Selection**: Users can select or create their workspace
- **OTP Verification**: Secure one-time password verification
- **Email Notifications**: Automated email delivery for OTP
- **Session Management**: Secure session handling with Redis
- **Role-Based Access**: Granular permission control

## 🎨 Frontend Features

### Authentication Module
- Workplace selection and creation
- OTP-based verification
- Secure login process
- Email notifications

### My Space Module
- Inbox for notifications and updates
- Workload management
- File management system
- Note editor
- Navigation bar with theme switching

### Shared Components
- Theme switching (Light/Dark)
- Responsive layout
- Modern UI with Tailwind CSS and DaisyUI
- Reusable services for auth, users, and workplaces

## 🛠️ Development

### Local Development

   ```bash
# Start with Docker Compose (recommended)
docker-compose up -d

# Or run directly
   npm run dev
```

### Application Scripts

```bash
npm run dev         # Development server with hot reload
npm run build       # Build TypeScript to JavaScript
npm run start       # Production server
npm run test        # Run tests
npm run lint        # TypeScript type checking
```

### Infrastructure Management

   ```bash
# Environment setup
./scripts/terraform-bootstrap.sh -e dev

# Terraform operations
cd terraform/environments/dev
terraform plan      # Preview changes
terraform apply     # Apply changes
terraform destroy   # Destroy infrastructure
```

## 🌍 Environment Configuration

### Development (dev)
- **Purpose**: Development and testing
- **VPC**: `10.0.0.0/16`
- **Cost Optimized**: Single NAT Gateway
- **Auto-Deploy**: On feature branch pushes

### Production (prod)  
- **Purpose**: Live production workloads
- **VPC**: `10.1.0.0/16`
- **High Availability**: Multiple NAT Gateways
- **Auto-Deploy**: On main branch pushes

## 🚀 Deployment

### Automated (GitHub Actions)

**Terraform Infrastructure:**
1. Push to `main` → Auto-deploy to production
2. Create PR → Auto-plan for development
3. Manual dispatch → Choose environment and action

**Manual Deployment:**
1. Go to Actions → "Terraform Infrastructure"
2. Click "Run workflow"
3. Select environment (dev/prod) and action (plan/apply/destroy)

### Manual Deployment

   ```bash
# Infrastructure
cd terraform/environments/dev
terraform apply

# Application (after infrastructure)
npm run build
npm run start
```

## 🔐 Security Features

- **Infrastructure**: VPC with private subnets, NAT gateways
- **State Management**: Encrypted S3 backend with DynamoDB locking
- **Access Control**: IAM policies with least privilege
- **Secrets**: Environment-based configuration
- **Monitoring**: CloudWatch logs and metrics (future)

## 📊 Monitoring & Logging

- **Application Logs**: Winston logging framework
- **Infrastructure**: Terraform state tracking
- **Future Enhancements**: CloudWatch, ELK stack integration

## 🧪 Testing

   ```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
   ```

## 🚧 Roadmap

### Phase 1: Foundation ✅
- [x] Clean Terraform infrastructure
- [x] VPC with public/private subnets
- [x] GitHub Actions CI/CD
- [x] Application containerization

### Phase 2: Application Infrastructure
- [ ] RDS PostgreSQL setup
- [ ] ElastiCache Redis setup
- [ ] Application Load Balancer
- [ ] ECS container deployment

### Phase 3: Enhanced Features
- [ ] CloudFront CDN
- [ ] Route53 DNS management
- [ ] SSL/TLS certificates
- [ ] Auto-scaling configuration

### Phase 4: Observability
- [ ] CloudWatch monitoring
- [ ] ELK logging stack
- [ ] Health checks & alerts
- [ ] Performance metrics

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Test** your changes thoroughly
4. **Commit** your changes (`git commit -m 'Add amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

## 📞 Support

- **Infrastructure**: See [README-terraform.md](README-terraform.md)
- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎉 Migration from CDK Complete!

This project has been successfully migrated from AWS CDK to Terraform for a cleaner, simpler infrastructure management experience. All the complex CDK bootstrap issues are now resolved with straightforward Terraform workflows.

**Key Improvements:**
- ✅ **No more CDK bootstrap failures**
- ✅ **Simplified state management**
- ✅ **Clean, readable infrastructure code**  
- ✅ **Better error handling and recovery**
- ✅ **Consistent naming conventions**

🚀 **Ready to scale!** The foundation is now clean and ready for future enhancements.
