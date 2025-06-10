output "primary_endpoint" {
  description = "The address of the endpoint for the primary node in the replication group"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "port" {
  description = "The port the ElastiCache Redis cluster is listening on"
  value       = aws_elasticache_replication_group.main.port
}

output "security_group_id" {
  description = "The ID of the Redis security group"
  value       = aws_security_group.redis.id
}

output "endpoint" {
  description = "The connection endpoint for the Redis cluster"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "arn" {
  description = "The ARN of the Redis cluster"
  value       = aws_elasticache_replication_group.main.arn
}

output "id" {
  description = "The ID of the Redis cluster"
  value       = aws_elasticache_replication_group.main.id
}

output "auth_token" {
  description = "The authentication token for Redis (if enabled)"
  value       = var.auth_token_enabled ? random_password.redis_auth.result : null
  sensitive   = true
} 