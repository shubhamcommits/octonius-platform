# Octonius Platform Infrastructure - Dynamic Branch-Based Deployment
# This configuration automatically adapts to any branch/environment

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for current AWS caller identity
data "aws_caller_identity" "current" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  # Use locals for dynamic values
  environment  = local.environment
  project_name = local.project_name
  aws_region   = local.aws_region

  vpc_cidr = var.vpc_cidr
  azs      = slice(data.aws_availability_zones.available.names, 0, 2) # Use first 2 AZs

  # Subnets
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets

  # Enable DNS
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Enable NAT Gateway for private subnets
  enable_nat_gateway = true
  single_nat_gateway = var.single_nat_gateway

  # Apply common tags
  tags = local.common_tags
} 