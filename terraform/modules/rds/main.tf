# PostgreSQL RDS Module
# This module creates a PostgreSQL RDS instance with the following features:
# - Encrypted storage using gp3
# - Performance Insights enabled
# - Enhanced monitoring
# - Automatic backups
# - Multi-AZ support for production
# - Secure password management via AWS Secrets Manager

# AWS Secrets Manager for database credentials
resource "aws_secretsmanager_secret" "rds" {
  name        = "${var.environment}-${var.project_name}-db-${var.region}"
  description = "RDS database credentials for ${var.environment}-${var.project_name}"
  tags        = var.tags
}

# Store generated credentials in Secrets Manager
resource "aws_secretsmanager_secret_version" "rds" {
  secret_id = aws_secretsmanager_secret.rds.id
  secret_string = jsonencode({
    username = var.database_username
    password = random_password.db.result
  })
}

# Generate secure random password
resource "random_password" "db" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# DB Subnet Group for RDS instance
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-${var.project_name}-db-${var.region}"
  subnet_ids = var.subnet_ids

  tags = var.tags
}

# Security Group for RDS instance
resource "aws_security_group" "rds" {
  name        = "${var.environment}-${var.project_name}-db-${var.region}"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  # Allow PostgreSQL traffic from ECS tasks only
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ecs_security_group_id]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier             = "${var.environment}-${var.project_name}-db-${var.region}"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = var.instance_class
  allocated_storage      = var.allocated_storage
  max_allocated_storage  = var.max_allocated_storage
  storage_type           = "gp3"
  storage_encrypted      = var.storage_encrypted

  # Database configuration
  db_name                = var.database_name
  username               = var.database_username
  password               = random_password.db.result

  # Network configuration
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # High availability configuration
  multi_az               = var.multi_az
  publicly_accessible    = false
  skip_final_snapshot    = var.skip_final_snapshot

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  # Monitoring configuration
  performance_insights_enabled          = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_retention_period
  monitoring_interval                   = 60
  monitoring_role_arn                  = aws_iam_role.rds_monitoring.arn

  # Enhanced security
  deletion_protection          = var.deletion_protection
  enabled_cloudwatch_logs_exports = var.enable_cloudwatch_logs_exports

  tags = var.tags
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.environment}-${var.project_name}-db-monitoring-${var.region}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Attach Enhanced Monitoring policy to the IAM role
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
} 