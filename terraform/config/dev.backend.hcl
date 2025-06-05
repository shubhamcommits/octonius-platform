# Dev Environment Backend Configuration
# Used with: terraform init -backend-config=config/dev.backend.hcl

bucket         = "dev-octonius-platform-terraform-state-eu-central-1"
key            = "dev/terraform.tfstate"
region         = "eu-central-1"
encrypt        = true
dynamodb_table = "dev-octonius-platform-terraform-locks"
