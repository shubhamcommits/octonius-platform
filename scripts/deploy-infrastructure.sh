#!/bin/bash

# Octonius Infrastructure Deployment Script
# Handles CDK bootstrap, deployment, and tracking

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
ENVIRONMENT=""
AWS_REGION="eu-central-1"
APP_NAME="octonius"
SKIP_BOOTSTRAP=false
DRY_RUN=false
VERBOSE=false

# Help function
show_help() {
    cat << EOF
Octonius Infrastructure Deployment Script

USAGE:
    $0 --env <environment> [options]

REQUIRED:
    --env <dev|prod>        Environment to deploy

OPTIONS:
    --region <region>       AWS region (default: eu-central-1)
    --app-name <name>       Application name (default: octonius)
    --skip-bootstrap        Skip CDK bootstrap step
    --dry-run              Show what would be done without executing
    --verbose              Enable verbose logging
    --help                 Show this help

EXAMPLES:
    $0 --env dev                          # Deploy to dev environment
    $0 --env prod --region us-east-1      # Deploy to prod in different region
    $0 --env dev --skip-bootstrap         # Deploy without bootstrap
    $0 --env dev --dry-run               # Preview deployment

ENVIRONMENT VARIABLES:
    AWS_ACCOUNT_ID         AWS Account ID (required)
    AWS_REGION             AWS Region (can override --region)
    NODE_ENV               Environment (can override --env)
    DEV_S3_BUCKET          Development deployment bucket name
                           (default: dev-octonius-platform-deployment-bucket-eu-central-1)
    PROD_S3_BUCKET         Production deployment bucket name
                           (default: prod-octonius-platform-deployment-bucket-eu-central-1)
    AWS_CDK_POLICY_ARN_FROM_FILE  Comma-separated list of policy ARNs

EOF
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[VERBOSE]${NC} $1"
    fi
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --region)
            AWS_REGION="$2"
            shift 2
            ;;
        --app-name)
            APP_NAME="$2"
            shift 2
            ;;
        --skip-bootstrap)
            SKIP_BOOTSTRAP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "$ENVIRONMENT" ]]; then
    log_error "Environment is required (--env dev|prod)"
    show_help
    exit 1
fi

# Override with environment variables if present
AWS_REGION="${AWS_REGION:-eu-central-1}"
ENVIRONMENT="${NODE_ENV:-$ENVIRONMENT}"

# Validate required environment variables
if [[ -z "$AWS_ACCOUNT_ID" ]]; then
    log_error "AWS_ACCOUNT_ID environment variable is required"
    exit 1
fi

log_info "Starting Octonius Infrastructure Deployment"
log_info "Environment: $ENVIRONMENT"
log_info "Region: $AWS_REGION"
log_info "App Name: $APP_NAME"
log_info "Account: $AWS_ACCOUNT_ID"

if [[ "$DRY_RUN" == "true" ]]; then
    log_warning "DRY RUN MODE - No actual changes will be made"
fi

# Determine bootstrap bucket
determine_bootstrap_bucket() {
    local bootstrap_bucket=""
    
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        bootstrap_bucket="${DEV_S3_BUCKET}"
    elif [[ "$ENVIRONMENT" == "prod" ]]; then
        bootstrap_bucket="${PROD_S3_BUCKET}"
    fi
    
    if [[ -z "$bootstrap_bucket" ]]; then
        log_warning "No S3 bucket specified for $ENVIRONMENT environment" >&2
        log_info "CDK will create an auto-generated bucket" >&2
        echo ""
    else
        log_info "Using bootstrap bucket: $bootstrap_bucket" >&2
        echo "$bootstrap_bucket"
    fi
}

# Clean up failed CDK stacks
cleanup_failed_stack() {
    log_info "Checking for existing CDKToolkit stack..."
    
    local stack_status
    stack_status=$(aws cloudformation describe-stacks --stack-name CDKToolkit --region "$AWS_REGION" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [[ "$stack_status" == "NOT_FOUND" ]]; then
        log_verbose "No existing CDKToolkit stack found"
        return 0
    fi
    
    log_info "Found CDKToolkit stack in state: $stack_status"
    
    case $stack_status in
        "CREATE_COMPLETE"|"UPDATE_COMPLETE")
            log_success "CDKToolkit stack is healthy"
            return 0
            ;;
        "ROLLBACK_COMPLETE"|"CREATE_FAILED"|"UPDATE_FAILED"|"UPDATE_ROLLBACK_COMPLETE")
            log_warning "CDKToolkit stack is in failed state: $stack_status"
            
            if [[ "$DRY_RUN" == "true" ]]; then
                log_info "DRY RUN: Would delete failed CDKToolkit stack"
                return 0
            fi
            
            log_info "Deleting failed CDKToolkit stack..."
            aws cloudformation delete-stack --stack-name CDKToolkit --region "$AWS_REGION"
            
            log_info "Waiting for stack deletion to complete..."
            aws cloudformation wait stack-delete-complete --stack-name CDKToolkit --region "$AWS_REGION"
            log_success "CDKToolkit stack deleted successfully"
            ;;
        *)
            log_warning "CDKToolkit stack in unknown state: $stack_status"
            ;;
    esac
}

# Bootstrap CDK with error handling
bootstrap_cdk() {
    if [[ "$SKIP_BOOTSTRAP" == "true" ]]; then
        log_info "Skipping CDK bootstrap as requested"
        return 0
    fi
    
    log_info "Starting CDK bootstrap process..."
    
    # Clean up any failed stacks first
    cleanup_failed_stack
    
    # Determine bootstrap bucket
    local bootstrap_bucket
    bootstrap_bucket=$(determine_bootstrap_bucket)
    
    # Export the bucket for use by other functions (even in dry-run)
    export BOOTSTRAP_BUCKET="$bootstrap_bucket"
    
    # Prepare simplified tags for ECR compatibility
    local simple_tags="Environment=$ENVIRONMENT,Project=$APP_NAME,ManagedBy=CDK,Owner=Octonius-Team"
    log_verbose "Using tags: $simple_tags"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would bootstrap CDK with bucket: ${bootstrap_bucket:-auto-generated}"
        return 0
    fi
    
    # Validate CDK policies
    if [[ -z "$AWS_CDK_POLICY_ARN_FROM_FILE" ]]; then
        log_error "AWS_CDK_POLICY_ARN_FROM_FILE environment variable is required"
        log_error "This should contain comma-separated policy ARNs"
        exit 1
    fi
    
    local bootstrap_success=false
    
    # Try bootstrap with existing bucket first
    if [[ -n "$bootstrap_bucket" ]] && aws s3 ls "s3://$bootstrap_bucket" >/dev/null 2>&1; then
        log_info "Bucket $bootstrap_bucket exists, attempting bootstrap with existing bucket..."
        
        if cdk bootstrap \
            --cloudformation-execution-policies "$AWS_CDK_POLICY_ARN_FROM_FILE" \
            --bootstrap-bucket-name "$bootstrap_bucket" \
            --bootstrap-kms-key-id alias/aws/s3 \
            --tags "$simple_tags" \
            --force; then
            
            bootstrap_success=true
            log_success "Bootstrap successful with existing bucket: $bootstrap_bucket"
        else
            log_warning "Bootstrap with existing bucket failed, will try fallback approach"
        fi
    fi
    
    # Fallback: Let CDK create its own bucket
    if [[ "$bootstrap_success" != "true" ]]; then
        log_info "Using CDK auto-generated bucket approach..."
        
        # Clean up any failed attempt first
        cleanup_failed_stack
        
        if cdk bootstrap \
            --cloudformation-execution-policies "$AWS_CDK_POLICY_ARN_FROM_FILE" \
            --bootstrap-kms-key-id alias/aws/s3 \
            --tags "$simple_tags"; then
            
            # Get the auto-created bucket name
            bootstrap_bucket=$(aws cloudformation describe-stack-resources \
                --stack-name CDKToolkit \
                --logical-resource-id StagingBucket \
                --region "$AWS_REGION" \
                --query 'StackResources[0].PhysicalResourceId' \
                --output text)
                
            # Update the exported variable
            export BOOTSTRAP_BUCKET="$bootstrap_bucket"
            log_success "Bootstrap successful with CDK-generated bucket: $bootstrap_bucket"
        else
            log_error "CDK bootstrap failed completely"
            exit 1
        fi
    fi
    
    log_info "Using bootstrap bucket: $BOOTSTRAP_BUCKET"
}

# Create deployment tracking manifest
create_deployment_manifest() {
    if [[ -z "$BOOTSTRAP_BUCKET" ]]; then
        log_warning "No bootstrap bucket available, skipping deployment tracking"
        return 0
    fi
    
    local deployment_id="deploy-$(date +%Y%m%d-%H%M%S)-${GITHUB_SHA:-local}"
    export DEPLOYMENT_ID="$deployment_id"
    
    log_info "Creating deployment manifest: $deployment_id"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would create deployment manifest in s3://$BOOTSTRAP_BUCKET/deployments/"
        return 0
    fi
    
    # Create deployment manifest
    cat > "$PROJECT_ROOT/deployment-manifest.json" << EOF
{
  "deploymentId": "$deployment_id",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "environment": "$ENVIRONMENT",
  "gitCommit": "${GITHUB_SHA:-unknown}",
  "gitRef": "${GITHUB_REF:-unknown}",
  "gitActor": "${GITHUB_ACTOR:-$(whoami)}",
  "runId": "${GITHUB_RUN_ID:-local}",
  "runNumber": "${GITHUB_RUN_NUMBER:-1}",
  "workflowName": "${GITHUB_WORKFLOW:-Manual Deployment}",
  "cdkVersion": "$(cdk --version 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$(node --version 2>/dev/null || echo 'unknown')",
  "awsRegion": "$AWS_REGION",
  "awsAccount": "$AWS_ACCOUNT_ID",
  "appName": "$APP_NAME",
  "bootstrapBucket": "$BOOTSTRAP_BUCKET",
  "status": "deploying"
}
EOF
    
    # Upload deployment manifest
    aws s3 cp "$PROJECT_ROOT/deployment-manifest.json" "s3://$BOOTSTRAP_BUCKET/deployments/$deployment_id/manifest.json"
    aws s3 cp "$PROJECT_ROOT/deployment-manifest.json" "s3://$BOOTSTRAP_BUCKET/deployments/latest-$ENVIRONMENT.json"
    
    log_success "Deployment manifest created: $deployment_id"
}

# Deploy CDK stacks
deploy_cdk() {
    log_info "Starting CDK deployment..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would deploy CDK stacks"
        export DEPLOYMENT_STATUS="dry-run-success"
        return 0
    fi
    
    # Set environment for CDK
    export NODE_ENV="$ENVIRONMENT"
    
    # Deploy all stacks
    if cdk deploy --all --require-approval never; then
        log_success "CDK deployment completed successfully"
        export DEPLOYMENT_STATUS="success"
    else
        log_error "CDK deployment failed"
        export DEPLOYMENT_STATUS="failed"
        return 1
    fi
}

# Update deployment status
update_deployment_status() {
    if [[ -z "$BOOTSTRAP_BUCKET" || -z "$DEPLOYMENT_ID" ]]; then
        log_verbose "No deployment tracking available, skipping status update"
        return 0
    fi
    
    local deployment_status="${DEPLOYMENT_STATUS:-failed}"
    
    # In dry-run mode, show cleaner status
    if [[ "$DRY_RUN" == "true" ]]; then
        if [[ "$deployment_status" == "dry-run-success" ]]; then
            log_info "DRY RUN: Would update deployment status to: success"
        else
            log_info "DRY RUN: Would update deployment status to: $deployment_status"
        fi
        return 0
    fi
    
    log_info "Updating deployment status: $deployment_status"
    
    # Get list of deployed stacks
    local deployed_stacks
    deployed_stacks=$(aws cloudformation list-stacks \
        --region "$AWS_REGION" \
        --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
        --query "StackSummaries[?contains(StackName, \`$APP_NAME\`)].[StackName]" \
        --output text | tr '\n' ',' | sed 's/,$//')
    
    # Create final deployment manifest
    cat > "$PROJECT_ROOT/final-deployment-manifest.json" << EOF
{
  "deploymentId": "$DEPLOYMENT_ID",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "completedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "environment": "$ENVIRONMENT",
  "gitCommit": "${GITHUB_SHA:-unknown}",
  "gitRef": "${GITHUB_REF:-unknown}",
  "gitActor": "${GITHUB_ACTOR:-$(whoami)}",
  "runId": "${GITHUB_RUN_ID:-local}",
  "runNumber": "${GITHUB_RUN_NUMBER:-1}",
  "workflowName": "${GITHUB_WORKFLOW:-Manual Deployment}",
  "cdkVersion": "$(cdk --version 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$(node --version 2>/dev/null || echo 'unknown')",
  "awsRegion": "$AWS_REGION",
  "awsAccount": "$AWS_ACCOUNT_ID",
  "appName": "$APP_NAME",
  "bootstrapBucket": "$BOOTSTRAP_BUCKET",
  "status": "$deployment_status",
  "deployedStacks": "$deployed_stacks",
  "duration": "N/A"
}
EOF
    
    # Upload final manifest
    aws s3 cp "$PROJECT_ROOT/final-deployment-manifest.json" "s3://$BOOTSTRAP_BUCKET/deployments/$DEPLOYMENT_ID/final-manifest.json"
    
    # Update latest pointer if successful
    if [[ "$deployment_status" == "success" ]]; then
        aws s3 cp "$PROJECT_ROOT/final-deployment-manifest.json" "s3://$BOOTSTRAP_BUCKET/deployments/latest-$ENVIRONMENT-success.json"
    fi
    
    # Create deployment history entry
    aws s3 cp "$PROJECT_ROOT/final-deployment-manifest.json" "s3://$BOOTSTRAP_BUCKET/deployments/history/$(date +%Y/%m/%d)/$DEPLOYMENT_ID.json"
    
    log_success "Deployment tracking completed: $deployment_status"
}

# Main deployment function
main() {
    local start_time
    start_time=$(date +%s)
    
    # Ensure we're in the project root
    cd "$PROJECT_ROOT"
    
    # Validate AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS credentials not configured or invalid"
        log_error "Please run 'aws configure' or set up your AWS credentials"
        exit 1
    fi
    
    # Validate CDK is available
    if ! command -v cdk >/dev/null 2>&1; then
        log_error "CDK CLI not found. Please install AWS CDK"
        exit 1
    fi
    
    # Build the project
    log_info "Building project..."
    if [[ "$DRY_RUN" != "true" ]]; then
        npm run build
    fi
    
    # Execute deployment steps
    bootstrap_cdk
    create_deployment_manifest
    
    # Set trap to update status on exit
    trap 'update_deployment_status' EXIT
    
    deploy_cdk
    
    local end_time duration
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    log_success "Deployment completed in ${duration} seconds"
}

# Run main function
main "$@" 