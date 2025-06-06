output "primary_endpoint" {
  description = "The address of the endpoint for the primary node in the replication group"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "port" {
  description = "The port the ElastiCache Redis cluster is listening on"
  value       = aws_elasticache_replication_group.main.port
}

output "security_group_id" {
  description = "The security group ID of the ElastiCache cluster"
  value       = aws_security_group.redis.id
}

output "endpoint" {
  description = "The connection endpoint for the Redis cluster"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "arn" {
  description = "The ARN of the Redis cluster"
  value       = aws_elasticache_cluster.main.arn
}

output "id" {
  description = "The ID of the Redis cluster"
  value       = aws_elasticache_cluster.main.id
} 