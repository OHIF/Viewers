provider "aws" {
  alias  = "global"
  region = "us-east-1"
}

#locals {
#  b2c = jsondecode(data.aws_secretsmanager_secret_version.b2c_secret_version.secret_string)["B2C"]
#}

## This block retrieves the secret metadata
#data "aws_secretsmanager_secret" "b2c_secret" {
#  name = "B2C" # Name of the secret in AWS Secrets Manager
#}

## This block retrieves the secret's current value
#data "aws_secretsmanager_secret_version" "b2c_secret_version" {
#  secret_id = data.aws_secretsmanager_secret.b2c_secret.id
#}

#This data block retrieves the WAF ID
data "aws_wafv2_web_acl" "this" {
  name     = "aw-pets-euw-cloudfront_webacl"
  scope    = "CLOUDFRONT"
  provider = aws.global
}

## This data block is retrieving the certificate
#data "aws_acm_certificate" "this" {
#  domain   = var.cloudfront.route53_domain
#  statuses = ["ISSUED"]
#  provider = aws.global
#}

module "tags" {
  source = "git@github.com:UKHSA-Internal/devops-terraform-modules//terraform-modules/helpers/tags?ref=4cbd309"

  project         = var.tags.project
  client          = var.tags.client
  owner           = var.tags.owner
  environment     = var.tags.environment
  additional_tags = var.tags.additional_tags
}

##retrieving the apigateway id to use as an origin for cloudfront
#data "aws_api_gateway_rest_api" "this" {
#  name = var.apigateway.api_gateway_name
#}

## disabling cloudfront caching on our api behaviour
#data "aws_cloudfront_cache_policy" "this" {
#  name = "Managed-CachingDisabled"
#}

## policy to forward all parameters in viewer requests except for host header on our api behaviour
#data "aws_cloudfront_origin_request_policy" "this" {
#  name = "Managed-AllViewerExceptHostHeader"
#}

module "cdn" {
  source  = "terraform-aws-modules/cloudfront/aws"
  version = "~> 4.0"
  aliases = [var.cloudfront.route53_domain]
  #checkov:skip=CKV_TF_1:UKHSA "Internal module, release process to be defined"
  #checkov:skip=CKV_TF_2:UKHSA "Internal module, release process to be defined"

  comment             = var.cloudfront.comment
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_All"
  retain_on_delete    = false
  wait_for_deployment = false

  create_origin_access_control = true
  default_root_object          = "index.html"

  #creating origin access control for the S3 
  origin_access_control = {
    s3_oac = {
      description      = var.cloudfront.s3_one_description
      origin_type      = "s3"
      signing_behavior = "always"
      signing_protocol = "sigv4"
    }
  }

  #attaching log bucket to cloudfront
  logging_config = {
    bucket = var.cloudfront.cloudfront_log_bucket
  }

  origin = {
    #domain origin
    something = {
      domain_name = var.cloudfront.domain_name
      custom_origin_config = {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "match-viewer"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }

    #frontend s3 origin
    s3_oac = {
      domain_name           = var.cloudfront.s3_one
      origin_access_control = "s3_oac"
    }

    #api origin
#    api = {
#      domain_name = "${data.aws_api_gateway_rest_api.this.id}.execute-api.${var.region}.amazonaws.com"
#      custom_origin_config = {
#        http_port              = 80
#        https_port             = 443
#        origin_protocol_policy = "match-viewer"
#        origin_ssl_protocols   = ["TLSv1.2"]
#      }
#      # will need authoriser as custom header later
#      # custom_header= [{
#      #   name = "authorizer"
#      #   value = "authorizer"
#      # }]
#    }

#    #malware s3 origin
#    malware = {
#      domain_name           = var.cloudfront.s3_malware
#      origin_access_control = "s3_oac"
#    }
  }

  # default caching behaviour which will route all default requests/paths to s3 origin
  default_cache_behavior = {
    target_origin_id       = "s3_oac"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    compress        = true
    query_string    = true

    response_headers_policy_id = aws_cloudfront_response_headers_policy.this.id

    function_association = {
      viewer-request = {
        function_arn = aws_cloudfront_function.this.arn
      }
    }
  }

  #caching assets from frontend s3 origin
#  ordered_cache_behavior = [
#    {
#      path_pattern           = "/assets/*"
#      target_origin_id       = "s3_oac"
#      viewer_protocol_policy = "redirect-to-https"
#
#      allowed_methods = ["GET", "HEAD", "OPTIONS"]
#      compress        = true
#
#      query_string = true
#    },

    #caching api from apigateway origin
#    {
#      path_pattern           = "/api/*"
#      target_origin_id       = "api"
#      viewer_protocol_policy = "redirect-to-https"
#
#      allowed_methods      = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "PATCH"]
#      use_forwarded_values = false
#
#      cache_policy_id          = data.aws_cloudfront_cache_policy.this.id
#      origin_request_policy_id = data.aws_cloudfront_origin_request_policy.this.id
#    }
#  ]

  #adding certificate in 
#  viewer_certificate = {
#    acm_certificate_arn            = data.aws_acm_certificate.this.arn
#    cloudfront_default_certificate = false
#    ssl_support_method             = "sni-only"
#    minimum_protocol_version       = "TLSv1.2_2021"
#  }

  web_acl_id = data.aws_wafv2_web_acl.this.arn
  tags       = module.tags.tags
}

# retrieving route 53 zone name needed to connect cloudfront to domain
#data "aws_route53_zone" "this" {
#  name = var.cloudfront.route53_domain
#}

#adding a record from the domain name to connect the cloudfront to the domain
#module "records" {
#  source  = "terraform-aws-modules/route53/aws//modules/records"
#  version = "~> 5.0"
#
#  zone_id = data.aws_route53_zone.this.zone_id
#
#  records = [
#    {
#      name = ""
#      type = "AAAA"
#      alias = {
#        name    = module.cdn.cloudfront_distribution_domain_name
#        zone_id = module.cdn.cloudfront_distribution_hosted_zone_id
#      }
#    },
#    {
#      name = ""
#      type = "A"
#      alias = {
#        name    = module.cdn.cloudfront_distribution_domain_name
#        zone_id = module.cdn.cloudfront_distribution_hosted_zone_id
#      }
#    },
#    {
#      name = "www"
#      type = "CNAME"
#
#      alias = {
#        name    = module.cdn.cloudfront_distribution_domain_name
#        zone_id = module.cdn.cloudfront_distribution_hosted_zone_id
#      }
#    },
#  ]
#}

#viewer request function for default behaviour (route user back to default)
resource "aws_cloudfront_function" "this" {
  name    = "function"
  runtime = "cloudfront-js-2.0"
  code    = file("function.js")
}

#content security policy (csp) response header policy for default behaviour
#resource "aws_cloudfront_response_headers_policy" "this" {
#  name = "csp-policy"
#  security_headers_config {
#    content_security_policy {
#      override                = true
#      content_security_policy = "default-src 'self' https:; script-src 'self'; img-src 'self' https: data:; style-src 'self'; frame-ancestors 'self' https://login.microsoftonline.com ${local.b2c}; frame-src 'self' https://login.microsoftonline.com ${local.b2c}; connect-src 'self' https://login.microsoftonline.com ${local.b2c} ${var.cloudfront.https_s3_malware}; base-uri 'self'; object-src 'none';"
#    }
#  }
#}


#creating the cloudwatch log group for route53
#module "route_53_log_group" {
#  source  = "terraform-aws-modules/cloudwatch/aws//modules/log-group"
#  version = "~> 5.0"
#  providers = {
#    aws = aws.global
#  }
#
#  name = "${var.cloudfront.route_53_query_log_group}/${var.cloudfront.route53_domain}"
#
#  retention_in_days = 30
#}

#creating cloudwatch policy for route53
#data "aws_iam_policy_document" "route53-query-logging-policy" {
#  statement {
#    actions = [
#      "logs:CreateLogStream",
#      "logs:PutLogEvents",
#    ]
#
#    resources = ["arn:aws:logs:*:*:log-group:/aws/route53/*"]
#
#    principals {
#      identifiers = ["route53.amazonaws.com"]
#      type        = "Service"
#    }
#  }
#}

# attaching policy to cloudwatch log resource policy
#resource "aws_cloudwatch_log_resource_policy" "route53-query-logging-policy" {
#  provider = aws.global
#
#  policy_document = data.aws_iam_policy_document.route53-query-logging-policy.json
#  policy_name     = "route53-query-logging-policy"
#}

# creating a route 53 query logging
#resource "aws_route53_query_log" "this" {
#  depends_on               = [aws_cloudwatch_log_resource_policy.route53-query-logging-policy]
#  cloudwatch_log_group_arn = module.route_53_log_group.cloudwatch_log_group_arn
#  zone_id                  = data.aws_route53_zone.this.zone_id
#}