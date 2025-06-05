# 🏗️ Octonius Platform - Terraform Infrastructure

A clean, modular Terraform setup for the Octonius Platform infrastructure on AWS, following consistent naming conventions and best practices.

## 📁 Project Structure

```
terraform/
├── environments/
│   ├── dev/                    # Development environment
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── prod/                   # Production environment
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── modules/
    └── vpc/                    # Reusable VPC module
        ├── main.tf
        ├── variables.tf
        └── outputs.tf

scripts/
└── terraform-bootstrap.sh     # Bootstrap script for state management

.github/workflows/
└── terraform.yml             # GitHub Actions workflow
```

## 🚀 Quick Start

### 1. Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0 installed
- Access to AWS account with necessary permissions

### 2. Bootstrap State Management

First, create the S3 bucket and DynamoDB table for Terraform state:

```bash
# For development environment
./scripts/terraform-bootstrap.sh -e dev

# For production environment  
./scripts/terraform-bootstrap.sh -e prod

# Dry run to see what would be created
./scripts/terraform-bootstrap.sh -e dev --dry-run
```

### 3. Deploy Infrastructure

```bash
# Navigate to environment directory
cd terraform/environments/dev

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply changes
terraform apply
```

## 🏷️ Naming Conventions

All resources follow the pattern: `{environment}-{project}-{resource}-{region}`

### Examples:
- **VPC**: `dev-octonius-vpc-eu-central-1`
- **Subnets**: `dev-octonius-public-subnet-1-eu-central-1a`
- **NAT Gateway**: `dev-octonius-nat-gateway-1-eu-central-1a`
- **State Bucket**: `dev-octonius-platform-terraform-state-eu-central-1`

## ⚙️ Environment Configuration

### Development (dev)
- **VPC CIDR**: `10.0.0.0/16`
- **Single NAT Gateway**: Yes (cost optimization)
- **Public Subnets**: `10.0.1.0/24`, `10.0.2.0/24`, `10.0.3.0/24`
- **Private Subnets**: `10.0.11.0/24`, `10.0.12.0/24`, `10.0.13.0/24`

### Production (prod)
- **VPC CIDR**: `10.1.0.0/16`
- **Single NAT Gateway**: No (high availability)
- **Public Subnets**: `10.1.1.0/24`, `10.1.2.0/24`, `10.1.3.0/24`
- **Private Subnets**: `10.1.11.0/24`, `10.1.12.0/24`, `10.1.13.0/24`

## 🔄 CI/CD Pipeline

The GitHub Actions workflow (`terraform.yml`) provides:

### Triggers
- **Push to main**: Applies to production
- **Pull requests**: Plans for development
- **Manual dispatch**: Choose environment and action

### Jobs
1. **🔧 Setup & Validate**: Format check and environment determination
2. **📋 Plan Infrastructure**: Create and upload Terraform plan
3. **🚀 Apply Infrastructure**: Apply changes (conditional)

### Manual Deployment
Use GitHub Actions interface:
1. Go to Actions → Terraform Infrastructure
2. Click "Run workflow"
3. Select environment (dev/prod)
4. Choose action (plan/apply/destroy)

## 📊 Infrastructure Outputs

After deployment, you'll get:

```json
{
  "vpc_id": "vpc-xxxxxxxxx",
  "vpc_cidr_block": "10.0.0.0/16",
  "public_subnet_ids": ["subnet-xxxxx", "subnet-yyyyy"],
  "private_subnet_ids": ["subnet-aaaaa", "subnet-bbbbb"],
  "nat_gateway_ids": ["nat-xxxxxxxxx"]
}
```

## 🔐 Security Features

- **S3 State Encryption**: AES-256 encryption enabled
- **State Locking**: DynamoDB prevents concurrent modifications
- **Public Access Blocked**: S3 buckets have public access blocked
- **VPC Security**: Private subnets with NAT gateway access
- **Lifecycle Management**: Automated cleanup of old state versions

## 🛠️ Local Development

### Initialize New Environment
```bash
# Create new environment directory
mkdir -p terraform/environments/staging
cp -r terraform/environments/dev/* terraform/environments/staging/

# Update variables in staging/variables.tf
# Update backend configuration in staging/main.tf

# Bootstrap state management
./scripts/terraform-bootstrap.sh -e staging

# Deploy
cd terraform/environments/staging
terraform init
terraform plan
terraform apply
```

### Validate Configuration
```bash
# Format all Terraform files
terraform fmt -recursive terraform/

# Validate configuration
terraform validate terraform/environments/dev
terraform validate terraform/modules/vpc
```

## 📋 Available Commands

### Bootstrap Script
```bash
./scripts/terraform-bootstrap.sh [OPTIONS]

Options:
  -e, --environment   Environment (dev, prod)
  -r, --region        AWS region [default: eu-central-1]
  -p, --project       Project name [default: octonius]
  --dry-run           Preview without creating resources
  -h, --help          Show help
```

### Terraform Commands
```bash
# Standard workflow
terraform init          # Initialize
terraform plan          # Plan changes
terraform apply         # Apply changes
terraform destroy       # Destroy infrastructure

# Useful options
terraform plan -out=plan.tfplan     # Save plan
terraform apply plan.tfplan         # Apply saved plan
terraform output -json              # Show outputs in JSON
terraform state list                # List resources
```

## 🔧 Troubleshooting

### Common Issues

1. **State Bucket Doesn't Exist**
   ```bash
   # Run bootstrap script first
   ./scripts/terraform-bootstrap.sh -e dev
   ```

2. **AWS Credentials Not Configured**
   ```bash
   aws configure
   # or
   export AWS_ACCESS_KEY_ID=xxx
   export AWS_SECRET_ACCESS_KEY=xxx
   ```

3. **Backend Initialization Error**
   ```bash
   # Delete .terraform directory and reinitialize
   rm -rf .terraform
   terraform init
   ```

4. **Plan Shows Unexpected Changes**
   ```bash
   # Refresh state
   terraform refresh
   terraform plan
   ```

## 🚧 Future Enhancements

- [ ] Add Application Load Balancer module
- [ ] Add RDS database module  
- [ ] Add ECS/EKS container services
- [ ] Add CloudFront distribution
- [ ] Add Route53 DNS management
- [ ] Add monitoring and logging (CloudWatch)
- [ ] Add security groups module
- [ ] Add IAM roles and policies

## 📞 Support

- **Documentation**: This README and inline comments
- **Issues**: GitHub Issues for bug reports
- **Architecture**: See `terraform/modules/` for detailed configurations

---

🎉 **Clean, Simple, and Scalable!** No more CDK complexity - just straightforward Terraform infrastructure as code. 