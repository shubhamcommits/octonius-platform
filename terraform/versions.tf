# Terraform and Provider Version Constraints
# This file ensures consistent provider versions across all environments

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.31"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.4"
    }

    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }

    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }

    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }

  # Backend configuration is generated dynamically by GitHub Actions
  # See backend.tf file which is created during workflow execution
}

# Configure the AWS Provider with default settings
provider "aws" {
  region = var.aws_region

  # Default tags applied to all resources
  default_tags {
    tags = local.common_tags
  }

  # Common configuration
  skip_metadata_api_check     = false
  skip_region_validation      = false
  skip_credentials_validation = false
  skip_requesting_account_id  = false
} 