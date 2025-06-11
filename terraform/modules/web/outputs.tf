output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.web.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.web.arn
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.web.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.web.domain_name
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.web.arn
}

output "cache_policy_ids" {
  description = "Map of cache policy IDs"
  value = {
    static_assets = aws_cloudfront_cache_policy.static_assets.id
    html_files    = aws_cloudfront_cache_policy.html_files.id
    assets        = aws_cloudfront_cache_policy.assets.id
  }
}

output "cloudfront_oac_id" {
  description = "ID of the CloudFront Origin Access Control (OAC)"
  value       = aws_cloudfront_origin_access_control.web.id
} 