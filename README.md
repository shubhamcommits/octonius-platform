# Octonius Platform

A robust API platform for Octonius services.

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/en/download/) (Latest LTS version recommended)
- Package manager of your choice:
  - [npm](https://www.npmjs.com/) (comes with Node.js)
  - [Yarn](https://classic.yarnpkg.com/en/docs/install/)

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
