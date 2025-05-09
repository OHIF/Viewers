tags = {
  project     = "PETS"
  client      = "UKHSA"
  owner       = "UKHSA"
  environment = "dev"
  additional_tags = {
    "CostCenter" = "IT-Dept"
  }
}

buckets = [
  {
    name                    = "aw-pets-euw-dev-s3-dicomviewer",
    iam_role_required       = true
    service_principal       = "cloudfront.amazonaws.com"
    actions                 = ["s3:ListBucket"]
    allow_cloudfront_access = true
  }
]

cloudfront = {
  cloudfront_log_bucket_name = "logs-aw-pets-euw-dev-s3-cloudfront"
  domain_name                = ""
  route53_domain             = ""
  cloudfront_log_bucket      = "logs-aw-pets-euw-dev-s3-cloudfront.s3.amazonaws.com"
  comment                    = "Dicom Viewer Dev CloudFront Distribution"
  s3_one_bucket              = "ohif-viewer-test"
  s3_one                     = "ohif-viewer-test.s3.amazonaws.com"
  s3_one_description         = "Dicom Viewer Dev CloudFront Distribution"
  s3_malware                 = ""
  https_s3_malware           = ""
  route_53_query_log_group   = ""
}

