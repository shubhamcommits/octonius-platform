# TFLint configuration for Terraform best practices and AWS-specific rules

config {
  # Enable all rules by default
  disabled_by_default = false
  
  # Force TFLint to return an error code if issues are found
  force = false
  
  # Plugin directory
  plugin_dir = "~/.tflint.d/plugins"
}

# AWS Provider plugin for AWS-specific rules
plugin "aws" {
  enabled = true
  version = "0.21.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

# Terraform core rules
rule "terraform_deprecated_interpolation" {
  enabled = true
}

rule "terraform_deprecated_index" {
  enabled = true
}

rule "terraform_unused_declarations" {
  enabled = true
}

rule "terraform_comment_syntax" {
  enabled = true
}

rule "terraform_documented_outputs" {
  enabled = true
}

rule "terraform_documented_variables" {
  enabled = true
}

rule "terraform_typed_variables" {
  enabled = true
}

rule "terraform_module_pinned_source" {
  enabled = true
  style   = "semver"
}

rule "terraform_naming_convention" {
  enabled = true
  format  = "snake_case"
}

rule "terraform_required_version" {
  enabled = true
}

rule "terraform_required_providers" {
  enabled = true
}

rule "terraform_standard_module_structure" {
  enabled = true
}

rule "terraform_workspace_remote" {
  enabled = true
}

# AWS-specific rules (examples - customize based on your needs)
rule "aws_instance_invalid_type" {
  enabled = true
}

rule "aws_instance_previous_type" {
  enabled = true
}

rule "aws_elasticache_cluster_default_parameter_group" {
  enabled = true
}

rule "aws_db_instance_default_parameter_group" {
  enabled = true
}

rule "aws_elasticache_cluster_previous_type" {
  enabled = true
}

rule "aws_db_instance_previous_type" {
  enabled = true
}

rule "aws_route_invalid_route_table" {
  enabled = true
}

rule "aws_route_not_specified_target" {
  enabled = true
}

rule "aws_route_specified_multiple_targets" {
  enabled = true
}

rule "aws_security_group_rule_invalid_protocol" {
  enabled = true
}

rule "aws_alb_invalid_security_group" {
  enabled = true
}

rule "aws_alb_invalid_subnet" {
  enabled = true
}

rule "aws_iam_policy_sid_invalid_characters" {
  enabled = true
}

rule "aws_iam_role_policy_sid_invalid_characters" {
  enabled = true
}

rule "aws_iam_user_policy_sid_invalid_characters" {
  enabled = true
}

rule "aws_s3_bucket_invalid_policy" {
  enabled = true
}

rule "aws_s3_bucket_invalid_cors_rule" {
  enabled = true
}

# Performance and cost optimization rules
rule "aws_instance_not_specified_iam_instance_profile" {
  enabled = false  # Disable if not using instance profiles
}

rule "aws_launch_configuration_invalid_image_id" {
  enabled = true
}

rule "aws_launch_template_invalid_image_id" {
  enabled = true
}

# Security rules
rule "aws_security_group_rule_invalid_cidr" {
  enabled = true
}

rule "aws_db_instance_readable_password" {
  enabled = true
}

rule "aws_elasticache_cluster_readable_auth_token" {
  enabled = true
}

rule "aws_iam_policy_document_gov_friendly_arns" {
  enabled = false  # Disable if not using AWS GovCloud
}

rule "aws_iam_role_policy_gov_friendly_arns" {
  enabled = false  # Disable if not using AWS GovCloud
}

rule "aws_iam_user_policy_gov_friendly_arns" {
  enabled = false  # Disable if not using AWS GovCloud
} 