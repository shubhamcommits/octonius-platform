# Outputs for Terraform Infrastructure

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "vpc_name" {
  description = "Name of the VPC"
  value       = module.vpc.vpc_name
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = "arn:aws:ec2:${var.aws_region}:${local.account_id}:vpc/${module.vpc.vpc_id}"
}

# Subnet Outputs
output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

# Gateway Outputs
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = module.vpc.internet_gateway_id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = module.vpc.nat_gateway_ids
}

# Environment Info
output "environment" {
  description = "Current environment"
  value       = var.environment
}

output "aws_region" {
  description = "AWS Region"
  value       = var.aws_region
}

output "account_id" {
  description = "AWS Account ID"
  value       = local.account_id
}

# RDS Outputs
output "rds_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = module.rds.endpoint
}

output "rds_port" {
  description = "The port the RDS instance is listening on"
  value       = module.rds.port
}

output "rds_database_name" {
  description = "The name of the RDS database"
  value       = "octonius_${var.environment}"
}

output "rds_instance_class" {
  description = "The instance class of the RDS instance"
  value       = var.environment == "prod" ? "db.t4g.medium" : "db.t4g.micro"
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = module.rds.security_group_id
}

output "rds_arn" {
  description = "ARN of the RDS instance"
  value       = module.rds.arn
}

output "rds_secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS credentials"
  value       = module.rds.secret_arn
  sensitive   = true
}

# ElastiCache Outputs
output "redis_endpoint" {
  description = "The address of the endpoint for the ElastiCache Redis cluster"
  value       = module.elasticache.primary_endpoint
}

output "redis_port" {
  description = "The port the ElastiCache Redis cluster is listening on"
  value       = module.elasticache.port
}

output "redis_security_group_id" {
  description = "ID of the ElastiCache security group"
  value       = module.elasticache.security_group_id
}

output "redis_arn" {
  description = "ARN of the ElastiCache replication group"
  value       = module.elasticache.arn
}

output "redis_node_type" {
  description = "The node type of the ElastiCache cluster"
  value       = var.environment == "prod" ? "cache.t4g.medium" : "cache.t4g.micro"
}

# Tags Output
output "common_tags" {
  description = "Map of tags applied to all resources"
  value       = local.common_tags
} 