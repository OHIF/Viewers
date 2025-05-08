variable "buckets" {
  description = "a list of buckets to create"
  type = list(object({
    name                    = string
    iam_role_required       = bool
    service_principal       = string
    allow_cloudfront_access = bool
    actions                 = list(string)
  }))
}

variable "malware_protection" {
  description = "variables needed for malware protection"
  type = object({
    malware_protection_bucket               = string
    malware_quarantine_bucket               = string
    sqs_dlq_trigger_malware_scan_name       = string
    sqs_dlq_trigger_malware_scan_event_rule = string
    sqs_dlq_trigger_lambda_name             = string
    sqs_dlq_trigger_lambda_event_rule       = string
    sqs_dlq_trigger_sns_name                = string
    sqs_dlq_trigger_sns_event_rule          = string
    target_lambda                           = string
    sns_topic_name                          = string
  })
}

variable "s3_force_destroy" {
  description = "destroy s3 bucket"
  type        = string
  default     = true
}

variable "s3_elb_log_delivery_policy" {
  description = "policy allowing elb to deliver logs to s3 bucket"
  type        = string
  default     = true
}

variable "s3_lb_log_delivery_policy" {
  description = "policy allowing lb to deliver logs to s3 bucket"
  type        = string
  default     = true
}

variable "s3_access_log_delivery_policy" {
  description = "policy allowing aws services to deliver access logs to s3 bucket"
  type        = string
  default     = true
}

variable "s3_deny_insecure_transport_policy" {
  description = "policy that denies insecure transport to s3 bucket"
  type        = string
  default     = true
}

variable "s3_require_latest_tls_policy" {
  description = "policy that requires latest version of tls"
  type        = string
  default     = true
}

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

variable "region" {
  description = "Region to deploy resource to"
  type        = string
}

variable "cloudtrail" {
  description = "a list of variables needed for cloudtrail"
  type = object({
    cloudtrail_name           = string
    cloudtrail_bucket         = string
    cloudtrail_replica_bucket = string
    ew2_log_group             = string
    ew1_log_group             = string
  })
}



