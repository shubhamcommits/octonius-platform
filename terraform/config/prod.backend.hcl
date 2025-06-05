# Production Environment Backend Configuration
# Used with: terraform init -backend-config=config/prod.backend.hcl

bucket         = "prod-octonius-platform-terraform-state-eu-central-1"
key            = "prod/terraform.tfstate"
region         = "eu-central-1"
encrypt        = true
dynamodb_table = "prod-octonius-platform-terraform-locks" 