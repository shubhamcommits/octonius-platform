# Redis ElastiCache Module
# This module creates a Redis ElastiCache cluster with the following features:
# - Redis 7.0 with encryption at rest and in transit
# - Multi-AZ support for production
# - Automatic failover enabled in production
# - LRU cache eviction policy
# - Keyspace notifications enabled
# - Private subnet placement with VPC security

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.environment}-${var.project_name}-redis-${var.region}"
  subnet_ids = var.subnet_ids
}

# Security Group for Redis cluster
resource "aws_security_group" "redis" {
  name        = "${var.environment}-${var.project_name}-redis-${var.region}"
  description = "Security group for Redis ElastiCache"
  vpc_id      = var.vpc_id

  # Allow Redis traffic from ECS tasks only
  ingress {
    from_port       = 6379
    to_port         = 6379
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

# Redis Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  family = "redis7"
  name   = "${var.environment}-${var.project_name}-redis-${var.region}"

  # Configure LRU cache eviction
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  # Enable keyspace notifications
  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }
}

# Generate auth token for Redis
resource "random_password" "redis_auth" {
  length           = 32
  special          = false
  override_special = "!&#$^<>-"
}

# Redis Replication Group (Cluster)
resource "aws_elasticache_replication_group" "main" {
  replication_group_id          = "${var.environment}-${var.project_name}-redis-${var.region}"
  description                   = "Redis cluster for ${var.environment}-${var.project_name}"
  node_type                     = var.node_type
  port                          = 6379
  parameter_group_name          = aws_elasticache_parameter_group.main.name
  subnet_group_name             = aws_elasticache_subnet_group.main.name
  security_group_ids            = [aws_security_group.redis.id]

  # High availability configuration
  automatic_failover_enabled    = var.multi_az
  multi_az_enabled             = var.multi_az
  num_cache_clusters           = var.multi_az ? 2 : 1

  # Security configuration
  at_rest_encryption_enabled    = var.at_rest_encryption_enabled
  transit_encryption_enabled    = var.transit_encryption_enabled
  auth_token                   = var.auth_token_enabled ? random_password.redis_auth.result : null
  snapshot_retention_limit     = var.snapshot_retention_limit
  apply_immediately           = var.apply_immediately

  # Redis version
  engine                      = "redis"
  engine_version             = "7.0"

  tags = var.tags
} 