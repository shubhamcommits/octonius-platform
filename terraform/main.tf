# Octonius Platform Infrastructure - Dynamic Environment
# This configuration works with any environment via backend configuration

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment  = var.environment
  project_name = var.project_name
  aws_region   = var.aws_region

  vpc_cidr = var.vpc_cidr
  azs      = data.aws_availability_zones.available.names

  # Subnets
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets

  # Enable DNS
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Enable NAT Gateway for private subnets
  enable_nat_gateway = true
  single_nat_gateway = var.single_nat_gateway

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
} 