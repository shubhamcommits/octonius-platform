# Variables for Terraform Infrastructure - Dynamic Environment

variable "environment" {
  description = "Environment name (automatically computed from branch name: main->prod, develop->dev, feature/*->feature-name)"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "octonius"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "public_subnets" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
}

variable "private_subnets" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
}

variable "single_nat_gateway" {
  description = "Use single NAT gateway for cost optimization"
  type        = bool
  default     = false
} 