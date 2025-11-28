# Discover service configurations
locals {
  all_service_files = fileset("${path.root}/../services", "*/lambda.config.json")
  valid_service_files = [
    for file in local.all_service_files : 
    file if !startswith(dirname(file), "_") && dirname(file) != "octonius-web"
  ]
  service_configs = {
    for file in local.valid_service_files :
    dirname(file) => jsondecode(file("${path.root}/../services/${file}"))
    if var.use_container_images || fileexists("${path.root}/lambda-packages/${dirname(file)}.zip")
  }
  
  # Detect service types and Dockerfile paths
  service_types = {
    for service_name, config in local.service_configs :
    service_name => {
      type = fileexists("${path.root}/../services/${service_name}/requirements.txt") ? "python" : (
             fileexists("${path.root}/../services/${service_name}/package.json") ? "nodejs" : "unknown"
             )
      dockerfile = fileexists("${path.root}/../services/${service_name}/Dockerfile") ? "${path.root}/../services/${service_name}/Dockerfile" : null
      has_requirements = fileexists("${path.root}/../services/${service_name}/requirements.txt")
      has_package_json = fileexists("${path.root}/../services/${service_name}/package.json")
    }
  }
  
  # Extract custom domain configurations from service configs
  service_domain_configs = {
    for service_name, config in local.service_configs :
    service_name => lookup(config, "customDomain", null)
    if lookup(config, "customDomain", null) != null && lookup(lookup(config, "customDomain", {}), "enabled", false)
  }
  # Flatten all functions
  all_functions = flatten([
    for service_name, config in local.service_configs : [
      for func_name, func_config in config.functions : {
        service_name = service_name
        function_name = func_name == service_name ? func_name : "${service_name}-${func_name}"
        handler = func_config.handler
        memory = func_config.memory
        timeout = func_config.timeout
        events = func_config.events
        environment = {
          for k, v in merge(
            lookup(config.shared, "environment", {}),
            lookup(func_config, "environment", {})
          ) : k => (
            replace(
              replace(
                replace(v, "$${env:ENVIRONMENT}", var.environment),
                "$${env:AWS_DEFAULT_REGION}", var.aws_region
              ),
              "$${env:PROJECT_NAME}", var.project_name
            )
          )
        }
        vpc_enabled = lookup(config.shared.vpc, "enabled", false)
        runtime = lookup(config.shared, "runtime", "nodejs18.x")
        # Force x86_64 for faster, more reliable builds and runtime
        architecture = "x86_64"
        layers = lookup(config.shared, "layers", [])
        tracing = lookup(config.shared, "tracing", "PassThrough")
      }
    ]
  ])
  # Functions with API Gateway
  api_functions = {
    for func in local.all_functions :
    func.function_name => func
    if length([for e in func.events : e if e.type == "api"]) > 0
  }
  # Functions with URLs
  url_functions = {
    for func in local.all_functions :
    func.function_name => func
    if length([for e in func.events : e if e.type == "url"]) > 0
  }
}

# Build secret names
locals {
  secret_names = {
    for service_name, config in local.service_configs :
    service_name => "${var.environment}-${var.project_name}-${service_name}-env-${var.aws_region}"
  }
}

# Look up existing secrets
data "aws_secretsmanager_secrets" "lambda_service_secrets" {
  filter {
    name   = "name"
    values = [for name in local.secret_names : name]
  }
}

# Process existing secrets
locals {
  existing_secret_names = toset(data.aws_secretsmanager_secrets.lambda_service_secrets.names)
  existing_secrets = {
    for service_name, secret_name in local.secret_names :
    service_name => service_name
    if contains(local.existing_secret_names, secret_name)
  }
  secret_values = {
    for service_name, config in local.service_configs :
    service_name => {}
  }
}

# Get secret data
data "aws_secretsmanager_secret" "lambda_service_secrets" {
  for_each = local.existing_secrets
  name = local.secret_names[each.key]
}

# Get caller identity for ECR repository URLs
data "aws_caller_identity" "current" {}

# Get secret versions
data "aws_secretsmanager_secret_version" "lambda_service_secrets" {
  for_each = local.existing_secrets
  secret_id = data.aws_secretsmanager_secret.lambda_service_secrets[each.key].id
}

# Merge secret values
locals {
  final_secret_values = {
    for service_name, config in local.service_configs :
    service_name => contains(keys(local.existing_secrets), service_name) ? 
      try(jsondecode(data.aws_secretsmanager_secret_version.lambda_service_secrets[service_name].secret_string), {}) : 
      {}
  }
}

# Lambda execution roles
resource "aws_iam_role" "lambda_execution" {
  for_each = local.service_configs
  # Ensure role name stays under AWS 64-char limit using a shortened key plus hash
  name = "${var.environment}-${var.project_name}-${substr(each.key, 0, 18)}-${substr(md5(each.key), 0, 6)}-lr-${var.aws_region}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
  tags = var.tags
}

# Basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  for_each = local.service_configs
  role       = aws_iam_role.lambda_execution[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# VPC access policy
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  for_each = {
    for name, config in local.service_configs :
    name => config if lookup(config.shared.vpc, "enabled", false)
  }
  role       = aws_iam_role.lambda_execution[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Service-specific permissions
resource "aws_iam_role_policy" "service_permissions" {
  for_each = local.service_configs
  # Shorten policy name to avoid length issues
  name = "${substr(each.key, 0, 24)}-${substr(md5(each.key), 0, 6)}-perms"
  role = aws_iam_role.lambda_execution[each.key].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Effect = "Allow"
          Action = lookup(each.value, "permissions", [])
          Resource = "*"
        },
        {
          Effect = "Allow"
          Action = [
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret"
          ]
          Resource = contains(keys(local.existing_secrets), each.key) ? data.aws_secretsmanager_secret.lambda_service_secrets[each.key].arn : "arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.environment}-${var.project_name}-${each.key}-env-${var.aws_region}-*"
        }
      ],
      var.use_container_images ? [
        {
          Effect = "Allow"
          Action = [
            "ecr:GetAuthorizationToken",
            "ecr:BatchCheckLayerAvailability",
            "ecr:GetDownloadUrlForLayer",
            "ecr:BatchGetImage"
          ]
          Resource = "*"
        }
      ] : []
    )
  })
}

# Create Lambda functions
resource "aws_lambda_function" "service_function" {
  for_each = { 
    for f in local.all_functions : f.function_name => f 
    if var.use_container_images || fileexists("${path.root}/lambda-packages/${f.service_name}.zip") 
  }
  
  depends_on = [
    null_resource.build_missing_images
  ]
  
  lifecycle {
    precondition {
      condition = !var.use_container_images || coalesce(var.lambda_image_tag, "latest") != ""
      error_message = "Lambda image tag must be provided when using container images. Run the GitHub Actions workflow to build and push Lambda images first."
    }
  }
  # Keep name short enough for AWS constraints
  function_name = "${var.environment}-${var.project_name}-${substr(each.key, 0, 24)}-${substr(md5(each.key), 0, 6)}-${var.aws_region}"
  description   = "Lambda function for ${each.value.service_name} - ${each.value.function_name}"
  role          = aws_iam_role.lambda_execution[each.value.service_name].arn
  # Container configuration
  dynamic "image_config" {
    for_each = var.use_container_images ? [1] : []
    content {
      command = ["index.handler"]
    }
  }
  # Runtime configuration
  runtime          = var.use_container_images ? null : each.value.runtime
  handler          = var.use_container_images ? null : each.value.handler
  memory_size      = each.value.memory
  timeout          = each.value.timeout
  # Force x86_64 for all Lambdas
  architectures    = ["x86_64"]
  package_type = var.use_container_images ? "Image" : "Zip"
  image_uri = var.use_container_images ? "${local.all_ecr_repository_urls[each.value.service_name]}:${coalesce(var.lambda_image_tag, "latest")}" : null
  filename         = var.use_container_images ? null : "${path.root}/lambda-packages/${each.value.service_name}.zip"
  source_code_hash = var.use_container_images ? var.lambda_image_tag : (fileexists("${path.root}/lambda-packages/${each.value.service_name}.zip") ? filebase64sha256("${path.root}/lambda-packages/${each.value.service_name}.zip") : null)
  # Environment variables
  environment {
    variables = merge(
      each.value.environment,
      lookup(local.final_secret_values, each.value.service_name, {}),
      {
        ENVIRONMENT = var.environment
        AWS_REGION_NAME = var.aws_region
        SECRETS_LOADED = contains(keys(local.existing_secrets), each.value.service_name) ? "true" : "false"
      }
    )
  }
  # VPC configuration
  dynamic "vpc_config" {
    for_each = each.value.vpc_enabled ? [1] : []
    content {
      subnet_ids         = var.private_subnet_ids
      security_group_ids = [aws_security_group.lambda[each.value.service_name].id]
    }
  }
  # X-Ray tracing
  tracing_config {
    mode = each.value.tracing
  }
  tags = merge(var.tags, {
    Service = each.value.service_name
  })
} 

# Build Docker images for services that don't have ECR repositories yet
resource "null_resource" "build_missing_images" {
  for_each = {
    for service_name, config in local.service_configs :
    service_name => config
    if var.use_container_images && (!contains(keys(var.ecr_repository_urls), service_name) || length(var.ecr_repository_urls) == 0)
  }
  
  triggers = {
    service_name = each.key
    source_hash = local.service_types[each.key].has_package_json ? filebase64sha256("${path.root}/../services/${each.key}/package.json") : (local.service_types[each.key].has_requirements ? filebase64sha256("${path.root}/../services/${each.key}/requirements.txt") : filebase64sha256("${path.root}/../services/${each.key}/lambda.config.json"))
    dockerfile_hash = local.service_types[each.key].dockerfile != null ? filebase64sha256(local.service_types[each.key].dockerfile) : "no-dockerfile"
    image_tag = var.lambda_image_tag
  }
  
  provisioner "local-exec" {
    command = <<-EOT
      echo "Building Docker image for ${each.key}..."
      cd ${path.root}/../services/${each.key}
      
      # Validate service has required files
      if [ ! -f "lambda.config.json" ]; then
        echo "Error: lambda.config.json not found for service ${each.key}"
        exit 1
      fi
      
      # Check if service has either package.json or requirements.txt
      if [ ! -f "package.json" ] && [ ! -f "requirements.txt" ]; then
        echo "Error: Service ${each.key} must have either package.json (Node.js) or requirements.txt (Python)"
        exit 1
      fi
      
      # Force platform to linux/amd64 for faster builds
      PLATFORM="linux/amd64"

      # Compute ECR repo
      ECR_REPO="${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.environment}/${var.project_name}-${each.key}"

      # Use aws profile if available
      PROFILE_FLAG=""
      if aws configure list-profiles 2>/dev/null | grep -qx "legitmark"; then PROFILE_FLAG="--profile legitmark"; fi

      # Ensure ECR repository exists (create if missing)
      aws $PROFILE_FLAG ecr describe-repositories --repository-names "${var.environment}/${var.project_name}-${each.key}" --region ${var.aws_region} >/dev/null 2>&1 || \
      aws $PROFILE_FLAG ecr create-repository --repository-name "${var.environment}/${var.project_name}-${each.key}" --region ${var.aws_region} >/dev/null

      # ECR login
      aws $PROFILE_FLAG ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com

      # Check if Dockerfile exists in current directory
      if [ ! -f "Dockerfile" ]; then
        echo "Error: Service-specific Dockerfile not found for service ${each.key}"
        echo "Each service must have its own Dockerfile at ${path.root}/../services/${each.key}/Dockerfile"
        exit 1
      fi
      
      echo "Using Dockerfile: Dockerfile"
      
      # Build and push image using standard docker (amd64)
      docker build \
        --platform "$PLATFORM" \
        --file "Dockerfile" \
        --tag "$ECR_REPO:latest" \
        --tag "$ECR_REPO:${var.lambda_image_tag}" \
        .
      docker push "$ECR_REPO:latest"
      docker push "$ECR_REPO:${var.lambda_image_tag}"
    EOT
  }
}

# Create ECR repositories for services that don't have them
resource "aws_ecr_repository" "missing_services" {
  # Disabled: Do not manage ECR repositories with Terraform in this project
  for_each = {}

  name                 = "${var.environment}/${var.project_name}-${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = var.tags
}

# Combine existing and new ECR repository URLs
locals {
  all_ecr_repository_urls = merge(
    {
      for service_name, _ in local.service_configs :
      service_name => "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.environment}/${var.project_name}-${service_name}"
    },
    var.ecr_repository_urls
  )
} 