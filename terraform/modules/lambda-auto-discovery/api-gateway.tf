# Create a map of services that have API functions
locals {
  # Group functions by service
  services_with_api_functions = {
    for service_name in distinct([for func in local.all_functions : func.service_name]) :
    service_name => [
      for func in local.all_functions :
      func if func.service_name == service_name && length([for e in func.events : e if e.type == "api"]) > 0
    ]
    if length([
      for func in local.all_functions :
      func if func.service_name == service_name && length([for e in func.events : e if e.type == "api"]) > 0
    ]) > 0
  }
}

# API Gateway per service
resource "aws_apigatewayv2_api" "service" {
  for_each = local.services_with_api_functions
  
  name          = "${var.environment}-${var.project_name}-${each.key}-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    expose_headers    = ["*"]
    max_age           = 300
  }
  
  tags = merge(var.tags, {
    Service = each.key
  })
}

# JWT Authorizer per service (if needed)
resource "aws_apigatewayv2_authorizer" "jwt" {
  for_each = var.jwt_issuer != "" ? tomap(local.services_with_api_functions) : tomap({})
  
  api_id           = aws_apigatewayv2_api.service[each.key].id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${each.key}-jwt-authorizer"
  
  jwt_configuration {
    audience = var.jwt_audience
    issuer   = var.jwt_issuer
  }
}

# Lambda integrations per service
resource "aws_apigatewayv2_integration" "lambda" {
  for_each = local.api_functions
  
  api_id             = aws_apigatewayv2_api.service[each.value.service_name].id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.service_function[each.key].invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

# Routes per service
resource "aws_apigatewayv2_route" "lambda" {
  for_each = local.api_functions
  
  api_id    = aws_apigatewayv2_api.service[each.value.service_name].id
  route_key = "${each.value.events[0].method} ${each.value.events[0].path}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda[each.key].id}"
  
  authorization_type = lookup(each.value.events[0], "authorizer", false) && var.jwt_issuer != "" ? "JWT" : "NONE"
  authorizer_id      = lookup(each.value.events[0], "authorizer", false) && var.jwt_issuer != "" ? try(aws_apigatewayv2_authorizer.jwt[each.value.service_name].id, null) : null
}

# API Gateway stage per service
resource "aws_apigatewayv2_stage" "service" {
  for_each = local.services_with_api_functions
  
  api_id      = aws_apigatewayv2_api.service[each.key].id
  name        = "$default"
  auto_deploy = true
  
  default_route_settings {
    throttling_rate_limit  = 100
    throttling_burst_limit = 200
  }
  
  tags = merge(var.tags, {
    Service = each.key
  })
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  for_each = local.api_functions
  
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.service_function[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.service[each.value.service_name].execution_arn}/*/*"
}

# Lambda Function URLs for webhooks
resource "aws_lambda_function_url" "webhook" {
  for_each = local.url_functions
  
  function_name      = aws_lambda_function.service_function[each.key].function_name
  authorization_type = "NONE"
  
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    expose_headers    = ["*"]
    max_age           = 300
  }
}

# Output API Gateway URLs per service
output "api_gateway_urls" {
  value = {
    for service, stage in aws_apigatewayv2_stage.service :
    service => stage.invoke_url
  }
  description = "API Gateway URLs for each service"
}

# Output Lambda Function URLs
output "lambda_function_urls" {
  value = {
    for name, url in aws_lambda_function_url.webhook :
    name => url.function_url
  }
  description = "Lambda Function URLs for webhooks"
} 