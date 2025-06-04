#!/bin/bash

# CDK Bootstrap Cleanup Script
# Cleans up failed CDKToolkit stacks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
REGION="eu-central-1"
STACK_NAME="CDKToolkit"

# Help function
show_help() {
    cat << EOF
CDK Bootstrap Cleanup Script

This script helps clean up failed CDK bootstrap stacks that are stuck in 
ROLLBACK_COMPLETE, CREATE_FAILED, or other failed states.

USAGE:
    $0 [options]

OPTIONS:
    --region <region>      AWS region (default: eu-central-1)
    --stack-name <name>    CDK stack name (default: CDKToolkit)
    --force                Skip confirmation prompts
    --dry-run              Show what would be done without executing
    -h, --help             Show this help

EXAMPLES:
    $0                                    # Clean up CDKToolkit in eu-central-1
    $0 --region us-east-1                # Clean up in different region
    $0 --force                           # Skip confirmations
    $0 --dry-run                         # Preview actions

EOF
}

# Parse arguments
FORCE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --region)
            REGION="$2"
            shift 2
            ;;
        --stack-name)
            STACK_NAME="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
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

echo -e "${BLUE}CDK Bootstrap Cleanup Script${NC}"
echo "Region: $REGION"
echo "Stack Name: $STACK_NAME"
echo ""

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed or not in PATH${NC}"
    exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}Error: AWS credentials not configured or invalid${NC}"
    echo "Please run 'aws configure' or set up your AWS credentials"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS credentials OK (Account: $ACCOUNT_ID)${NC}"

# Check if stack exists
echo "Checking for CDK stack..."
STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")

if [[ "$STACK_STATUS" == "NOT_FOUND" ]]; then
    echo -e "${GREEN}✓ No CDK stack found. Nothing to clean up.${NC}"
    exit 0
fi

echo -e "${YELLOW}Found CDK stack in state: $STACK_STATUS${NC}"

# Determine action based on stack status
case $STACK_STATUS in
    "CREATE_COMPLETE"|"UPDATE_COMPLETE"|"UPDATE_ROLLBACK_COMPLETE")
        echo -e "${GREEN}✓ Stack is in a healthy state. No cleanup needed.${NC}"
        exit 0
        ;;
    "ROLLBACK_COMPLETE"|"CREATE_FAILED"|"UPDATE_FAILED"|"DELETE_FAILED")
        ACTION="delete"
        echo -e "${YELLOW}⚠ Stack is in a failed state and needs to be deleted${NC}"
        ;;
    "CREATE_IN_PROGRESS"|"UPDATE_IN_PROGRESS"|"DELETE_IN_PROGRESS")
        ACTION="wait"
        echo -e "${YELLOW}⚠ Stack operation is in progress. Will wait for completion...${NC}"
        ;;
    *)
        echo -e "${RED}❌ Unknown stack status: $STACK_STATUS${NC}"
        echo "Please check the stack manually in the AWS Console"
        exit 1
        ;;
esac

# Show what we'll do
if [[ "$ACTION" == "delete" ]]; then
    echo ""
    echo -e "${BLUE}Planned Actions:${NC}"
    echo "1. Delete CloudFormation stack: $STACK_NAME"
    echo "2. Wait for deletion to complete"
    echo "3. Verify cleanup"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "\n${YELLOW}DRY RUN: Would execute the above actions${NC}"
        exit 0
    fi
    
    # Confirmation
    if [[ "$FORCE" != "true" ]]; then
        echo ""
        read -p "Do you want to proceed? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Cancelled."
            exit 0
        fi
    fi
    
    # Delete the stack
    echo -e "\n${BLUE}Deleting CDK stack...${NC}"
    aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$REGION"
    
    echo "Waiting for stack deletion to complete..."
    if aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$REGION"; then
        echo -e "${GREEN}✓ CDK stack deleted successfully${NC}"
    else
        echo -e "${RED}❌ Stack deletion failed or timed out${NC}"
        echo "Please check the CloudFormation console for details"
        exit 1
    fi

elif [[ "$ACTION" == "wait" ]]; then
    echo -e "\n${BLUE}Waiting for current operation to complete...${NC}"
    
    # Wait for the current operation to finish
    case $STACK_STATUS in
        "CREATE_IN_PROGRESS")
            aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" --region "$REGION" || true
            ;;
        "UPDATE_IN_PROGRESS")
            aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME" --region "$REGION" || true
            ;;
        "DELETE_IN_PROGRESS")
            aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$REGION" || true
            ;;
    esac
    
    # Check the final status
    FINAL_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [[ "$FINAL_STATUS" == "NOT_FOUND" ]]; then
        echo -e "${GREEN}✓ Stack was deleted${NC}"
    else
        echo -e "${YELLOW}Final stack status: $FINAL_STATUS${NC}"
        if [[ "$FINAL_STATUS" =~ (FAILED|ROLLBACK_COMPLETE) ]]; then
            echo -e "${YELLOW}Stack is still in a failed state. You may want to run this script again.${NC}"
        fi
    fi
fi

echo ""
echo -e "${GREEN}✓ Cleanup completed${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. You can now run 'cdk bootstrap' to create a fresh CDK environment"
echo "2. Or run your deployment workflow which will handle bootstrap automatically" 