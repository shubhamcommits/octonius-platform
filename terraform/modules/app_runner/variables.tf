# Variables for App Runner Module

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where App Runner will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for App Runner VPC connector"
  type        = list(string)
}

variable "container_port" {
  description = "Port number the application listens on"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "Path for health check endpoint"
  type        = string
  default     = "/health"
}

variable "image_identifier" {
  description = "ECR image URI (e.g., {account}.dkr.ecr.{region}.amazonaws.com/{repo}:{tag})"
  type        = string
}

variable "auto_deployments_enabled" {
  description = "Whether to enable auto deployments"
  type        = bool
  default     = true
}

variable "environment_variables" {
  description = "Environment variables for the application"
  type        = map(string)
  default     = {}
}

variable "environment_secrets" {
  description = "Map of environment variable names to secret ARN suffixes. Example: { 'DB_PASSWORD' = 'db-password', 'API_KEY' = 'api-key' }"
  type        = map(string)
  default     = {}
}

variable "cpu" {
  description = "Amount of CPU units for the service (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "memory" {
  description = "Amount of memory in MB for the service"
  type        = number
  default     = 2048
}

variable "min_size" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "max_concurrency" {
  description = "Maximum number of concurrent requests per instance"
  type        = number
  default     = 100
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "secret_name_pattern" {
  description = "Pattern for the secret name in AWS Secrets Manager"
  type        = string
}

variable "force_new_deployment" {
  description = "Force a new deployment of the App Runner service (useful when secrets change)"
  type        = bool
  default     = false
}

variable "image_tag" {
  description = "The tag of the Docker image to deploy."
  type        = string
}

variable "ecr_repository_url" {
  description = "The ECR repository URL."
  type        = string
} 