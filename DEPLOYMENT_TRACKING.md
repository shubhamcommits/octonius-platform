# Deployment Tracking System

This document explains the comprehensive deployment tracking system implemented for the Octonius Platform bootstrap buckets.

## Overview

Every CDK deployment now automatically creates detailed tracking manifests in your bootstrap buckets (`DEV_S3_BUCKET` and `PROD_S3_BUCKET`). This allows you to:

- ✅ Track every deployment with full metadata
- ✅ See deployment history and compare versions  
- ✅ Monitor deployment status and duration
- ✅ Identify rollback targets
- ✅ Audit who deployed what and when

## What Gets Tracked

Each deployment creates multiple manifest files with this information:

```json
{
  "deploymentId": "deploy-20231201-120000-abc123def",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "completedAt": "2023-12-01T12:05:30.000Z",
  "environment": "dev",
  "gitCommit": "abc123def456...",
  "gitRef": "refs/heads/main",
  "gitActor": "john.doe",
  "runId": "7234567890",
  "runNumber": "42",
  "workflowName": "Provision AWS Infrastructure",
  "cdkVersion": "2.110.0",
  "nodeVersion": "v20.9.0",
  "awsRegion": "eu-central-1",
  "awsAccount": "566545930933",
  "appName": "octonius",
  "bootstrapBucket": "dev-octonius-assets-566545930933-eu-central-1",
  "status": "success",
  "deployedStacks": "dev-octonius-cdk-stack-eu-central-1",
  "duration": "330 seconds"
}
```

## S3 Bucket Structure

The tracking system organizes files in your bootstrap bucket like this:

```
s3://your-bootstrap-bucket/
├── deployments/
│   ├── deploy-20231201-120000-abc123/
│   │   ├── manifest.json              # Initial deployment manifest
│   │   └── final-manifest.json        # Final status with results
│   ├── deploy-20231201-130000-def456/
│   │   ├── manifest.json
│   │   └── final-manifest.json
│   ├── latest-dev.json                # Latest deployment (any status)
│   ├── latest-dev-success.json        # Latest successful deployment
│   ├── latest-prod.json
│   ├── latest-prod-success.json
│   └── history/
│       ├── 2023/
│       │   ├── 12/
│       │   │   ├── 01/
│       │   │   │   ├── deploy-20231201-120000-abc123.json
│       │   │   │   └── deploy-20231201-130000-def456.json
│       │   │   └── 02/
│       │   │       └── deploy-20231202-090000-ghi789.json
│       │   └── 11/
│       └── 2024/
└── assets/                           # Your CDK assets (existing)
    └── ...
```

## Using the Deployment Tracker

A command-line tool is provided at `scripts/deployment-tracker.sh`:

### Show Latest Deployment
```bash
./scripts/deployment-tracker.sh latest --env dev
./scripts/deployment-tracker.sh latest --env prod
```

### View Deployment History
```bash
# Last 10 deployments
./scripts/deployment-tracker.sh history --env dev

# Last 5 deployments  
./scripts/deployment-tracker.sh history --env prod --limit 5

# JSON output for scripting
./scripts/deployment-tracker.sh history --env dev --json
```

### Check Deployment Status
```bash
./scripts/deployment-tracker.sh status --env dev
```

### Compare Deployments
```bash
./scripts/deployment-tracker.sh compare --env prod \
  --from deploy-20231201-120000-abc123 \
  --to deploy-20231201-130000-def456
```

### Get Rollback Information
```bash
./scripts/deployment-tracker.sh rollback-info --env prod
```

## Manual Queries

You can also query deployment information directly with AWS CLI:

### Get Latest Successful Deployment
```bash
aws s3 cp s3://your-bucket/deployments/latest-dev-success.json - | jq '.'
```

### List All Deployments for a Date
```bash
aws s3 ls s3://your-bucket/deployments/history/2023/12/01/ --recursive
```

### Download Specific Deployment Manifest
```bash
aws s3 cp s3://your-bucket/deployments/deploy-20231201-120000-abc123/final-manifest.json deployment.json
```

## Deployment Lifecycle

The tracking happens automatically during each GitHub Actions deployment:

1. **Pre-deployment**: Creates initial manifest with `"status": "deploying"`
2. **Bootstrap**: CDK bootstrap uses your existing buckets
3. **Deploy**: CDK deploys all stacks
4. **Post-deployment**: Updates manifest with final status and results

## Integration with CI/CD

The tracking is integrated into your existing `.github/workflows/provision-aws-infrastructure.yml`:

- ✅ **Create Deployment Manifest** step - Records deployment start
- ✅ **CDK Deploy** step - Executes your deployment  
- ✅ **Update Deployment Status** step - Records final results

## Retention and Lifecycle

Your bootstrap buckets are already configured with proper lifecycle rules:

- **Current versions**: Retained for 2 years, then Deep Archive
- **Non-current versions**: Retained for 1 year  
- **Cost optimization**: Automatic transitions to cheaper storage classes
- **Compliance**: Long-term retention for audit purposes

## Benefits

### For Development
- **Debug deployments**: See exactly what was deployed and when
- **Track changes**: Compare deployments to understand differences
- **Monitor performance**: Track deployment duration trends

### For Operations  
- **Incident response**: Quickly identify when issues were introduced
- **Rollback planning**: See available rollback targets
- **Audit compliance**: Complete deployment history with actors

### For Management
- **Deployment frequency**: Track how often deployments happen
- **Success rates**: Monitor deployment reliability
- **Team activity**: See who's deploying what

## Security Considerations

- **Access control**: Only users with S3 access can view deployment history
- **Encryption**: All manifests inherit your bucket's encryption settings
- **Audit trail**: Complete log of who deployed what and when
- **No secrets**: Manifests don't contain sensitive information

## Troubleshooting

### Bucket Not Found Error
```bash
# Check if bucket exists
aws s3 ls s3://your-bucket-name/

# Verify bucket name in secrets
./scripts/deployment-tracker.sh status --env dev --bucket your-actual-bucket-name
```

### Permission Errors
```bash
# Check your AWS credentials
aws sts get-caller-identity

# Verify S3 permissions
aws s3 ls s3://your-bucket/deployments/
```

### Missing Deployment History
```bash
# Check if deployments directory exists
aws s3 ls s3://your-bucket/deployments/

# Look for any manifest files
aws s3 ls s3://your-bucket/ --recursive | grep manifest
```

## Advanced Usage

### Custom Bucket Override
```bash
./scripts/deployment-tracker.sh latest --env dev --bucket my-custom-bucket
```

### Integration with Other Tools
```bash
# Export to monitoring system
./scripts/deployment-tracker.sh latest --env prod --json | \
  curl -X POST -H "Content-Type: application/json" \
  -d @- https://monitoring.example.com/deployments
```

### Automated Reports
```bash
#!/bin/bash
# Daily deployment report
echo "Deployment Report for $(date)"
./scripts/deployment-tracker.sh history --env prod --limit 5
./scripts/deployment-tracker.sh history --env dev --limit 5
```

This deployment tracking system provides complete visibility into your infrastructure deployments while leveraging your existing S3 infrastructure efficiently. 