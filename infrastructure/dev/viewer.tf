###############################################################################
# API ohif_viewer Configuration - Development Environment
###############################################################################

locals {
  forward_header_values = [
    "Content-Type",
    "X-Content-Type-Options",
    "Access-Control-Request-Headers",
    "Access-Control-Request-Method",
    "Origin",
    "If-None-Match",
    "X-Robots-Tag",
    "Authorization"
  ]
}

################################ Frontend CDN  #########################################################################
########################################################################################################################
locals {
  frontend_cdn_name = "ohif-viewer-frontend"
}
module "frontend_cdn" {
  source                              = "cloudposse/cloudfront-s3-cdn/aws"
  version                             = "v0.97.0"
  label_order                         = ["name", "attributes", "namespace"]
  namespace                           = local.environment
  environment                         = local.environment
  tags                                = local.tags
  origin_force_destroy                = true
  override_origin_bucket_policy       = true
  external_aliases                    = ["view.dev.floy.com"]
  acm_certificate_arn                 = local.acm_floy_certificate_arn_us_east_1
  dns_alias_enabled                   = true
  parent_zone_name                    = "dev.floy.com"
  cors_expose_headers                 = ["ETag"]
  cors_allowed_headers                = ["*"]
  cors_allowed_methods                = ["GET", "HEAD"]
  cors_allowed_origins                = ["https://view.dev.floy.com"]
  cors_max_age_seconds                = 3000
  name                                = local.frontend_cdn_name
  allow_ssl_requests_only             = true
  allowed_methods                     = ["GET", "HEAD", "OPTIONS"]
  cached_methods                      = ["GET", "HEAD", "OPTIONS"]
  block_origin_public_access_enabled  = true # 	When set to 'true' the s3 origin bucket will have public access block enabled
  cloudfront_access_logging_enabled   = false
  cloudfront_access_log_create_bucket = false
  cloudfront_access_log_prefix        = local.frontend_cdn_name
  compress                            = true
  http_version                        = "http2"
  ipv6_enabled                        = false
  minimum_protocol_version            = "TLSv1.2_2021"
  price_class                         = "PriceClass_100"
  realtime_log_config_arn             = null
  wait_for_deployment                 = true
  viewer_protocol_policy              = "redirect-to-https"
  comment                             = "OHIF viewer Frontend Development CDN managed by Terraform"
  default_root_object                 = "index.html"
  forward_query_string                = true
  forward_header_values               = local.forward_header_values
  cache_policy_id                     = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
  custom_error_response = [
    {
      error_code            = 404
      response_page_path    = "/index.html"
      response_code         = 200
      error_caching_min_ttl = 300
    },
    {
      error_code            = 403
      response_page_path    = "/index.html"
      response_code         = 200
      error_caching_min_ttl = 300
    }
  ]
  bucket_versioning  = "Disabled"
  encryption_enabled = true
}

resource "aws_ssm_parameter" "frontend_cdn_id" {
  name  = "/ohif-viewer-frontend/cdn/id"
  type  = "String"
  value = module.frontend_cdn.cf_id
  tags  = local.tags
}

resource "aws_ssm_parameter" "frontend_cdn_bucket" {
  name  = "/ohif-viewer-frontend/bucket/id"
  type  = "String"
  value = module.frontend_cdn.s3_bucket
  tags  = local.tags
}

output "frontend_cdn_bucket" {
  value = module.frontend_cdn.s3_bucket
}

output "frontend_cdn_id" {
  value = module.frontend_cdn.cf_id
}