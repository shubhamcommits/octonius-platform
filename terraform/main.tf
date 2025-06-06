# Octonius Platform Infrastructure - Dynamic Branch-Based Deployment
# This configuration automatically adapts to any branch/environment

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for current AWS caller identity
data "aws_caller_identity" "current" {}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "rds_audit" {
  name              = "/aws/rds/audit/${local.name_prefix}"
  retention_in_days = var.environment == "prod" ? 365 : 30
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "app_runner" {
  name              = "/aws/apprunner/${local.name_prefix}"
  retention_in_days = var.environment == "prod" ? 90 : 30
  tags              = local.common_tags
}

# IAM Role for App Runner
resource "aws_iam_role" "app_runner" {
  name = "${local.name_prefix}-app-runner"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for App Runner
resource "aws_iam_role_policy" "app_runner" {
  name = "${local.name_prefix}-app-runner"
  role = aws_iam_role.app_runner.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  # Use locals for dynamic values
  environment  = local.environment
  project_name = local.project_name
  aws_region   = local.aws_region

  vpc_cidr = var.vpc_cidr
  azs      = slice(data.aws_availability_zones.available.names, 0, 2)

  # Subnets
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets

  # Enable DNS
  enable_dns_hostnames = true
  enable_dns_support   = true

  enable_nat_gateway = false
  single_nat_gateway = false

  tags = local.common_tags
}

# Security Group for App Runner
resource "aws_security_group" "app_runner" {
  name        = "${local.name_prefix}-app-runner"
  description = "Security group for App Runner service"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

module "rds" {
  source = "./modules/rds"

  environment           = var.environment
  project_name          = local.project_name
  region                = var.aws_region
  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.private_subnet_ids
  ecs_security_group_id = aws_security_group.app_runner.id

  instance_class          = var.environment == "prod" ? "db.t4g.medium" : "db.t4g.micro"
  allocated_storage       = var.environment == "prod" ? 100 : 20
  max_allocated_storage   = var.environment == "prod" ? 1000 : 100
  database_name           = "octoniusdb"
  database_username       = var.database_username
  multi_az                = false
  backup_retention_period = var.environment == "prod" ? 30 : 7

  # Security settings
  storage_encrypted                     = true
  enable_cloudwatch_logs_exports        = ["postgresql", "upgrade"]
  performance_insights_enabled          = true
  performance_insights_retention_period = var.environment == "prod" ? 30 : 7
  deletion_protection                   = var.environment == "prod"

  tags = local.common_tags
}

module "elasticache" {
  source = "./modules/elasticache"

  environment           = var.environment
  project_name          = local.project_name
  region                = var.aws_region
  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.private_subnet_ids
  ecs_security_group_id = aws_security_group.app_runner.id

  node_type = var.environment == "prod" ? "cache.t4g.medium" : "cache.t4g.micro"
  multi_az  = false

  # Security settings
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled         = true
  snapshot_retention_limit   = var.environment == "prod" ? 30 : 7
  apply_immediately          = var.environment != "prod"

  tags = local.common_tags
} 