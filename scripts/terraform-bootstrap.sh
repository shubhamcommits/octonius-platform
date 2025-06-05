#!/bin/bash
set -euo pipefail

# Terraform Bootstrap Script for Dynamic Configuration
# This script creates S3 bucket, DynamoDB table, and backend config files
# Following naming convention: {environment}-{project}-{resource}-{region}

# Configuration
PROJECT_NAME="octonius"
AWS_REGION="eu-central-1"
DEFAULT_ENVIRONMENT="dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS: $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

show_help() {
    cat << EOF
🏗️  Terraform Bootstrap Script (Dynamic Configuration)

This script creates the necessary AWS resources for Terraform state management:
- S3 bucket for storing Terraform state files
- DynamoDB table for state locking
- Backend configuration files for dynamic environment switching

Usage:
    $0 [OPTIONS]

Options:
    -e, --environment   Environment (dev, prod, staging, etc.) [default: dev]
    -r, --region        AWS region [default: eu-central-1]
    -p, --project       Project name [default: octonius]
    -h, --help          Show this help message
    --dry-run           Show what would be created without actually creating it
    --config-only       Only generate config files, don't create AWS resources

Examples:
    $0                              # Bootstrap dev environment
    $0 -e prod                      # Bootstrap prod environment
    $0 -e dev --dry-run            # Show what would be created for dev
    $0 -e staging --config-only    # Only generate config files for staging

Created Resources:
    • S3 Bucket: {env}-{project}-platform-terraform-state-{region}
    • DynamoDB: {env}-{project}-platform-terraform-locks
    • Backend Config: terraform/config/{env}.backend.hcl
    • Variables File: terraform/config/{env}.tfvars (if doesn't exist)

EOF
}

check_aws_cli() {
    if [[ "$DRY_RUN" == "true" || "$CONFIG_ONLY" == "true" ]]; then
        log_info "[SKIP] AWS CLI check (dry-run or config-only mode)"
        return 0
    fi
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI is not configured or credentials are invalid."
        exit 1
    fi
    
    log_success "AWS CLI is configured and working"
}

create_s3_bucket() {
    local bucket_name="$1"
    local region="$2"
    
    log_info "Creating S3 bucket: $bucket_name"
    
    if [[ "$CONFIG_ONLY" == "true" ]]; then
        log_info "[CONFIG-ONLY] Skipping S3 bucket creation"
        return 0
    fi
    
    if aws s3api head-bucket --bucket "$bucket_name" 2>/dev/null; then
        log_warning "S3 bucket $bucket_name already exists"
        return 0
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would create S3 bucket: $bucket_name in $region"
        return 0
    fi
    
    # Create bucket
    if [[ "$region" == "us-east-1" ]]; then
        aws s3api create-bucket --bucket "$bucket_name" --region "$region"
    else
        aws s3api create-bucket --bucket "$bucket_name" --region "$region" \
            --create-bucket-configuration LocationConstraint="$region"
    fi
    
    # Enable versioning
    aws s3api put-bucket-versioning --bucket "$bucket_name" \
        --versioning-configuration Status=Enabled
    
    # Enable encryption
    aws s3api put-bucket-encryption --bucket "$bucket_name" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'
    
    # Block public access
    aws s3api put-public-access-block --bucket "$bucket_name" \
        --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
    
    # Add lifecycle policy
    aws s3api put-bucket-lifecycle-configuration --bucket "$bucket_name" \
        --lifecycle-configuration '{
            "Rules": [{
                "ID": "terraform-state-lifecycle",
                "Status": "Enabled",
                "NoncurrentVersionTransitions": [{
                    "NoncurrentDays": 30,
                    "StorageClass": "STANDARD_IA"
                }, {
                    "NoncurrentDays": 60,
                    "StorageClass": "GLACIER"
                }],
                "NoncurrentVersionExpiration": {
                    "NoncurrentDays": 90
                }
            }]
        }'
    
    log_success "S3 bucket $bucket_name created and configured"
}

create_dynamodb_table() {
    local table_name="$1"
    
    log_info "Creating DynamoDB table: $table_name"
    
    if [[ "$CONFIG_ONLY" == "true" ]]; then
        log_info "[CONFIG-ONLY] Skipping DynamoDB table creation"
        return 0
    fi
    
    if aws dynamodb describe-table --table-name "$table_name" &>/dev/null; then
        log_warning "DynamoDB table $table_name already exists"
        return 0
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would create DynamoDB table: $table_name"
        return 0
    fi
    
    aws dynamodb create-table \
        --table-name "$table_name" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --tags Key=Environment,Value="$ENVIRONMENT" \
               Key=Project,Value="$PROJECT_NAME" \
               Key=ManagedBy,Value=Terraform \
               Key=Purpose,Value=StateLocking
    
    log_info "Waiting for DynamoDB table to be active..."
    aws dynamodb wait table-exists --table-name "$table_name"
    
    log_success "DynamoDB table $table_name created"
}

create_backend_config() {
    local bucket_name="$1"
    local table_name="$2"
    local config_file="terraform/config/$ENVIRONMENT.backend.hcl"
    
    log_info "Creating backend configuration: $config_file"
    
    # Create config directory if it doesn't exist
    mkdir -p "terraform/config"
    
    # Capitalize first letter of environment (compatible with older bash)
    local env_cap="$(echo "${ENVIRONMENT:0:1}" | tr '[:lower:]' '[:upper:]')${ENVIRONMENT:1}"
    
    # Create backend config file
    cat > "$config_file" << EOF
# $env_cap Environment Backend Configuration
# Used with: terraform init -backend-config=config/$ENVIRONMENT.backend.hcl

bucket         = "$bucket_name"
key            = "$ENVIRONMENT/terraform.tfstate"
region         = "$AWS_REGION"
encrypt        = true
dynamodb_table = "$table_name"
EOF
    
    log_success "Backend config created: $config_file"
}

create_tfvars_template() {
    local tfvars_file="terraform/config/$ENVIRONMENT.tfvars"
    
    if [[ -f "$tfvars_file" ]]; then
        log_warning "Variables file already exists: $tfvars_file"
        return 0
    fi
    
    log_info "Creating variables template: $tfvars_file"
    
    # Capitalize first letter of environment (compatible with older bash)
    local env_cap="$(echo "${ENVIRONMENT:0:1}" | tr '[:lower:]' '[:upper:]')${ENVIRONMENT:1}"
    
    # Create environment-specific defaults
    case "$ENVIRONMENT" in
        "prod")
            VPC_CIDR="10.1.0.0/16"
            PUBLIC_SUBNETS='["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]'
            PRIVATE_SUBNETS='["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]'
            SINGLE_NAT="false"
            ;;
        "staging")
            VPC_CIDR="10.2.0.0/16"
            PUBLIC_SUBNETS='["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]'
            PRIVATE_SUBNETS='["10.2.11.0/24", "10.2.12.0/24", "10.2.13.0/24"]'
            SINGLE_NAT="true"
            ;;
        *)  # dev and others
            VPC_CIDR="10.0.0.0/16"
            PUBLIC_SUBNETS='["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]'
            PRIVATE_SUBNETS='["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]'
            SINGLE_NAT="true"
            ;;
    esac
    
    # Create tfvars file
    cat > "$tfvars_file" << EOF
# $env_cap Environment Variables
# Used with: terraform plan -var-file=config/$ENVIRONMENT.tfvars

environment = "$ENVIRONMENT"

# VPC Configuration
vpc_cidr        = "$VPC_CIDR"
public_subnets  = $PUBLIC_SUBNETS
private_subnets = $PRIVATE_SUBNETS

# NAT Gateway configuration
single_nat_gateway = $SINGLE_NAT
EOF
    
    log_success "Variables template created: $tfvars_file"
}

show_summary() {
    local bucket_name="$1"
    local table_name="$2"
    
    cat << EOF

🎉 Dynamic Terraform Bootstrap Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Environment: $ENVIRONMENT
✅ Project: $PROJECT_NAME
✅ Region: $AWS_REGION

📦 Created Resources:
   • S3 Bucket: $bucket_name
   • DynamoDB: $table_name
   • Backend Config: terraform/config/$ENVIRONMENT.backend.hcl
   • Variables File: terraform/config/$ENVIRONMENT.tfvars

🚀 Next Steps:
   cd terraform
   terraform init -backend-config=config/$ENVIRONMENT.backend.hcl
   terraform plan -var-file=config/$ENVIRONMENT.tfvars
   terraform apply

💡 Pipeline Usage:
   The GitHub Actions workflow will automatically:
   1. Detect environment from branch (main=prod, others=dev)
   2. Use config/$ENVIRONMENT.backend.hcl for backend
   3. Use config/$ENVIRONMENT.tfvars for variables
   4. Deploy with: $ENVIRONMENT-octonius-*

🎯 Environment Detection:
   • main branch → prod environment
   • feature branches → dev environment  
   • manual dispatch → choose environment

EOF
}

# Parse command line arguments
ENVIRONMENT="$DEFAULT_ENVIRONMENT"
DRY_RUN="false"
CONFIG_ONLY="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--region)
            AWS_REGION="$2"
            shift 2
            ;;
        -p|--project)
            PROJECT_NAME="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --config-only)
            CONFIG_ONLY="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Generate resource names
BUCKET_NAME="${ENVIRONMENT}-${PROJECT_NAME}-platform-terraform-state-${AWS_REGION}"
TABLE_NAME="${ENVIRONMENT}-${PROJECT_NAME}-platform-terraform-locks"

# Main execution
main() {
    log_info "Starting Terraform bootstrap for $ENVIRONMENT environment"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY-RUN MODE: No resources will be created"
    elif [[ "$CONFIG_ONLY" == "true" ]]; then
        log_warning "CONFIG-ONLY MODE: Only generating configuration files"
    fi
    
    check_aws_cli
    
    # Always create config files
    create_backend_config "$BUCKET_NAME" "$TABLE_NAME"
    create_tfvars_template
    
    # Create AWS resources unless in config-only mode
    if [[ "$CONFIG_ONLY" != "true" ]]; then
        create_s3_bucket "$BUCKET_NAME" "$AWS_REGION"
        create_dynamodb_table "$TABLE_NAME"
    fi
    
    if [[ "$DRY_RUN" == "false" ]]; then
        show_summary "$BUCKET_NAME" "$TABLE_NAME"
    else
        log_info "[DRY-RUN] Bootstrap simulation completed"
    fi
}

main "$@" 