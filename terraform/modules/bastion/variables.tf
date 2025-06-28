variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name to be used for resource naming"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the bastion host will be created"
  type        = string
}

variable "public_subnet_id" {
  description = "Public subnet ID for the bastion host"
  type        = string
}

variable "whitelisted_ips" {
  description = "Map of whitelisted IP addresses for SSH access"
  type = map(object({
    cidr        = string
    description = string
  }))
  default = {}
}

variable "instance_type" {
  description = "EC2 instance type for bastion host"
  type        = string
  default     = "t3.nano"
}

variable "key_name" {
  description = "EC2 Key Pair name for SSH access"
  type        = string
}

variable "enable_elastic_ip" {
  description = "Whether to create an Elastic IP for the bastion host"
  type        = bool
  default     = true
}

variable "rds_endpoint" {
  description = "RDS endpoint for database connection"
  type        = string
  default     = null
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "database_username" {
  description = "Database username"
  type        = string
}

variable "rds_secret_arn" {
  description = "ARN of the RDS secret in AWS Secrets Manager"
  type        = string
  default     = null
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
} 