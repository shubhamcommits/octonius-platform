# CDK Bootstrap Assets Bucket Options

This document explains your options for customizing the CDK bootstrap assets bucket instead of using the default auto-generated bucket like `cdk-hnb659fds-assets-566545930933-eu-central-1`.

## Current Default Behavior

CDK automatically creates a bucket with this naming pattern:
```
cdk-[hash]-assets-[account-id]-[region]
```

## Available Customization Options

### Option 1: Use Existing Application Buckets ⭐ **RECOMMENDED**

**Benefits:**
- ✅ Resource consolidation (fewer buckets to manage)
- ✅ Consistent with your existing naming convention
- ✅ Leverages existing bucket policies and configurations
- ✅ Easier cost tracking (all assets in one place)

**Implementation:**
```bash
# In your bootstrap command:
cdk bootstrap --bootstrap-bucket-name "${EXISTING_BUCKET_NAME}"
```

**Example from your workflow:**
```bash
BOOTSTRAP_BUCKET="${{ secrets.DEV_S3_BUCKET }}"  # or PROD_S3_BUCKET
cdk bootstrap --bootstrap-bucket-name "${BOOTSTRAP_BUCKET}"
```

**Requirements:**
- Bucket must exist before bootstrapping
- Bucket must have proper versioning enabled
- CDK role needs appropriate permissions

---

### Option 2: Custom Named Bootstrap Bucket

**Benefits:**
- ✅ Follows your naming convention
- ✅ Predictable bucket names
- ✅ Environment separation
- ✅ Easy to identify in AWS console

**Implementation:**
```bash
CUSTOM_BUCKET_NAME="dev-octonius-cdk-assets-566545930933-eu-central-1"
cdk bootstrap --bootstrap-bucket-name "${CUSTOM_BUCKET_NAME}"
```

**Naming Pattern:**
```
${environment}-${app_name}-cdk-assets-${account_id}-${region}
```

---

### Option 3: Custom Bootstrap Template

**Benefits:**
- ✅ Full control over bootstrap resources
- ✅ Can customize bucket properties (encryption, lifecycle, etc.)
- ✅ Can add additional resources

**Implementation:**
1. Create custom bootstrap template
2. Deploy with: `cdk bootstrap --template custom-bootstrap.yaml`

**Advanced Option:** Best for complex requirements

---

### Option 4: Multiple Environment Buckets

**Benefits:**
- ✅ Complete environment isolation
- ✅ Different policies per environment
- ✅ Separate cost tracking

**Implementation:**
```bash
# Development
cdk bootstrap --bootstrap-bucket-name "dev-octonius-cdk-assets-566545930933-eu-central-1"

# Production  
cdk bootstrap --bootstrap-bucket-name "prod-octonius-cdk-assets-566545930933-eu-central-1"
```

## Comparison Table

| Option | Resource Count | Complexity | Control | Recommended For |
|--------|----------------|------------|---------|-----------------|
| **Existing Buckets** | Minimal | Low | Medium | Most projects |
| **Custom Named** | Medium | Low | Medium | Clear naming needs |
| **Custom Template** | Variable | High | High | Complex requirements |
| **Multiple Env** | High | Medium | High | Strict isolation |

## Implementation in Your Project

Your current configuration is set to use **Option 1** (existing buckets):

```yaml
# In .github/workflows/provision-aws-infrastructure.yml
if [ "${{ inputs.environment }}" = "dev" ]; then
  BOOTSTRAP_BUCKET="${{ secrets.DEV_S3_BUCKET }}"
else
  BOOTSTRAP_BUCKET="${{ secrets.PROD_S3_BUCKET }}"
fi

cdk bootstrap --bootstrap-bucket-name "${BOOTSTRAP_BUCKET}"
```

## Required Bucket Configuration

Whichever option you choose, ensure your bucket has:

### Essential Settings:
```json
{
  "versioned": true,
  "encryption": "S3_MANAGED", 
  "blockPublicAccess": "BLOCK_ALL",
  "lifecycle": {
    "oldVersionExpiration": "90 days"
  }
}
```

### Required Permissions:
Your S3 policy already includes the necessary permissions:
```json
"Resource": [
  "arn:aws:s3:::cdk-*",
  "arn:aws:s3:::cdk-*/*",
  "arn:aws:s3:::octonius-*",
  "arn:aws:s3:::octonius-*/*"
]
```

## Migration Steps

To switch from the auto-generated bucket to your preferred option:

1. **Choose your option** (Option 1 recommended)
2. **Update the workflow** (already done)
3. **Delete old bootstrap** (optional):
   ```bash
   aws cloudformation delete-stack --stack-name CDKToolkit
   ```
4. **Re-bootstrap** with new configuration
5. **Redeploy** your stacks

## Cost Considerations

- **Option 1**: Lowest cost (shared bucket)
- **Option 2**: Medium cost (dedicated bucket per environment)  
- **Option 3**: Variable cost (depends on template)
- **Auto-generated**: Medium cost (CDK-managed lifecycle)

## Security Considerations

- Use KMS encryption: `--bootstrap-kms-key-id alias/aws/s3`
- Enable access logging for audit trails
- Apply least-privilege access policies
- Regular security scans of bucket contents

## Rollback Plan

If issues arise, you can always revert to the default behavior:

```bash
# Remove custom bucket parameters
cdk bootstrap --cloudformation-execution-policies "${POLICIES}"
```

This will recreate the auto-generated bucket. 