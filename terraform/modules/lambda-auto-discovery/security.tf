# Security group for Lambda functions
resource "aws_security_group" "lambda" {
  for_each = {
    for name, config in local.service_configs :
    name => config if lookup(config.shared.vpc, "enabled", false)
  }
  
  # Shorten SG name to avoid length issues
  name        = "${var.environment}-${substr(each.key, 0, 24)}-${substr(md5(each.key), 0, 6)}-lambda-sg"
  description = "Security group for ${each.key} Lambda functions"
  vpc_id      = var.vpc_id
  
  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    Name    = "${var.environment}-${substr(each.key, 0, 24)}-${substr(md5(each.key), 0, 6)}-lambda-sg"
    Service = each.key
  })
}

# Security group rule: Lambda -> RDS
# Only create these rules if RDS security group ID is provided
resource "aws_security_group_rule" "lambda_to_rds" {
  # Create rules for all VPC-enabled services
  for_each = {
    for name, config in local.service_configs :
    name => config if lookup(config.shared.vpc, "enabled", false)
  }

  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda[each.key].id
  security_group_id        = var.rds_security_group_id
  description              = "Allow ${each.key} Lambda to access RDS"
  
  lifecycle {
    precondition {
      condition     = var.rds_security_group_id != ""
      error_message = "RDS security group ID must be provided to create Lambda-to-RDS access rules."
    }
  }
} 