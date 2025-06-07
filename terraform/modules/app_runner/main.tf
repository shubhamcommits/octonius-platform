# App Runner Service
resource "aws_apprunner_service" "main" {
  service_name = "${var.environment}-${var.project_name}-service"

  source_configuration {
    image_repository {
      image_configuration {
        port = var.container_port
        runtime_environment_variables = merge(
          {
            NODE_ENV           = var.environment
            AWS_DEFAULT_REGION = var.region
            APP_NAME           = var.project_name
          },
          var.environment_variables
        )
        runtime_environment_secrets = {
          for k, v in var.environment_secrets : k => "arn:aws:secretsmanager:${var.region}:${data.aws_caller_identity.current.account_id}:secret:${v}"
        }
      }
      image_identifier      = var.image_identifier
      image_repository_type = "ECR"
    }
    auto_deployments_enabled = var.auto_deployments_enabled
    authentication_configuration {
      access_role_arn = aws_iam_role.app_runner_service.arn
    }
  }

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  health_check_configuration {
    healthy_threshold   = 3
    interval            = 10
    path                = var.health_check_path
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  instance_configuration {
    cpu               = var.cpu
    memory            = var.memory
    instance_role_arn = aws_iam_role.app_runner_instance.arn
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.main.arn

  tags = var.tags
}

# VPC Connector
resource "aws_apprunner_vpc_connector" "main" {
  vpc_connector_name = "${var.environment}-${var.project_name}-vpc-connector"
  subnets            = var.subnet_ids
  security_groups    = [aws_security_group.app_runner.id]
}

# Auto Scaling Configuration
resource "aws_apprunner_auto_scaling_configuration_version" "main" {
  auto_scaling_configuration_name = "${var.environment}-${var.project_name}-asc"

  max_concurrency = var.max_concurrency
  max_size        = var.max_size
  min_size        = var.min_size

  tags = var.tags
}

# Security Group for App Runner
resource "aws_security_group" "app_runner" {
  name        = "${var.environment}-${var.project_name}-app-runner-security-group"
  description = "Security group for App Runner service"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

# IAM Role for App Runner Service (ECR access)
resource "aws_iam_role" "app_runner_service" {
  name = "${var.environment}-${var.project_name}-app-runner-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Role for App Runner Instance
resource "aws_iam_role" "app_runner_instance" {
  name = "${var.environment}-${var.project_name}-app-runner-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Attach policies to service role
resource "aws_iam_role_policy_attachment" "app_runner_service" {
  role       = aws_iam_role.app_runner_service.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Attach policies to instance role
resource "aws_iam_role_policy" "app_runner_instance" {
  name = "${var.environment}-${var.project_name}-app-runner-instance-policy"
  role = aws_iam_role.app_runner_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.region}:${data.aws_caller_identity.current.account_id}:secret:${var.environment}-${var.project_name}*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = "*"
      }
    ]
  })
} 