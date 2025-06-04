#!/bin/bash

# Octonius Platform Deployment Tracker
# Query deployment history from bootstrap buckets

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
BUCKET=""
COMMAND=""

# Help function
show_help() {
    cat << EOF
Octonius Deployment Tracker

USAGE:
    $0 <command> --env <environment> [options]

COMMANDS:
    latest              Show latest deployment for environment
    history             Show deployment history
    status              Show current deployment status
    compare             Compare two deployments
    rollback-info       Show rollback information

OPTIONS:
    --env <dev|prod>    Environment (required)
    --bucket <name>     Override bucket name (optional)
    --limit <number>    Limit number of results (default: 10)
    --date <YYYY-MM-DD> Filter by date
    --json              Output in JSON format

EXAMPLES:
    $0 latest --env dev
    $0 history --env prod --limit 5
    $0 status --env dev
    $0 compare --env prod --from deploy-20231201-120000-abc123 --to deploy-20231201-130000-def456

EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        latest|history|status|compare|rollback-info)
            COMMAND="$1"
            shift
            ;;
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --bucket)
            BUCKET="$2"
            shift 2
            ;;
        --limit)
            LIMIT="$2"
            shift 2
            ;;
        --date)
            DATE_FILTER="$2"
            shift 2
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --from)
            FROM_DEPLOYMENT="$2"
            shift 2
            ;;
        --to)
            TO_DEPLOYMENT="$2"
            shift 2
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

# Validate required arguments
if [[ -z "$COMMAND" ]]; then
    echo -e "${RED}Error: Command is required${NC}"
    show_help
    exit 1
fi

if [[ -z "$ENVIRONMENT" ]]; then
    echo -e "${RED}Error: Environment is required (--env dev|prod)${NC}"
    show_help
    exit 1
fi

# Set default values
LIMIT=${LIMIT:-10}

# Determine bucket name if not provided
if [[ -z "$BUCKET" ]]; then
    # Try to get from AWS secrets or environment variables
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        BUCKET="${DEV_S3_BUCKET:-$(aws secretsmanager get-secret-value --secret-id dev/s3-bucket --query 'SecretString' --output text 2>/dev/null || echo '')}"
    else
        BUCKET="${PROD_S3_BUCKET:-$(aws secretsmanager get-secret-value --secret-id prod/s3-bucket --query 'SecretString' --output text 2>/dev/null || echo '')}"
    fi
    
    if [[ -z "$BUCKET" ]]; then
        echo -e "${RED}Error: Could not determine bucket name. Please specify with --bucket${NC}"
        exit 1
    fi
fi

# Helper functions
format_date() {
    if command -v gdate >/dev/null 2>&1; then
        gdate -d "$1" "+%Y-%m-%d %H:%M:%S UTC" 2>/dev/null || echo "$1"
    else
        date -d "$1" "+%Y-%m-%d %H:%M:%S UTC" 2>/dev/null || echo "$1"
    fi
}

# Command implementations
cmd_latest() {
    echo -e "${BLUE}Latest deployment for ${ENVIRONMENT}:${NC}"
    
    LATEST_FILE="s3://${BUCKET}/deployments/latest-${ENVIRONMENT}-success.json"
    
    if aws s3 ls "$LATEST_FILE" >/dev/null 2>&1; then
        LATEST_CONTENT=$(aws s3 cp "$LATEST_FILE" -)
        
        if [[ "$JSON_OUTPUT" == "true" ]]; then
            echo "$LATEST_CONTENT"
        else
            echo "$LATEST_CONTENT" | jq -r '
                "Deployment ID: " + .deploymentId + "\n" +
                "Status: " + .status + "\n" +
                "Completed: " + .completedAt + "\n" +
                "Git Commit: " + .gitCommit + "\n" +
                "Actor: " + .gitActor + "\n" +
                "Stacks: " + .deployedStacks + "\n" +
                "Duration: " + .duration
            '
        fi
    else
        echo -e "${YELLOW}No successful deployments found for ${ENVIRONMENT}${NC}"
    fi
}

cmd_history() {
    echo -e "${BLUE}Deployment history for ${ENVIRONMENT} (last ${LIMIT}):${NC}"
    
    # List deployment files from history
    DEPLOYMENTS=$(aws s3 ls "s3://${BUCKET}/deployments/history/" --recursive | grep "\.json$" | tail -n "$LIMIT" | awk '{print $4}')
    
    if [[ -z "$DEPLOYMENTS" ]]; then
        echo -e "${YELLOW}No deployment history found${NC}"
        return
    fi
    
    echo "$DEPLOYMENTS" | while read -r deployment_file; do
        DEPLOYMENT_CONTENT=$(aws s3 cp "s3://${BUCKET}/${deployment_file}" -)
        
        if [[ "$JSON_OUTPUT" == "true" ]]; then
            echo "$DEPLOYMENT_CONTENT"
        else
            echo "$DEPLOYMENT_CONTENT" | jq -r '
                "----------------------------------------\n" +
                "ID: " + .deploymentId + "\n" +
                "Status: " + (.status | if . == "success" then "✅ " + . else "❌ " + . end) + "\n" +
                "Time: " + .completedAt + "\n" +
                "Commit: " + .gitCommit + "\n" +
                "Actor: " + .gitActor + "\n" +
                "Stacks: " + .deployedStacks
            '
        fi
    done
}

cmd_status() {
    echo -e "${BLUE}Current deployment status for ${ENVIRONMENT}:${NC}"
    
    # Check if there's an ongoing deployment
    DEPLOYING_FILES=$(aws s3 ls "s3://${BUCKET}/deployments/" | grep -E "deploy-.*\.json$" | head -5)
    
    if [[ -n "$DEPLOYING_FILES" ]]; then
        echo -e "${YELLOW}Recent deployment activities:${NC}"
        echo "$DEPLOYING_FILES" | while read -r line; do
            FILE_NAME=$(echo "$line" | awk '{print $4}')
            MANIFEST_CONTENT=$(aws s3 cp "s3://${BUCKET}/deployments/${FILE_NAME}" -)
            
            echo "$MANIFEST_CONTENT" | jq -r '
                "• " + .deploymentId + " - " + .status + " (" + .timestamp + ")"
            '
        done
    fi
    
    cmd_latest
}

cmd_compare() {
    if [[ -z "$FROM_DEPLOYMENT" || -z "$TO_DEPLOYMENT" ]]; then
        echo -e "${RED}Error: Both --from and --to deployment IDs are required for comparison${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Comparing deployments:${NC}"
    echo "From: $FROM_DEPLOYMENT"
    echo "To: $TO_DEPLOYMENT"
    
    # This is a simplified comparison - you could enhance it further
    FROM_FILE="s3://${BUCKET}/deployments/${FROM_DEPLOYMENT}/final-manifest.json"
    TO_FILE="s3://${BUCKET}/deployments/${TO_DEPLOYMENT}/final-manifest.json"
    
    if aws s3 ls "$FROM_FILE" >/dev/null 2>&1 && aws s3 ls "$TO_FILE" >/dev/null 2>&1; then
        FROM_CONTENT=$(aws s3 cp "$FROM_FILE" -)
        TO_CONTENT=$(aws s3 cp "$TO_FILE" -)
        
        echo -e "\n${GREEN}From deployment:${NC}"
        echo "$FROM_CONTENT" | jq -r '"Commit: " + .gitCommit + "\nTime: " + .completedAt + "\nStacks: " + .deployedStacks'
        
        echo -e "\n${GREEN}To deployment:${NC}"
        echo "$TO_CONTENT" | jq -r '"Commit: " + .gitCommit + "\nTime: " + .completedAt + "\nStacks: " + .deployedStacks'
    else
        echo -e "${RED}Error: One or both deployment manifests not found${NC}"
        exit 1
    fi
}

cmd_rollback_info() {
    echo -e "${BLUE}Rollback information for ${ENVIRONMENT}:${NC}"
    
    # Get last 3 successful deployments
    echo -e "${GREEN}Last 3 successful deployments (potential rollback targets):${NC}"
    
    DEPLOYMENTS=$(aws s3 ls "s3://${BUCKET}/deployments/history/" --recursive | grep "\.json$" | tail -n 3 | awk '{print $4}')
    
    echo "$DEPLOYMENTS" | while read -r deployment_file; do
        DEPLOYMENT_CONTENT=$(aws s3 cp "s3://${BUCKET}/${deployment_file}" -)
        
        STATUS=$(echo "$DEPLOYMENT_CONTENT" | jq -r '.status')
        if [[ "$STATUS" == "success" ]]; then
            echo "$DEPLOYMENT_CONTENT" | jq -r '
                "• " + .deploymentId + "\n" +
                "  Commit: " + .gitCommit + "\n" +
                "  Time: " + .completedAt + "\n" +
                "  Actor: " + .gitActor + "\n"
            '
        fi
    done
}

# Execute command
case $COMMAND in
    latest)
        cmd_latest
        ;;
    history)
        cmd_history
        ;;
    status)
        cmd_status
        ;;
    compare)
        cmd_compare
        ;;
    rollback-info)
        cmd_rollback_info
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        show_help
        exit 1
        ;;
esac 