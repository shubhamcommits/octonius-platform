# Octonius Platform Infrastructure - Dynamic Branch-Based Deployment
# This configuration automatically adapts to any branch/environment

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for current AWS caller identity
data "aws_caller_identity" "current" {}

# Data source to get the actual secret ARN with suffix
data "aws_secretsmanager_secret" "platform_env" {
  name = "${var.environment}-${local.project_name}-platform-service-env-${var.aws_region}"
}

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

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = local.common_tags
}

# Security Group for App Runner
resource "aws_security_group" "app_runner" {
  name        = "${local.name_prefix}-app-runner"
  description = "Security group for App Runner service"
  vpc_id      = module.vpc.vpc_id

  # Allow all outbound traffic for internet access and AWS services
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-app-runner"
    }
  )
}

module "bastion" {
  source = "./modules/bastion"

  environment      = var.environment
  project_name     = local.project_name
  region           = var.aws_region
  vpc_id           = module.vpc.vpc_id
  public_subnet_id = module.vpc.public_subnet_ids[0]
  whitelisted_ips  = var.whitelisted_ips
  key_name         = var.bastion_key_name
  instance_type    = var.bastion_instance_type

  # Database connection info
  rds_endpoint      = module.rds.endpoint
  database_name     = "octoniusdb"
  database_username = var.database_username
  rds_secret_arn    = module.rds.secret_arn

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
  bastion_security_group_id = module.bastion.bastion_security_group_id

  instance_class          = var.environment == "prod" ? "db.t4g.small" : "db.t4g.micro"
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
  performance_insights_retention_period = var.environment == "prod" ? 7 : 7
  deletion_protection                   = var.environment == "prod"
  skip_final_snapshot                   = var.environment != "prod" || var.force_destroy_skip_final_snapshot

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

  node_type = var.environment == "prod" ? "cache.t4g.small" : "cache.t4g.micro"
  multi_az  = false

  # Security settings
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled         = true
  snapshot_retention_limit   = var.environment == "prod" ? 30 : 7
  apply_immediately          = var.environment != "prod"

  tags = local.common_tags
}

# ECR Repository
module "ecr" {
  source = "./modules/ecr"

  environment  = var.environment
  project_name = local.project_name
  tags         = local.common_tags
}

# App Runner Service
module "app_runner" {
  source = "./modules/app_runner"

  environment                  = var.environment
  project_name                 = local.project_name
  region                       = local.aws_region
  vpc_id                       = module.vpc.vpc_id
  subnet_ids                   = module.vpc.private_subnet_ids
  secret_name_pattern          = "${var.environment}-${local.project_name}-platform-service-env-${local.aws_region}"
  app_runner_security_group_id = aws_security_group.app_runner.id

  # Container configuration
  container_port     = 3000
  health_check_path  = "/health"
  image_tag          = "latest-${local.environment}"
  ecr_repository_url = module.ecr.repository_url
  image_identifier   = "${module.ecr.repository_url}:latest-${local.environment}"

  # Auto-scaling configuration
  cpu      = local.environment == "prod" ? 1024 : 512
  memory   = local.environment == "prod" ? 2048 : 1024
  min_size = local.environment == "prod" ? 1 : 1
  max_size = local.environment == "prod" ? 10 : 5

  # Environment variables
  environment_variables = {
    HOST               = "0.0.0.0"
    APP_NAME           = "octonius-platform-service"
    PORT               = "3000"
    NODE_ENV           = var.environment
    CLUSTER            = "false"
    DOMAIN             = "${var.environment}.api.octonius.com"
    WEB_APP_BASE_URL   = var.environment == "prod" ? "app.octonius.com" : "${var.environment}.app.octonius.com"
    AWS_ACCOUNT_NUMBER = local.account_id
    AWS_DEFAULT_REGION = local.aws_region
    DB_WRITER_HOST     = module.rds.address
    DB_READER_HOST     = module.rds.address
    DB_PORT            = module.rds.port
    DB_NAME            = module.rds.database_name
    DB_USER            = var.database_username
    MAX_POOL           = var.environment == "prod" ? "5" : "1"
    MIN_POOL           = var.environment == "prod" ? "5" : "1"
    REDIS_HOST         = module.elasticache.endpoint
    REDIS_PORT         = module.elasticache.port
    REDIS_PASS         = module.elasticache.auth_token
  }

  # Secrets from Secrets Manager
  environment_secrets = {
    AWS_ACCESS_KEY_ID     = "${data.aws_secretsmanager_secret.platform_env.arn}:AWS_ACCESS_KEY_ID::"
    RESEND_API_KEY        = "${data.aws_secretsmanager_secret.platform_env.arn}:RESEND_API_KEY::"
    SUPPORT_EMAIL         = "${data.aws_secretsmanager_secret.platform_env.arn}:SUPPORT_EMAIL::"
    RESEND_FROM_EMAIL     = "${data.aws_secretsmanager_secret.platform_env.arn}:RESEND_FROM_EMAIL::"
    AWS_SECRET_ACCESS_KEY = "${data.aws_secretsmanager_secret.platform_env.arn}:AWS_SECRET_ACCESS_KEY::"
    JWT_ACCESS_KEY        = "${data.aws_secretsmanager_secret.platform_env.arn}:JWT_ACCESS_KEY::"
    JWT_ACCESS_TIME       = "${data.aws_secretsmanager_secret.platform_env.arn}:JWT_ACCESS_TIME::"
    JWT_REFRESH_KEY       = "${data.aws_secretsmanager_secret.platform_env.arn}:JWT_REFRESH_KEY::"
    JWT_REFRESH_TIME      = "${data.aws_secretsmanager_secret.platform_env.arn}:JWT_REFRESH_TIME::",
    CDN_BASE_URL          = "${data.aws_secretsmanager_secret.platform_env.arn}:CDN_BASE_URL::",
    S3_BUCKET_NAME        = "${data.aws_secretsmanager_secret.platform_env.arn}:S3_BUCKET_NAME::",
    DB_PASS               = "${module.rds.secret_arn}:password::"
  }

  force_new_deployment = false

  tags = local.common_tags
}

module "web" {
  source = "./modules/web"

  environment  = local.environment
  project_name = local.project_name
  common_tags  = local.common_tags
  aws_region   = local.aws_region
}

# Lambda Auto-Discovery Module
module "lambda_services" {
  source = "./modules/lambda-auto-discovery"

  environment        = var.environment
  aws_region         = var.aws_region
  project_name       = local.project_name
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  tags               = local.common_tags
  
  # RDS security group for database access
  rds_security_group_id = module.rds.security_group_id

  # JWT configuration for API Gateway (if needed)
  jwt_issuer   = "" # Configure if using JWT auth
  jwt_audience = [] # Configure if using JWT auth
  
  # Container image configuration
  use_container_images = true
  ecr_repository_urls  = {} # Start with empty map, Terraform will create repositories as needed
  lambda_image_tag     = var.lambda_image_tag

  # Domain configuration (for services that enable custom domains in their config)
  domain_name      = var.domain_name
}