variable "environment" {
  description = "Environment name (e.g., dev, prod, feature-xyz)"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
} 