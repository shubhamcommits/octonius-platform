# CloudWatch Log Groups for Lambda functions
resource "aws_cloudwatch_log_group" "lambda" {
  for_each = { for f in local.all_functions : f.function_name => f }
  
  name              = "/aws/lambda/${var.environment}-${each.key}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  
  tags = merge(var.tags, {
    Service  = each.value.service_name
    Function = each.key
  })
}

# CloudWatch Log Streams are created automatically by Lambda

# Optional: Create metric filters for error tracking
resource "aws_cloudwatch_log_metric_filter" "lambda_errors" {
  for_each = { for f in local.all_functions : f.function_name => f }
  
  name           = "${each.key}-errors"
  log_group_name = aws_cloudwatch_log_group.lambda[each.key].name
  pattern        = "[ERROR]"
  
  metric_transformation {
    name      = "${each.key}-error-count"
    namespace = "Lambda/${var.environment}"
    value     = "1"
  }
}

 