variable "tags" {
  description = "a list of tags to attach to the resource being deployed"
  type = object({
    project         = string
    client          = string
    owner           = string
    environment     = string
    additional_tags = map(string)
  })
}

variable "cloudfront" {
  type = object({
    cloudfront_log_bucket_name = string
    domain_name                = string
    route53_domain             = string
    cloudfront_log_bucket      = string
    comment                    = string
    s3_one                     = string
    s3_one_description         = string
    s3_one_bucket              = string
    s3_malware                 = string
    https_s3_malware           = string
    route_53_query_log_group   = string
  })
}

variable "apigateway" {
  description = "api gateway name"
  type = object({
    api_gateway_name = string
    stage            = string
    s3_bucket_name   = string
  })
}

variable "region" {
  description = "region"
  type        = string
}