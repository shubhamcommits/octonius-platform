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
