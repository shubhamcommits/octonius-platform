# Staging Environment Backend Configuration
# Used with: terraform init -backend-config=config/staging.backend.hcl

bucket         = "staging-octonius-platform-terraform-state-eu-central-1"
key            = "staging/terraform.tfstate"
region         = "eu-central-1"
encrypt        = true
dynamodb_table = "staging-octonius-platform-terraform-locks" 