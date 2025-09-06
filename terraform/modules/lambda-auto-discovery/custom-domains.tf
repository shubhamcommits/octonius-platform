# Custom domain configuration for API Gateway

# Look up the Route53 hosted zone for the domain
data "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}

# Look up existing wildcard certificate
data "aws_acm_certificate" "wildcard" {
  count    = var.domain_name != "" ? 1 : 0
  domain   = "*.${var.domain_name}"
  statuses = ["ISSUED"]
}


# Only create custom domain resources if we have valid domain configuration
locals {
  custom_domains_enabled = var.domain_name != "" && length(local.service_domain_configs) > 0
  route53_zone_id = var.domain_name != "" ? data.aws_route53_zone.main[0].zone_id : ""
}
locals {
  # Filter services that have custom domains configured
  # Check if any function from the service has API events
  service_has_api = {
    for service_name, _ in local.service_configs :
    service_name => anytrue([
      for func in local.all_functions :
      func.service_name == service_name && length([for e in func.events : e if e.type == "api"]) > 0
    ])
  }
  
  # Get domain configurations from service configs
  services_with_domains = {
    for service_name, domain_config in local.service_domain_configs :
    service_name => {
      domain_name = lookup(domain_config, "subdomain", service_name) == "" ? var.domain_name : (var.environment == "prod" ? "${lookup(domain_config, "subdomain", service_name)}.${var.domain_name}" : "${var.environment}-${lookup(domain_config, "subdomain", service_name)}.${var.domain_name}")
      certificate_arn = var.domain_name != "" ? data.aws_acm_certificate.wildcard[0].arn : null
      hosted_zone_id  = local.route53_zone_id
      create_dns      = lookup(domain_config, "createDns", true)
    }
    if lookup(local.service_has_api, service_name, false) && var.domain_name != "" && local.route53_zone_id != ""
  }
}

# Note: Using single wildcard certificate (*.octonius.com) for all environments
# - Production: resource.octonius.com
# - Development: dev-resource.octonius.com

# API Gateway custom domain
resource "aws_apigatewayv2_domain_name" "api" {
  for_each = local.services_with_domains

  domain_name = each.value.domain_name

  domain_name_configuration {
    certificate_arn = each.value.certificate_arn  # Use existing wildcard certificate
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = merge(var.tags, {
    Service = each.key
  })
}

# API mapping to connect domain to API Gateway
resource "aws_apigatewayv2_api_mapping" "api" {
  for_each = local.services_with_domains

  api_id      = aws_apigatewayv2_api.service[each.key].id
  domain_name = aws_apigatewayv2_domain_name.api[each.key].id
  stage       = aws_apigatewayv2_stage.service[each.key].id
  
  # Empty API mapping key maps the custom domain root to the API Gateway root
  # Since each service has its own API Gateway, we can use root paths
  api_mapping_key = ""
}

# Route53 A record for custom domain
resource "aws_route53_record" "api_domain" {
  for_each = {
    for service, config in local.services_with_domains :
    service => config
    if config.create_dns && config.hosted_zone_id != null
  }

  zone_id = each.value.hosted_zone_id
  name    = each.value.domain_name
  type    = "A"

  alias {
    name                   = aws_apigatewayv2_domain_name.api[each.key].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api[each.key].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# Outputs for custom domains
output "custom_domain_names" {
  value = {
    for service, domain in aws_apigatewayv2_domain_name.api :
    service => {
      domain_name = domain.domain_name
      endpoint    = domain.domain_name_configuration[0].target_domain_name
    }
  }
  description = "Custom domain names and their API Gateway endpoints"
}

output "custom_domain_urls" {
  value = {
    for service, config in local.services_with_domains :
    service => "https://${config.domain_name}"
  }
  description = "Full URLs for custom domains"
}