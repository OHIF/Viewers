data "aws_caller_identity" "current" {}
data "aws_canonical_user_id" "current" {}
data "aws_cloudfront_log_delivery_canonical_user_id" "cloudfront" {}

# This resource block creates the kms key used to encrypt the s3 buckets
resource "aws_kms_key" "objects" {
  description             = "KMS key is used to encrypt bucket objects"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "key-default-1"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        },
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key for cloudfront" #allowing the key to be accessed by our cloudfront distribution
        Effect = "Allow"
        Principal = {
          Service = ["cloudfront.amazonaws.com"]
        },
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey*",
        ],
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key so eventbridge rule can access the dlq" #allowing the key to be accessed by our eventbridge
        Effect = "Allow"
        Principal = {
          Service = ["events.amazonaws.com"]
        },
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey*",
        ],
        Resource = ["arn:aws:events:${var.region}:${data.aws_caller_identity.current.account_id}:rule/${var.malware_protection.sqs_dlq_trigger_malware_scan_event_rule}*", "arn:aws:events:${var.region}:${data.aws_caller_identity.current.account_id}:rule/${var.malware_protection.sqs_dlq_trigger_lambda_event_rule}*", "arn:aws:events:${var.region}:${data.aws_caller_identity.current.account_id}:rule/${var.malware_protection.sqs_dlq_trigger_sns_event_rule}*"]
      },
      {
        Sid    = "Allow use of the key so cloudtrail can use"
        Effect = "Allow"
        Principal = {
          Service = ["cloudtrail.amazonaws.com"]
        },
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey*",
        ],
        Resource = ["arn:aws:cloudtrail:${var.region}:${data.aws_caller_identity.current.account_id}:trail/${var.cloudtrail.cloudtrail_name}*"]
      }
    ]
  })
}

#this resource block adds an alias name to the kms key
resource "aws_kms_alias" "this" {
  name          = "alias/s3-encryption-key"
  target_key_id = aws_kms_key.objects.key_id
}

# this resource block creates an IAM assume role for each bucket
resource "aws_iam_role" "this" {
  for_each = { for bucket in var.buckets : bucket.name => bucket if bucket.iam_role_required }

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Principal = {
          Service = each.value.service_principal
        },
        Effect = "Allow",
        Sid    = ""
      }
    ]
  })
}

# this data block creates a bucket policy for each bucket
data "aws_iam_policy_document" "bucket_policy" {
  for_each = { for bucket in var.buckets : bucket.name => bucket if bucket.iam_role_required }
  statement {
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.this[each.key].arn]
    }

    actions = each.value.actions

    resources = [
      "arn:aws:s3:::${each.value.name}",  # Bucket-level permissions
      "arn:aws:s3:::${each.value.name}/*" # Object-level permissions
    ]
  }

  # Conditionally add CloudFront statement if allow_cloudfront_access = true
  dynamic "statement" {
    for_each = each.value.allow_cloudfront_access ? { enabled = true } : {} #only runs if true

    content {
      actions   = ["s3:GetObject"]
      resources = ["arn:aws:s3:::${each.value.name}/*"]

      principals {
        type        = "Service"
        identifiers = ["cloudfront.amazonaws.com"]
      }
    }
  }
}

module "tags" {
  source = "git@github.com:UKHSA-Internal/devops-terraform-modules//terraform-modules/helpers/tags?ref=4cbd309"

  project         = var.tags.project
  client          = var.tags.client
  owner           = var.tags.owner
  environment     = var.tags.environment
  additional_tags = var.tags.additional_tags
}

# this module creates the log buckets for each bucket
module "log_bucket" {
  for_each = { for bucket in var.buckets : bucket.name => bucket }

  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.6.0"
  tags    = module.tags.tags
  #checkov:skip=CKV_TF_1:UKHSA "Internal module, release process to be defined"
  #checkov:skip=CKV_TF_2:UKHSA "Internal module, release process to be defined"
  bucket        = "logs-${each.value.name}"
  force_destroy = var.s3_force_destroy

  control_object_ownership = true

  attach_elb_log_delivery_policy        = var.s3_elb_log_delivery_policy
  attach_lb_log_delivery_policy         = var.s3_lb_log_delivery_policy
  attach_access_log_delivery_policy     = var.s3_access_log_delivery_policy
  attach_deny_insecure_transport_policy = var.s3_deny_insecure_transport_policy
  attach_require_latest_tls_policy      = var.s3_require_latest_tls_policy
  allowed_kms_key_arn                   = aws_kms_key.objects.arn

  access_log_delivery_policy_source_accounts = [data.aws_caller_identity.current.account_id]
  access_log_delivery_policy_source_buckets  = ["arn:aws:s3:::${each.value.name}"]
  object_lock_enabled                        = true

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        kms_master_key_id = aws_kms_key.objects.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
}

#this module creates the log bucket for cloudfront
module "cloudfront_log_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"
  #checkov:skip=CKV_TF_1:UKHSA "Internal module, release process to be defined"
  #checkov:skip=CKV_TF_2:UKHSA "Internal module, release process to be defined"
  tags                     = module.tags.tags
  bucket                   = var.cloudfront.cloudfront_log_bucket_name
  control_object_ownership = true
  object_ownership         = "BucketOwnerPreferred"

  grant = [{
    type       = "CanonicalUser"
    permission = "FULL_CONTROL"
    id         = data.aws_canonical_user_id.current.id
  }, {
    type       = "CanonicalUser"
    permission = "FULL_CONTROL"
    id         = data.aws_cloudfront_log_delivery_canonical_user_id.cloudfront.id # Ref. https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessLogs.html
  }
  ]

  owner = {
    id = data.aws_canonical_user_id.current.id
  }

  force_destroy = true

  attach_deny_insecure_transport_policy = var.s3_deny_insecure_transport_policy
  attach_require_latest_tls_policy      = var.s3_require_latest_tls_policy

  allowed_kms_key_arn = aws_kms_key.objects.arn
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        kms_master_key_id = aws_kms_key.objects.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
}

module "s3_bucket" {
  for_each = { for bucket in var.buckets : bucket.name => bucket }
  source   = "terraform-aws-modules/s3-bucket/aws"
  version  = "~> 4.6.0"
  #checkov:skip=CKV_TF_1:UKHSA "Internal module, release process to be defined"
  #checkov:skip=CKV_TF_2:UKHSA "Internal module, release process to be defined"
  bucket = each.value.name

  force_destroy = var.s3_force_destroy
  #acceleration_status = "Suspended"
  request_payer = "BucketOwner"

  tags = module.tags.tags

  # Note: Object Lock configuration can be enabled only on new buckets
  # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_object_lock_configuration
  object_lock_enabled = true
  object_lock_configuration = {
    rule = {
      default_retention = {
        mode = "GOVERNANCE"
        days = 1
      }
    }
  }

  # Bucket policies
  attach_policy                            = true
  policy                                   = each.value.iam_role_required ? data.aws_iam_policy_document.bucket_policy[each.key].json : ""
  attach_deny_insecure_transport_policy    = var.s3_deny_insecure_transport_policy
  attach_require_latest_tls_policy         = var.s3_require_latest_tls_policy
  attach_deny_incorrect_encryption_headers = true
  attach_deny_incorrect_kms_key_sse        = true
  allowed_kms_key_arn                      = aws_kms_key.objects.arn
  attach_deny_unencrypted_object_uploads   = true

  # S3 bucket-level Public Access Block configuration (by default now AWS has made this default as true for S3 bucket-level block public access)
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  # S3 Bucket Ownership Controls
  # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_ownership_controls
  control_object_ownership = true
  object_ownership         = "BucketOwnerPreferred"

  acl = "private" # "acl" conflicts with "grant" and "owner"

  # Connecting the buckets to their log buckets
  logging = {
    target_bucket = "logs-${each.value.name}"
    target_prefix = "log/"
  }

  versioning = {
    status     = true
    mfa_delete = false
  }


  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        kms_master_key_id = aws_kms_key.objects.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }

  #  cors_rule = [
  #    {
  #      allowed_methods = ["PUT", "POST"]
  #      allowed_origins = ["https://modules.tf", "https://terraform-aws-modules.modules.tf"]
  #      allowed_headers = ["*"]
  #      expose_headers  = ["ETag"]
  #      max_age_seconds = 3000
  #      }, {
  #      allowed_methods = ["PUT"]
  #      allowed_origins = ["https://example.com"]
  #      allowed_headers = ["*"]
  #      expose_headers  = ["ETag"]
  #      max_age_seconds = 3000
  #      }
  #    ]

  lifecycle_rule = [
    {
      id      = "log"
      enabled = true

      #      filter = {
      #        tags = {
      #          some    = "value"
      #          another = "value2"
      #        }
      #      }


      noncurrent_version_expiration = {
        days = 300
      }
    },
    {
      id      = "log2"
      enabled = true

      #      filter = {
      #        prefix                   = "log1/"
      #        object_size_greater_than = 200000
      #        object_size_less_than    = 500000
      #        tags = {
      #          some    = "value"
      #          another = "value2"
      #        }
      #      }

      noncurrent_version_transition = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        },
      ]

      noncurrent_version_expiration = {
        days = 300
      }
    },
  ]
}

# this resource block adds cors configuration to the image service bucket
resource "aws_s3_bucket_cors_configuration" "this" {
  bucket = var.malware_protection.malware_protection_bucket
  cors_rule {
    allowed_methods = ["POST"]
    allowed_origins = ["https://${var.cloudfront.route53_domain}"]
    allowed_headers = ["*"]
    expose_headers  = []
    max_age_seconds = 3000
  }
}

# Creating the cloudtrail bucket
module "cloudtrail_s3_bucket" {
  source = "cloudposse/cloudtrail-s3-bucket/aws"
  # Cloud Posse recommends pinning every module to a specific version
  version = "~> 0.27.0"
  # namespace = "eg"
  # stage     = "dev"
  name                     = var.cloudtrail.cloudtrail_bucket
  create_access_log_bucket = true
  force_destroy            = true
  sse_algorithm            = "aws:kms"
  kms_master_key_arn       = aws_kms_key.objects.arn
  tags                     = module.tags.tags
}

##############################################################################
############# creating the cloudtrail replica region bucket##################
#############################################################################

# Defines the replica location
provider "aws" {
  alias  = "secondary"
  region = "eu-west-1" # Dublin as secondary region
}

# replica region kms key to encrypt the bucket
resource "aws_kms_key" "replica_bucket" {
  description             = "KMS key is used to encrypt bucket objects"
  provider                = aws.secondary
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "key-default-1"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        },
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key so cloudtrail can use"
        Effect = "Allow"
        Principal = {
          Service = ["cloudtrail.amazonaws.com"]
        },
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey*",
        ],
        Resource = ["arn:aws:cloudtrail:eu-west-1:${data.aws_caller_identity.current.account_id}:trail/${var.cloudtrail.cloudtrail_name}*"]
      }
    ]
  })
}

#this resource block adds an alias name to the kms key
resource "aws_kms_alias" "replica" {
  provider      = aws.secondary
  name          = "alias/replica-s3-encryption-key"
  target_key_id = aws_kms_key.replica_bucket.key_id
}

# Creating the cloudtrail bucket in replica region
module "cloudtrail_s3_replica_bucket" {
  source = "cloudposse/cloudtrail-s3-bucket/aws"
  # Cloud Posse recommends pinning every module to a specific version
  providers = {
    aws = aws.secondary
  }

  version = "~> 0.27.0"

  name                     = var.cloudtrail.cloudtrail_replica_bucket
  create_access_log_bucket = true
  force_destroy            = true
  sse_algorithm            = "aws:kms"
  kms_master_key_arn       = aws_kms_key.replica_bucket.arn
  tags                     = module.tags.tags
}