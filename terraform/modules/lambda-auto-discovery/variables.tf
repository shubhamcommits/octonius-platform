variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "api_gateway_id" {
  description = "API Gateway ID for Lambda integrations"
  type        = string
  default     = ""
}

variable "jwt_issuer" {
  description = "JWT issuer for API Gateway authorizer"
  type        = string
  default     = ""
}

variable "jwt_audience" {
  description = "JWT audience for API Gateway authorizer"
  type        = list(string)
  default     = []
}

variable "rds_security_group_id" {
  description = "Security group ID of the RDS instance"
  type        = string
  default     = ""
}

variable "use_container_images" {
  description = "Whether to use container images instead of ZIP packages"
  type        = bool
  default     = true
}

variable "ecr_repository_urls" {
  description = "Map of service names to ECR repository URLs"
  type        = map(string)
  default     = {}
}

variable "lambda_image_tag" {
  description = "Tag for Lambda container images"
  type        = string
  default     = "latest"
}

variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Base domain name for services (e.g., legitmark.com)"
  type        = string
  default     = ""
} 