output "endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "port" {
  description = "The port the RDS instance is listening on"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "The name of the database"
  value       = aws_db_instance.main.db_name
}

output "security_group_id" {
  description = "The security group ID of the RDS instance"
  value       = aws_security_group.rds.id
}

output "secret_arn" {
  description = "The ARN of the secret containing database credentials"
  value       = aws_secretsmanager_secret.rds.arn
}

output "arn" {
  description = "The ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "id" {
  description = "The ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "address" {
  description = "The hostname (address) of the RDS instance, without port."
  value       = aws_db_instance.main.address
} 