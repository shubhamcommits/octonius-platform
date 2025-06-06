# Variables for Terraform Infrastructure - Dynamic Environment

variable "environment" {
  description = "Environment name (automatically computed from branch name: main->prod, develop->dev, feature/*->feature-name)"
  type        = string
  validation {
    condition     = contains(["prod", "dev"], var.environment)
    error_message = "Environment must be one of: prod, dev"
  }
}

variable "account_id" {
  description = "AWS account ID (automatically set by pipeline)"
  type        = string
  default     = "000000000000"
}

variable "project_name" {
  description = "Project name (automatically set by pipeline)"
  type        = string
  default     = "octonius"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens"
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block"
  }
}

variable "public_subnets" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  validation {
    condition     = length(var.public_subnets) > 0 && alltrue([for cidr in var.public_subnets : can(cidrhost(cidr, 0))])
    error_message = "Public subnets must be valid IPv4 CIDR blocks"
  }
}

variable "private_subnets" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  validation {
    condition     = length(var.private_subnets) > 0 && alltrue([for cidr in var.private_subnets : can(cidrhost(cidr, 0))])
    error_message = "Private subnets must be valid IPv4 CIDR blocks"
  }
}

variable "single_nat_gateway" {
  description = "Use single NAT gateway for cost optimization"
  type        = bool
  default     = false
}

variable "database_username" {
  description = "Username for the RDS database (defaults to project_name)"
  type        = string
  default     = "octonius"  # Same as project_name default
} 