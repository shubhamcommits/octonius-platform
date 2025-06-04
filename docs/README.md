# Octonius Platform Documentation

This directory contains comprehensive documentation for the Octonius Platform deployment system and infrastructure.

## 📋 Documentation Index

### Deployment & Infrastructure
- **[Deployment Scripts Architecture](DEPLOYMENT_SCRIPTS.md)** - Complete guide to the new script-based deployment system
- **[CDK Error Handling](CDK_ERROR_HANDLING.md)** - Robust bootstrap process and error recovery mechanisms
- **[CDK Bootstrap Options](CDK_BOOTSTRAP_OPTIONS.md)** - Custom bucket configurations and bootstrap strategies

### Monitoring & Tracking
- **[Deployment Tracking](DEPLOYMENT_TRACKING.md)** - Complete deployment history and monitoring system

### Configuration
- **[Environment Variables](ENV_VARIABLES.md)** - Complete reference for all environment variables

## 🚀 Quick Navigation

### For Developers
- **Getting Started**: [Deployment Scripts](DEPLOYMENT_SCRIPTS.md#usage-examples)
- **Local Testing**: [Script Usage](DEPLOYMENT_SCRIPTS.md#local-development)
- **Troubleshooting**: [Error Handling](CDK_ERROR_HANDLING.md#troubleshooting)

### For DevOps
- **Bootstrap Configuration**: [Bootstrap Options](CDK_BOOTSTRAP_OPTIONS.md)
- **Error Recovery**: [CDK Error Handling](CDK_ERROR_HANDLING.md)
- **Deployment Monitoring**: [Deployment Tracking](DEPLOYMENT_TRACKING.md)

### For Operations
- **Environment Setup**: [Environment Variables](ENV_VARIABLES.md)
- **Deployment History**: [Tracking System](DEPLOYMENT_TRACKING.md#using-the-deployment-tracker)
- **System Architecture**: [Scripts Architecture](DEPLOYMENT_SCRIPTS.md#architecture-overview)

## 📁 Documentation Structure

```
docs/
├── README.md                      # This index file
├── DEPLOYMENT_SCRIPTS.md          # Main deployment system guide
├── CDK_ERROR_HANDLING.md          # Error handling and recovery
├── CDK_BOOTSTRAP_OPTIONS.md       # Bootstrap configuration options
├── DEPLOYMENT_TRACKING.md         # Deployment monitoring and history
└── ENV_VARIABLES.md               # Environment variable reference
```

## 🔄 Recent Updates

The documentation reflects the major refactoring from complex YAML workflows to reusable, testable deployment scripts:

- **96% reduction** in YAML complexity
- **Enhanced error handling** with automatic recovery
- **Local testing capability** for all deployment operations
- **Cross-platform compatibility** (GitHub Actions, GitLab, Jenkins, etc.)

## 📞 Support

For questions about the documentation or deployment system:

1. **Check the troubleshooting sections** in the relevant documentation
2. **Review the examples** in each guide
3. **Use the dry-run mode** to test changes safely
4. **Create an issue** if you encounter problems not covered in the docs

---

**Back to:** [Main README](../README.md) 