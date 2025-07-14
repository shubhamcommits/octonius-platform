# Getting Started

## Prerequisites

### **Required Software**
- **Node.js** (v18+ recommended)
- **npm** or **yarn** package manager
- **Docker** & **Docker Compose** (for local development)
- **Git** (for version control)

### **AWS Account Setup** (for production)
- **AWS CLI** configured with appropriate credentials
- **AWS Account** with permissions for S3, RDS, ElastiCache, VPC
- **Terraform** (v1.0+) for infrastructure management

### **Database**
- **PostgreSQL** client (for local DB access)
- **Redis** client (optional, for cache inspection)

### **Email Service**
- **Resend** account (for OTP and notifications)
- **Domain verification** for sending emails

## Quick Start

### 1. **Clone the Repository**
```bash
git clone https://github.com/your-org/octonius-platform.git
cd octonius-platform
```

### 2. **Environment Setup**

#### **Backend Environment**
```bash
cd src
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
# Server Configuration
HOST=localhost
APP_NAME=Octonius Platform
PORT=3000
NODE_ENV=dev
CLUSTER=false
DOMAIN=localhost:3000

# AWS Configuration
AWS_ACCOUNT_NUMBER=your-account-number
AWS_DEFAULT_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
CDN_BASE_URL=https://media.yourdomain.com

# Database Configuration
DB_WRITER_HOST=localhost
DB_READER_HOST=localhost
DB_PORT=5432
DB_NAME=octonius_dev
DB_USER=postgres
DB_PASS=your-password
MAX_POOL=10
MIN_POOL=2

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_ACCESS_KEY=your-super-secret-access-key
JWT_ACCESS_TIME=15m
JWT_REFRESH_KEY=your-super-secret-refresh-key
JWT_REFRESH_TIME=7d

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key
SUPPORT_EMAIL=support@yourdomain.com
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### **Frontend Environment**
```bash
cd services/octonius-web
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
# API Configuration
API_BASE_URL=http://localhost:3000
CDN_BASE_URL=https://media.yourdomain.com

# Feature Flags
ENABLE_ANALYTICS=false
ENABLE_DEBUG_MODE=true
```

### 3. **Database Setup**

#### **Option A: Docker Compose (Recommended)**
```bash
# From project root
docker-compose up -d postgres redis
```

#### **Option B: Local Installation**
```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib

# Install Redis
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server

# Start services
brew services start postgresql
brew services start redis
```

### 4. **Backend Setup**
```bash
cd src

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

**Backend will be available at:** `http://localhost:3000`

### 5. **Frontend Setup**
```bash
cd services/octonius-web

# Install dependencies
npm install

# Start development server
npm start
```

**Frontend will be available at:** `http://localhost:4200`

### 6. **Infrastructure Setup (Optional)**

#### **Local Development**
For local development, you can use local services or mock AWS services.

#### **Production/Staging**
```bash
cd terraform

# Initialize Terraform
terraform init

# Plan infrastructure
terraform plan

# Apply infrastructure
terraform apply
```

## Development Workflow

### **Full Stack Development**
```bash
# Terminal 1: Backend
cd src
npm run dev

# Terminal 2: Frontend
cd services/octonius-web
npm start

# Terminal 3: Infrastructure (if needed)
docker-compose up -d
```

### **Database Management**
```bash
# Run migrations
cd src
npm run migrate

# Seed data (if available)
npm run seed

# Reset database
npm run db:reset
```

### **Testing**
```bash
# Backend tests
cd src
npm test

# Frontend tests
cd services/octonius-web
npm test

# E2E tests (if configured)
npm run e2e
```

## First User Setup

### 1. **Access the Application**
- Open `http://localhost:4200` in your browser
- You'll be redirected to the welcome page

### 2. **Create Your First Account**
- Click "Get Started" or "Register"
- Enter your email address
- Check your email for OTP
- Enter the OTP to verify your account

### 3. **Create Your First Workplace**
- After OTP verification, you'll be prompted to create a workplace
- Enter workplace name and details
- This creates your first organization

### 4. **Explore Features**
- **My Space**: Your personal workspace
- **Workplace**: Team collaboration features
- **Groups**: Create teams and manage tasks
- **Files**: Upload and organize documents
- **Lounge**: Social features and announcements

## Configuration Details

### **Backend Configuration**

#### **Database Configuration**
```typescript
// src/config/database.ts
export const databaseConfig = {
  development: {
    host: process.env.DB_WRITER_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    dialect: 'postgres',
    pool: {
      max: parseInt(process.env.MAX_POOL || '10'),
      min: parseInt(process.env.MIN_POOL || '2'),
      acquire: 30000,
      idle: 10000
    }
  }
}
```

#### **AWS Configuration**
```typescript
// src/config/aws.ts
export const awsConfig = {
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  s3: {
    bucket: process.env.S3_BUCKET_NAME
  }
}
```

### **Frontend Configuration**

#### **Environment Configuration**
```typescript
// services/octonius-web/src/environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000',
  cdnBaseUrl: 'https://media.yourdomain.com',
  enableAnalytics: false,
  enableDebugMode: true
}
```

#### **API Interceptors**
```typescript
// services/octonius-web/src/app/core/interceptors/auth.interceptor.ts
// Automatically adds JWT tokens to API requests
// Handles token refresh and logout on 401 errors
```

## Troubleshooting

### **Common Issues**

#### **Database Connection Issues**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Check connection
psql -h localhost -U postgres -d octonius_dev

# Reset database
cd src
npm run db:reset
```

#### **Redis Connection Issues**
```bash
# Check if Redis is running
brew services list | grep redis

# Test Redis connection
redis-cli ping

# Should return: PONG
```

#### **Port Conflicts**
```bash
# Check what's using port 3000
lsof -i :3000

# Check what's using port 4200
lsof -i :4200

# Kill process if needed
kill -9 <PID>
```

#### **S3 Upload Issues**
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://your-bucket-name
```

#### **Email Delivery Issues**
```bash
# Check Resend API key
curl -X GET "https://api.resend.com/domains" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Verify domain in Resend dashboard
```

### **Development Tips**

#### **Hot Reload**
- Backend: `npm run dev` (uses nodemon)
- Frontend: `npm start` (uses Angular CLI dev server)

#### **Debug Mode**
```bash
# Backend debugging
cd src
npm run dev:debug

# Frontend debugging
cd services/octonius-web
npm start
# Open Chrome DevTools
```

#### **Database Inspection**
```bash
# Connect to database
psql -h localhost -U postgres -d octonius_dev

# List tables
\dt

# View data
SELECT * FROM users LIMIT 5;
```

#### **Log Monitoring**
```bash
# Backend logs
cd src
npm run dev
# Watch console output

# Frontend logs
# Open browser DevTools > Console
```

## Next Steps

### **Development**
1. **Explore the Codebase**: Review the architecture documentation
2. **Run Tests**: Ensure all tests pass
3. **Make Changes**: Start developing new features
4. **Follow Guidelines**: Use the development workflow

### **Production Deployment**
1. **Infrastructure**: Deploy using Terraform
2. **Environment**: Configure production environment variables
3. **Database**: Set up production database
4. **Monitoring**: Configure logging and monitoring
5. **SSL**: Set up HTTPS certificates
6. **Backup**: Configure database backups

### **Team Collaboration**
1. **Code Review**: Follow the contributing guidelines
2. **Documentation**: Update docs as you add features
3. **Testing**: Write tests for new functionality
4. **Deployment**: Use CI/CD pipeline for releases

## Support

### **Getting Help**
- **Documentation**: Check the `/docs` directory
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Ask team members for code reviews

### **Useful Commands**
```bash
# Development
npm run dev          # Backend development server
npm start           # Frontend development server
npm run build       # Build for production
npm test           # Run tests
npm run lint       # Lint code

# Database
npm run migrate     # Run migrations
npm run seed        # Seed database
npm run db:reset    # Reset database

# Infrastructure
terraform plan      # Plan infrastructure changes
terraform apply     # Apply infrastructure changes
terraform destroy   # Destroy infrastructure
```

This setup guide provides everything you need to get started with development on the Octonius Platform! 