#!/bin/bash

# IAM Policy Creation Script
# Creates or updates CDK IAM policies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Input parameters
ENVIRONMENT=$1
AWS_ACCOUNT_ID=$2

if [[ -z "$ENVIRONMENT" || -z "$AWS_ACCOUNT_ID" ]]; then
    echo "Usage: $0 <environment> <aws-account-id>"
    exit 1
fi

echo "🔐 Creating/updating IAM policies for $ENVIRONMENT environment..."

# Function to create or update a policy
create_or_update_policy() {
    local policy_name=$1
    local policy_file=$2
    local description=$3
    local account_id="$AWS_ACCOUNT_ID"
    local expected_policy_arn="arn:aws:iam::${account_id}:policy/${policy_name}"

    echo "🔄 Processing policy: $policy_name"

    if aws iam get-policy --policy-arn ${expected_policy_arn} > /dev/null 2>&1; then
        echo "  📝 Policy exists, updating..."
        
        # Clean up old versions if needed
        POLICY_VERSIONS_JSON=$(aws iam list-policy-versions --policy-arn "${expected_policy_arn}")
        VERSION_COUNT=$(echo "${POLICY_VERSIONS_JSON}" | jq '.Versions | length')

        if [ "${VERSION_COUNT}" -ge 5 ]; then
            OLDEST_NON_DEFAULT_VERSION_ID=$(echo "${POLICY_VERSIONS_JSON}" | \
                jq -r '.Versions | sort_by(.CreateDate) | map(select(.IsDefaultVersion == false)) | .[0].VersionId // null')

            if [ -n "${OLDEST_NON_DEFAULT_VERSION_ID}" ] && [ "${OLDEST_NON_DEFAULT_VERSION_ID}" != "null" ] && [ "${OLDEST_NON_DEFAULT_VERSION_ID}" != "" ]; then
                echo "  🗑️  Removing oldest policy version: ${OLDEST_NON_DEFAULT_VERSION_ID}"
                aws iam delete-policy-version --policy-arn "${expected_policy_arn}" --version-id "${OLDEST_NON_DEFAULT_VERSION_ID}"
            fi
        fi

        aws iam create-policy-version --policy-arn "${expected_policy_arn}" --policy-document file://${policy_file} --set-as-default
        echo "  ✅ Policy updated: $policy_name"
    else
        echo "  🆕 Creating new policy..."
        aws iam create-policy --policy-name ${policy_name} --policy-document file://${policy_file} --description "${description}"
        echo "  ✅ Policy created: $policy_name"
    fi
    
    echo "${expected_policy_arn}"
}

# Create/update all policies
echo "🚀 Starting policy creation process..."

BASE_POLICY_ARN=$(create_or_update_policy "${ENVIRONMENT}-cdk-base-policy" "processed-policies/cdk-base-policy.json" "Base policy for CDK operations")
CLOUDFORMATION_POLICY_ARN=$(create_or_update_policy "${ENVIRONMENT}-cdk-cloudformation-policy" "processed-policies/cdk-cloudformation-policy.json" "CloudFormation policy for CDK operations")
S3_POLICY_ARN=$(create_or_update_policy "${ENVIRONMENT}-cdk-s3-policy" "processed-policies/cdk-s3-policy.json" "S3 policy for CDK operations")
IAM_POLICY_ARN=$(create_or_update_policy "${ENVIRONMENT}-cdk-iam-policy" "processed-policies/cdk-iam-policy.json" "IAM policy for CDK operations")
SERVICES_POLICY_ARN=$(create_or_update_policy "${ENVIRONMENT}-cdk-services-policy" "processed-policies/cdk-services-policy.json" "Services policy for CDK operations")
NETWORK_POLICY_ARN=$(create_or_update_policy "${ENVIRONMENT}-cdk-network-policy" "processed-policies/cdk-network-policy.json" "Network policy for CDK operations")

# Combine all policy ARNs
POLICY_ARNS="${BASE_POLICY_ARN},${CLOUDFORMATION_POLICY_ARN},${S3_POLICY_ARN},${IAM_POLICY_ARN},${SERVICES_POLICY_ARN},${NETWORK_POLICY_ARN}"

echo "✅ All policies processed successfully"
echo "📋 Policy ARNs: ${POLICY_ARNS}"

# Output the policy ARNs for GitHub Actions to capture
echo "POLICY_ARNS=${POLICY_ARNS}" 