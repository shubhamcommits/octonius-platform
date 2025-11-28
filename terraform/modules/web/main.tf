# Provider configuration for us-east-1 (required for ACM certificates used with CloudFront)
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

# S3 bucket for web assets
resource "aws_s3_bucket" "web" {
  bucket = "${var.environment}-${var.project_name}-web-deployment-bucket-${var.aws_region}"
  force_destroy = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-web-deployment-bucket-${var.aws_region}"
    }
  )
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "web" {
  bucket = aws_s3_bucket.web.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "web" {
  bucket = aws_s3_bucket.web.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "web" {
  bucket = aws_s3_bucket.web.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for CloudFront OAC access
resource "aws_s3_bucket_policy" "web" {
  bucket = aws_s3_bucket.web.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalOAC"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.web.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.web.arn
          }
        }
      }
    ]
  })
}

# S3 bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "web" {
  bucket = aws_s3_bucket.web.id

  # Rule to abort incomplete multipart uploads
  rule {
    id     = "abort-incomplete-multipart-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  # Rule to expire non-current versions
  rule {
    id     = "expire-noncurrent-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  # Rule to transition objects to cheaper storage classes
  rule {
    id     = "transition-to-cheaper-storage"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 180
      storage_class = "DEEP_ARCHIVE"
    }
  }

  # Rule to expire old objects
  rule {
    id     = "expire-old-objects"
    status = "Enabled"

    filter {}

    expiration {
      days = 365
    }
  }
}

# CloudFront Origin Access Control (OAC)
resource "aws_cloudfront_origin_access_control" "web" {
  name                              = "${var.environment}-${var.project_name}-web-oac"
  description                       = "OAC for ${var.environment}-${var.project_name}-web"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution (with OAC)
resource "aws_cloudfront_distribution" "web" {
  enabled             = true
  is_ipv6_enabled     = true
  aliases             = ["${var.environment == "prod" ? "app.octonius.com" : "dev.app.octonius.com"}"]
  comment             = "CloudFront distribution for ${var.environment}-${var.project_name}-web"
  default_root_object = "index.html"
  price_class         = var.environment == "prod" ? "PriceClass_All" : "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.web.bucket}"
    origin_access_control_id = aws_cloudfront_origin_access_control.web.id
    origin_path              = "/latest/browser"
    origin_shield {
      enabled              = true
      origin_shield_region = var.aws_region
    }
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.web.bucket}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    # Cache based on file type
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 31536000
  }

  # Custom error responses
  custom_error_response {
    error_code            = 404
    error_caching_min_ttl = 10
    response_code         = 200
    response_page_path    = "/index.html"
  }

  # Custom error response for 403
  custom_error_response {
    error_code            = 403
    error_caching_min_ttl = 10
    response_code         = 200
    response_page_path    = "/index.html"
  }

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL certificate
  viewer_certificate {
    cloudfront_default_certificate = false
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
    acm_certificate_arn            = data.aws_acm_certificate.web.arn
  }

  # Tags
  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-web-cloudfront-distribution-${var.aws_region}"
    }
  )
}

# CloudFront cache policy for static assets
resource "aws_cloudfront_cache_policy" "static_assets" {
  name        = "${var.environment}-${var.project_name}-static-assets"
  comment     = "Cache policy for static assets"
  default_ttl = 31536000 # 1 year
  max_ttl     = 31536000
  min_ttl     = 1

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

# CloudFront cache policy for HTML files
resource "aws_cloudfront_cache_policy" "html_files" {
  name        = "${var.environment}-${var.project_name}-html-files"
  comment     = "Cache policy for HTML files"
  default_ttl = 0
  max_ttl     = 0
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

# CloudFront cache policy for assets
resource "aws_cloudfront_cache_policy" "assets" {
  name        = "${var.environment}-${var.project_name}-assets"
  comment     = "Cache policy for assets"
  default_ttl = 3600  # 1 hour
  max_ttl     = 86400 # 1 day
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

# Get the existing ACM certificate
data "aws_acm_certificate" "web" {
  domain   = var.environment == "prod" ? "app.octonius.com" : "dev.app.octonius.com"
  statuses = ["ISSUED"]
  provider = aws.us-east-1
}