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
│  │   ├── Welcome & Login                                        │
│  │   ├── OTP Verification                                       │
│  │   ├── Workplace Selection                                    │
│  │   ├── Workplace Creation                                     │
│  │   ├── Workplace Login                                        │
│  │   └── Invitation Acceptance                                  │
│  ├── My Space Module                                           │
│  │   ├── Inbox (Mission Control)                               │
│  │   ├── Workload (Task Management)                            │
│  │   ├── Files (Private Notes & Files)                         │
│  │   └── Note Editor (TipTap)                                  │
│  ├── Workplace Module                                          │
│  │   ├── Apps Dashboard                                         │
│  │   ├── Work Management                                        │
│  │   │   ├── Group Activity                                     │
│  │   │   ├── Task Boards (Kanban)                              │
│  │   │   ├── Group Dashboard                                    │
│  │   │   └── Group Administration                               │
│  │   ├── File Management                                        │
│  │   ├── CRM System                                            │
│  │   ├── Communities                                            │
│  │   ├── Library                                               │
│  │   └── Lounge (Story Sharing)                                │
│  ├── Account Module                                            │
│  │   ├── Profile Management                                     │
│  │   ├── Settings & Preferences                                 │
│  │   ├── Workplace Administration                               │
│  │   ├── Role & Permission Management                           │
│  │   └── Billing Management                                     │
│  └── Shared Components & Services                               │
│      ├── TipTap Rich Text Editor                               │
│      ├── Theme Service (Light/Dark)                            │
│      ├── Location Picker                                       │
│      ├── Infinite Scroll Lists                                 │
│      └── Auth Guards & Permissions                             │
├─────────────────────────────────────────────────────────────────┤
│  Backend Layer (Node.js/TypeScript)                            │
│  ├── Authentication Services                                    │
│  │   ├── OTP Generation & Verification                          │
│  │   ├── JWT Token Management                                   │
│  │   └── Session Management                                     │
│  ├── User Management                                           │
│  │   ├── Profile CRUD Operations                               │
│  │   ├── Avatar Upload                                         │
│  │   └── User Preferences                                       │
│  ├── Workplace Services                                        │
│  │   ├── Workplace CRUD                                        │
│  │   ├── Member Management                                      │
│  │   ├── Invitation System                                     │
│  │   └── Role Assignment                                       │
│  ├── Group & Task Management                                   │
│  │   ├── Group CRUD Operations                                 │
│  │   ├── Task Board Management                                 │
│  │   ├── Activity Feed                                         │
│  │   └── Member Management                                     │
│  ├── File Management                                           │
│  │   ├── S3 Upload Intent                                      │
│  │   ├── File Metadata Management                              │
│  │   └── Note Creation & Editing                               │
│  ├── Lounge Services                                           │
│  │   ├── Story Management                                      │
│  │   └── Content Sharing                                       │
│  ├── Notification Services                                     │
│  │   ├── Email Notifications                                   │
│  │   └── In-App Notifications                                  │
│  └── Role & Permission System                                  │
│      ├── Permission Management                                 │
│      ├── Role Assignment                                       │
│      └── Access Control                                        │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                     │
│  ├── PostgreSQL Database                                       │
│  │   ├── Users & Authentication                                │
│  │   ├── Workplaces & Memberships                              │
│  │   ├── Groups & Tasks                                        │
│  │   ├── Files & Notes                                         │
│  │   ├── Activities & Comments                                 │
│  │   └── Roles & Permissions                                   │
│  ├── Redis Cache                                               │
│  │   ├── Session Storage                                       │
│  │   ├── OTP Cache                                             │
│  │   └── Application Cache                                     │
│  └── AWS S3 Storage                                           │
│      ├── File Storage                                          │
│      ├── Avatar Storage                                        │
│      └── Presigned URLs                                        │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure Layer (Terraform)                              │
│  ├── VPC with Public/Private Subnets                          │
│  ├── NAT Gateways & Internet Gateway                           │
│  ├── Security Groups & NACLs                                   │
│  ├── S3 Buckets (State & Files)                               │
│  ├── DynamoDB (State Locking)                                 │
│  └── Future: ECS, RDS, ALB, CloudFront                        │
├─────────────────────────────────────────────────────────────────┤
│  CI/CD Pipeline (GitHub Actions)                               │
│  ├── 100% Pipeline-Native Terraform                            │
│  ├── Branch-Based Environment Detection                        │
│  ├── Auto-Bootstrap AWS Resources                             │
│  ├── Application Build & Test                                  │
│  └── Automated Deployment                                      │
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
│   │   │   │   │   ├── auth/           # Authentication module
│   │   │   │   │   │   ├── welcome/    # Welcome screen
│   │   │   │   │   │   ├── login/      # Login component
│   │   │   │   │   │   ├── verify-otp/ # OTP verification
│   │   │   │   │   │   ├── select-workplace/ # Workplace selection
│   │   │   │   │   │   ├── create-workplace/ # Workplace creation
│   │   │   │   │   │   ├── workplace-login/ # Workplace login
│   │   │   │   │   │   └── accept-invitation/ # Invitation acceptance
│   │   │   │   │   ├── my-space/       # My Space module
│   │   │   │   │   │   ├── inbox/      # Mission control dashboard
│   │   │   │   │   │   ├── workload/   # Personal task management
│   │   │   │   │   │   ├── files/      # Private file management
│   │   │   │   │   │   └── note-editor/ # Rich text note editor
│   │   │   │   │   ├── workplace/      # Workplace module
│   │   │   │   │   │   ├── apps/       # Apps dashboard
│   │   │   │   │   │   ├── work-management/ # Work management
│   │   │   │   │   │   │   ├── group-detail/ # Group management
│   │   │   │   │   │   │   │   ├── group-activity/ # Activity feeds
│   │   │   │   │   │   │   │   ├── group-tasks/ # Task boards
│   │   │   │   │   │   │   │   ├── group-dashboard/ # Analytics
│   │   │   │   │   │   │   │   └── group-admin/ # Administration
│   │   │   │   │   │   ├── files/      # File management
│   │   │   │   │   │   ├── crm/        # CRM system
│   │   │   │   │   │   ├── communities/ # Team communities
│   │   │   │   │   │   ├── library/    # Knowledge base
│   │   │   │   │   │   └── lounge/     # Story sharing
│   │   │   │   │   ├── account/        # Account module
│   │   │   │   │   │   ├── profile/    # Profile management
│   │   │   │   │   │   ├── settings/   # Settings & preferences
│   │   │   │   │   │   └── billing/    # Billing management
│   │   │   │   │   └── shared/         # Shared components
│   │   │   │   │       ├── components/ # Reusable components
│   │   │   │   │       │   ├── navbar/ # Navigation bar
│   │   │   │   │       │   ├── topbar/ # Top navigation
│   │   │   │   │       │   ├── location-picker/ # Location selection
│   │   │   │   │       │   └── infinite-scroll-list/ # Performance lists
│   │   │   │   │       ├── services/   # Shared services
│   │   │   │   │       │   ├── auth.guard.ts # Route protection
│   │   │   │   │       │   ├── permission.guard.ts # Permission control
│   │   │   │   │       │   └── workload.service.ts # Workload management
│   │   │   │   │       └── directives/ # Custom directives
│   │   │   │   ├── core/              # Core services & components
│   │   │   │   │   ├── services/      # Core services
│   │   │   │   │   │   ├── auth.service.ts # Authentication
│   │   │   │   │   │   ├── user.service.ts # User management
│   │   │   │   │   │   ├── file.service.ts # File operations
│   │   │   │   │   │   ├── theme.service.ts # Theme management
│   │   │   │   │   │   └── toast.service.ts # Notifications
│   │   │   │   │   ├── components/    # Core components
│   │   │   │   │   │   ├── tiptap-editor/ # Rich text editor
│   │   │   │   │   │   └── dialog/    # Modal system
│   │   │   │   │   └── models/        # Data models
│   │   │   │   ├── app.config.ts      # App configuration
│   │   │   │   └── app.routes.ts      # Route definitions
│   │   │   └── environments/          # Environment configurations
│   │   ├── package.json
│   │   └── angular.json
│   │
├── 🔧 Backend (Node.js/TypeScript)
│   ├── src/
│   │   ├── auths/                     # Authentication services
│   │   │   ├── auth.controller.ts     # Auth endpoints
│   │   │   ├── auth.service.ts        # Auth business logic
│   │   │   ├── auth.model.ts          # Auth data model
│   │   │   ├── token.service.ts       # Token management
│   │   │   └── auth.route.ts          # Auth routes
│   │   ├── users/                     # User management
│   │   │   ├── user.controller.ts     # User endpoints
│   │   │   ├── user.service.ts        # User business logic
│   │   │   ├── user.model.ts          # User data model
│   │   │   └── user.route.ts          # User routes
│   │   ├── workplaces/               # Workplace management
│   │   │   ├── workplace.controller.ts # Workplace endpoints
│   │   │   ├── workplace.service.ts   # Workplace business logic
│   │   │   ├── workplace.model.ts     # Workplace data model
│   │   │   ├── workplace-membership.model.ts # Membership model
│   │   │   ├── workplace-invitation.model.ts # Invitation model
│   │   │   └── workplace.route.ts     # Workplace routes
│   │   ├── groups/                   # Group & task management
│   │   │   ├── group.controller.ts    # Group endpoints
│   │   │   ├── group.service.ts       # Group business logic
│   │   │   ├── group.model.ts         # Group data model
│   │   │   ├── group-membership.model.ts # Group membership
│   │   │   ├── private-group.service.ts # Private group logic
│   │   │   ├── tasks/                # Task management
│   │   │   │   ├── task.controller.ts # Task endpoints
│   │   │   │   ├── task.service.ts    # Task business logic
│   │   │   │   ├── task.model.ts      # Task data model
│   │   │   │   ├── task-column.model.ts # Task columns
│   │   │   │   ├── task-comment.model.ts # Task comments
│   │   │   │   ├── task-assignee.model.ts # Task assignments
│   │   │   │   └── task.route.ts      # Task routes
│   │   │   ├── activity/             # Activity tracking
│   │   │   │   ├── activity.model.ts  # Activity data model
│   │   │   │   └── activity.service.ts # Activity logic
│   │   │   └── group.route.ts        # Group routes
│   │   ├── files/                    # File management
│   │   │   ├── file.controller.ts     # File endpoints
│   │   │   ├── file.service.ts        # File business logic
│   │   │   ├── file.model.ts          # File data model
│   │   │   └── file.route.ts          # File routes
│   │   ├── lounge/                   # Content sharing
│   │   │   ├── lounge.controller.ts   # Lounge endpoints
│   │   │   ├── lounge.service.ts      # Lounge business logic
│   │   │   ├── lounge.model.ts        # Story data model
│   │   │   └── lounge.route.ts        # Lounge routes
│   │   ├── roles/                    # Role & permission system
│   │   │   ├── role.controller.ts     # Role endpoints
│   │   │   ├── role.service.ts        # Role business logic
│   │   │   ├── role.model.ts          # Role data model
│   │   │   ├── permission.model.ts    # Permission model
│   │   │   ├── role-permission.model.ts # Role-permission mapping
│   │   │   ├── permissions.constants.ts # Permission constants
│   │   │   ├── initialize-permissions.ts # Permission initialization
│   │   │   └── role.route.ts          # Role routes
│   │   ├── notifications/            # Notification system
│   │   │   ├── notification.controller.ts # Notification endpoints
│   │   │   ├── notification.service.ts # Notification logic
│   │   │   ├── emails/               # Email templates
│   │   │   └── notification.route.ts  # Notification routes
│   │   ├── workload/                 # Workload management
│   │   │   ├── workload.controller.ts # Workload endpoints
│   │   │   ├── workload.service.ts    # Workload logic
│   │   │   └── workload.route.ts      # Workload routes
│   │   ├── shared/                   # Shared utilities
│   │   │   ├── s3.service.ts         # S3 integration
│   │   │   ├── cache.service.ts       # Caching service
│   │   │   ├── circuit-breakers/     # Circuit breaker patterns
│   │   │   ├── permission.util.ts     # Permission utilities
│   │   │   └── response.utils.ts      # Response utilities
│   │   ├── middleware/               # Express middleware
│   │   │   ├── auth.middleware.ts     # Authentication middleware
│   │   │   └── request-timer.middleware.ts # Request timing
│   │   ├── config/                   # Configuration
│   │   │   ├── env.ts                # Environment variables
│   │   │   ├── database.ts           # Database config
│   │   │   ├── aws.ts                # AWS config
│   │   │   ├── redis.ts              # Redis config
│   │   │   └── constants.ts          # Application constants
│   │   ├── models/                   # Data model exports
│   │   ├── app.ts                    # Express app setup
│   │   ├── server.ts                 # Main server file
│   │   ├── database.ts               # Database connection
│   │   ├── sequelize.ts              # Sequelize setup
│   │   └── redis.ts                  # Redis connection
│   └── package.json                  # Node.js dependencies
│
├── 🏗️ Infrastructure (Terraform)
│   ├── terraform/
│   │   ├── main.tf                   # Main Terraform configuration
│   │   ├── variables.tf              # Variable definitions
│   │   ├── outputs.tf                # Output definitions
│   │   ├── locals.tf                 # Local values
│   │   ├── versions.tf               # Provider versions
│   │   └── modules/                  # Terraform modules
│   │       ├── vpc/                  # VPC networking module
│   │       ├── ecr/                  # ECR repository module
│   │       ├── rds/                  # RDS database module
│   │       ├── elasticache/          # ElastiCache Redis module
│   │       ├── app_runner/           # App Runner module
│   │       ├── bastion/              # Bastion host module
│   │       └── web/                  # Web application module
│   └── terraform.tfstate             # Terraform state file
│
├── 🐳 Docker & Deployment
│   ├── Dockerfile                    # Application container
│   ├── docker-compose.yml           # Local development
│   └── docker-entrypoint.sh         # Container entrypoint
│
├── 📚 Documentation
│   ├── docs/
│   │   ├── README.md                 # Documentation index
│   │   ├── architecture.md           # System architecture
│   │   ├── devops-guide.md           # DevOps & deployment
│   │   ├── terraform-guide.md        # Infrastructure guide
│   │   ├── frontend-guide.md         # Frontend development
│   │   ├── contributing.md           # Contribution guidelines
│   │   └── faq.md                    # Frequently asked questions
│   └── README.md                     # This file (overview)
```

## 🔐 Authentication System

The platform implements a comprehensive, passwordless authentication system with:

### Core Authentication Features
- **Passwordless Authentication**: Email-based login without passwords
- **OTP Verification**: Secure 6-digit one-time password verification
- **Email Delivery**: Automated OTP delivery via Resend email service
- **Session Management**: JWT-based session handling with Redis storage
- **Token Refresh**: Automatic token refresh for seamless user experience

### Workplace Management
- **Workplace Selection**: Choose from existing workplaces or create new ones
- **Workplace Creation**: Set up new workplaces with custom branding and settings
- **Workplace Login**: Secure workplace-specific authentication flow
- **Invitation System**: Email-based workplace invitations with role assignment
- **Invitation Acceptance**: Accept invitations and join workplaces seamlessly

### Security Features
- **Role-Based Access Control**: Granular permission system with custom roles
- **Route Protection**: Angular guards for route-level access control
- **Permission Guards**: Feature-level permission checking
- **Secure Headers**: CORS, compression, and security middleware
- **Request Timing**: Performance monitoring and request tracking

### User Experience
- **Welcome Screen**: Clean, modern landing page
- **Progressive Flow**: Step-by-step authentication process
- **Auto-Save**: Automatic form data persistence
- **Error Handling**: User-friendly error messages and recovery
- **Mobile Responsive**: Optimized for all device sizes

### Technical Implementation
- **JWT Tokens**: Access and refresh token management
- **Redis Caching**: Session and OTP storage
- **Email Templates**: Professional email notifications
- **Circuit Breakers**: Resilient external service integration
- **Rate Limiting**: Protection against abuse and spam

## 🎨 Frontend Features

### Authentication Module
- **Welcome & Login**: Clean, modern login interface with email-based authentication
- **OTP Verification**: Secure one-time password verification with resend functionality
- **Workplace Selection**: Choose from existing workplaces or create new ones
- **Workplace Creation**: Set up new workplaces with custom branding and settings
- **Workplace Login**: Secure workplace-specific authentication
- **Invitation Acceptance**: Accept workplace invitations with role assignment
- **Email Notifications**: Automated OTP delivery via Resend email service

### My Space Module
- **Inbox (Mission Control)**: Centralized dashboard for work status and updates
- **Workload Management**: Personal task tracking and assignment management
- **File Management**: Private file storage with S3 integration and rich file types
- **Note Editor**: Advanced rich text editor powered by TipTap with markdown support
- **Personal Dashboard**: Customizable workspace for individual productivity

### Workplace Module
- **Apps Dashboard**: Centralized access to all workplace applications
- **Work Management**: Comprehensive project and team management
  - **Group Activity**: Real-time activity feeds and team updates
  - **Task Boards**: Kanban-style task management with drag-and-drop
  - **Group Dashboard**: Analytics and project overview
  - **Group Administration**: Member management, permissions, and settings
- **File Management**: Shared file storage with folder organization
- **CRM System**: Customer relationship management tools
- **Communities**: Team collaboration and communication spaces
- **Library**: Knowledge base and resource management
- **Lounge**: Story sharing and content creation platform

### Account Module
- **Profile Management**: Complete user profile with avatar upload and preferences
- **Settings & Preferences**: Comprehensive settings with multiple tabs
  - **Overview**: Workplace statistics and quick actions
  - **Details**: Workplace information and branding
  - **Members**: Team member management and invitations
  - **Roles**: Custom role creation and permission management
  - **Permissions**: Granular permission control system
  - **Invitations**: Invitation management and tracking
  - **Billing**: Subscription and payment management
- **Workplace Administration**: Full workplace management capabilities
- **Role & Permission Management**: Advanced access control system

### Shared Components & Services
- **TipTap Rich Text Editor**: Advanced WYSIWYG editor with markdown support
- **Theme Service**: Light/Dark mode switching with system preference detection
- **Location Picker**: Interactive location selection with map integration
- **Infinite Scroll Lists**: Performance-optimized list components
- **Auth Guards**: Route protection and permission-based access control
- **Toast Notifications**: User-friendly notification system
- **Modal System**: Reusable modal components for various interactions
- **File Upload**: Drag-and-drop file upload with progress tracking
- **Search & Filter**: Advanced search capabilities across all modules
- **Responsive Design**: Mobile-first responsive layout with Tailwind CSS
- **Modern UI**: Clean, professional interface with DaisyUI components

## 🔧 Backend Services

### Authentication & Authorization
- **OTP System**: Secure one-time password generation and verification
- **JWT Tokens**: Access and refresh token management with Redis storage
- **Session Management**: Secure session handling with Redis caching
- **Passwordless Auth**: Email-based authentication without passwords
- **Role-Based Access Control**: Granular permission system with custom roles

### User Management
- **User Profiles**: Complete user profile management with metadata
- **Avatar Upload**: S3-based avatar storage with presigned URLs
- **User Preferences**: Customizable notification and display preferences
- **Profile Updates**: Real-time profile updates with auto-save functionality
- **User Search**: Advanced user search and filtering capabilities

### Workplace Management
- **Workplace CRUD**: Complete workplace lifecycle management
- **Member Management**: Add, remove, and manage workplace members
- **Invitation System**: Email-based invitation system with role assignment
- **Role Assignment**: Assign custom roles to workplace members
- **Workplace Settings**: Branding, preferences, and configuration management
- **Statistics**: Workplace analytics and member activity tracking

### Group & Task Management
- **Group Operations**: Create, update, and manage work groups
- **Task Boards**: Kanban-style task management with drag-and-drop
- **Task CRUD**: Complete task lifecycle management
- **Activity Feeds**: Real-time activity tracking and notifications
- **Member Management**: Group member addition and role assignment
- **Task Comments**: Collaborative task discussion system
- **Task Assignments**: User assignment and workload management

### File Management
- **S3 Integration**: Direct S3 upload with presigned URLs
- **File Metadata**: Comprehensive file information and organization
- **Note Creation**: Rich text note creation and editing
- **File Types**: Support for various file types with proper icons
- **Folder Organization**: Hierarchical file organization system
- **Search & Filter**: Advanced file search and filtering capabilities

### Lounge & Content
- **Story Management**: Create, edit, and share stories
- **Content Sharing**: Team content sharing and collaboration
- **Story Feed**: Real-time story updates and interactions
- **Media Support**: Image and media content support

### Notification System
- **Email Notifications**: Automated email delivery via Resend
- **In-App Notifications**: Real-time in-application notifications
- **OTP Delivery**: Secure OTP delivery via email
- **System Notifications**: Platform-wide announcements and updates

### Role & Permission System
- **Permission Management**: Granular permission control system
- **Custom Roles**: Create and manage custom user roles
- **Permission Assignment**: Assign specific permissions to roles
- **Access Control**: Route and feature-level access control
- **System Permissions**: Built-in system permissions and categories

### Data Models
- **Users**: Complete user profiles with metadata and preferences
- **Workplaces**: Organization management with branding and settings
- **Groups**: Work group management with member relationships
- **Tasks**: Task management with assignments, comments, and metadata
- **Files**: File storage with S3 integration and metadata
- **Activities**: Activity tracking and feed management
- **Roles & Permissions**: Role-based access control system
- **Notifications**: Email and in-app notification management

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

### 100% Pipeline-Native Infrastructure

Our infrastructure system is **100% pipeline-native** - everything is computed directly in the CI/CD pipeline using standard tools with **zero external scripts**. Environments are automatically detected from branch names, AWS resources are bootstrapped automatically, and all configurations are generated on-the-fly.

### Branch-Based Environment Mapping

| Branch Pattern | Environment | Use Case | Infrastructure |
|----------------|-------------|----------|---------------|
| `master` | `prod` | Production | High availability, multiple AZs |
| `development` | `dev` | Development | Cost-optimized, single NAT |
| `feature/*` | `feature-{name}` | Feature development | Minimal, temporary |
| `hotfix/*` | `hotfix-{name}` | Critical fixes | Isolated testing |
| Other branches | `{branch-name}` | Custom environments | Configurable |

### Environment-Specific Settings

**Production (`prod`)**:
- VPC CIDR: `10.0.0.0/16`
- Subnets: Multiple AZs for high availability  
- NAT Gateway: Multiple for redundancy
- Cost: Higher (optimized for availability)

**Development (`dev`)**:
- VPC CIDR: `10.1.0.0/16`
- Subnets: Multi-AZ with cost optimization
- NAT Gateway: Single instance
- Cost: Medium (balanced)

**Feature Branches (`feature-*`)**:
- VPC CIDR: `10.{hash}.0.0/16` (auto-computed unique ranges)
- Subnets: Minimal viable setup
- NAT Gateway: Single instance  
- Cost: Low (minimal resources)

## 🚀 Deployment

### Automated (GitHub Actions)

**100% Pipeline-Native Deployment:**
1. **Push to `master`** → Auto-deploy to production (with S3/DynamoDB auto-created)
2. **Push to `development`** → Plan for dev (with S3/DynamoDB auto-created)
3. **Push to `feature/*`** → Plan for feature environment (with S3/DynamoDB auto-created)
4. **Manual dispatch** → Choose environment and action

**What Gets Auto-Created:**
- **S3 Bucket**: Uses existing buckets from environment variables
- **DynamoDB Table**: `{env}-octonius-terraform-locks-{region}` (created automatically)
- **VPC & Networking**: Environment-specific CIDR ranges
- **Security Groups**: Properly configured firewall rules  
- **State Management**: Isolated S3 bucket and DynamoDB table
- **Tagging**: Comprehensive resource tagging for management

### Manual Deployment

   ```bash
# Infrastructure (100% pipeline-native)
git checkout master
git push origin master  # Auto-deploys to prod

git checkout development  
git push origin development  # Plans for dev

# Application (after infrastructure)
npm run build
npm run start
```

### Infrastructure Components

Each environment automatically provisions:
- **VPC & Networking**: Environment-specific CIDR ranges
- **Security Groups**: Properly configured firewall rules  
- **State Management**: Isolated S3 bucket and DynamoDB table
- **Tagging**: Comprehensive resource tagging for management
- **Future**: ECS, RDS, ALB, CloudFront (planned)

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
- [x] 100% Pipeline-native infrastructure
- [x] Branch-based environment detection
- [x] Auto-bootstrap AWS resources

### Phase 2: Core Application ✅
- [x] Authentication system (OTP-based)
- [x] User management with profiles
- [x] Workplace management system
- [x] Group and task management
- [x] File management with S3 integration
- [x] Role and permission system
- [x] Notification system
- [x] Angular frontend with modular architecture
- [x] TipTap rich text editor
- [x] Theme system (Light/Dark)
- [x] Responsive design with Tailwind CSS

### Phase 3: Advanced Features ✅
- [x] My Space module (Inbox, Workload, Files)
- [x] Workplace module (Apps, Work Management, CRM, Lounge)
- [x] Account module (Profile, Settings, Billing)
- [x] Task boards with Kanban interface
- [x] Activity feeds and real-time updates
- [x] File upload with drag-and-drop
- [x] Location picker integration
- [x] Infinite scroll lists
- [x] Modal system and dialogs
- [x] Toast notifications
- [x] Search and filtering capabilities

### Phase 4: Application Infrastructure (In Progress)
- [ ] RDS PostgreSQL setup
- [ ] ElastiCache Redis setup
- [ ] Application Load Balancer
- [ ] ECS container deployment
- [ ] Database migrations and seeding
- [ ] Production environment optimization

### Phase 5: Enhanced Infrastructure
- [ ] CloudFront CDN
- [ ] Route53 DNS management
- [ ] SSL/TLS certificates
- [ ] Auto-scaling configuration
- [ ] Multi-region deployment
- [ ] Backup and disaster recovery

### Phase 6: Observability & Monitoring
- [ ] CloudWatch monitoring
- [ ] ELK logging stack
- [ ] Health checks & alerts
- [ ] Performance metrics
- [ ] Application performance monitoring
- [ ] Error tracking and reporting

### Phase 7: Advanced Features
- [ ] Real-time collaboration
- [ ] Video conferencing integration
- [ ] Mobile applications
- [ ] API rate limiting
- [ ] Advanced analytics dashboard
- [ ] Third-party integrations

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
