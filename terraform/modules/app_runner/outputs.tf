# Outputs for App Runner Module

output "service_id" {
  description = "The ID of the App Runner service"
  value       = aws_apprunner_service.main.id
}

output "service_arn" {
  description = "The ARN of the App Runner service"
  value       = aws_apprunner_service.main.arn
}

output "service_url" {
  description = "The URL of the App Runner service"
  value       = aws_apprunner_service.main.service_url
}

output "service_status" {
  description = "The current status of the App Runner service"
  value       = aws_apprunner_service.main.status
}

output "security_group_id" {
  description = "The ID of the security group used for App Runner"
  value       = var.app_runner_security_group_id
}

output "vpc_connector_arn" {
  description = "The ARN of the VPC connector"
  value       = aws_apprunner_vpc_connector.main.arn
}

output "instance_role_arn" {
  description = "The ARN of the instance IAM role"
  value       = aws_iam_role.app_runner_instance.arn
}

output "service_role_arn" {
  description = "The ARN of the service IAM role"
  value       = aws_iam_role.app_runner_service.arn
} 