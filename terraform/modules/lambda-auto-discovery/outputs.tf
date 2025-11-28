output "lambda_function_arns" {
  value = {
    for name, func in aws_lambda_function.service_function :
    name => func.arn
  }
  description = "ARNs of all Lambda functions"
}

output "lambda_function_names" {
  value = {
    for name, func in aws_lambda_function.service_function :
    name => func.function_name
  }
  description = "Names of all Lambda functions"
}

output "service_configs" {
  value       = local.service_configs
  description = "All discovered service configurations"
}

output "lambda_security_group_ids" {
  value = {
    for name, sg in aws_security_group.lambda :
    name => sg.id
  }
  description = "Security group IDs for Lambda functions"
}

output "lambda_secrets_status" {
  value = {
    for service_name, config in local.service_configs :
    service_name => {
      secret_name = local.secret_names[service_name]
      secret_exists = can(data.aws_secretsmanager_secret.lambda_service_secrets[service_name].id)
      secret_loaded = can(data.aws_secretsmanager_secret.lambda_service_secrets[service_name].id) ? "Yes" : "No - using defaults"
    }
  }
  description = "Status of secrets for each Lambda service"
} 