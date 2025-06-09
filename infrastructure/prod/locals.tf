###############################################################################
# Local Variables - Development Environment
###############################################################################

locals {
  # Environment configuration
  environment                        = "prod"
  region                             = "eu-west-1"
  acm_floy_certificate_arn_us_east_1 = data.terraform_remote_state.security.outputs.acm_floy_certificate_arn_us_east_1
  domain                             = "view-temp.floy.com"
  zone_id                            = data.terraform_remote_state.network.outputs.route53_floy_zone_id
  tags                               = module.labels.tags
}

module "labels" {
  # Use the organization's consistent tagging module with a pinned version for stability
  source = "github.com/FloyAI/tf-module-labels.git?ref=1.3.0"

  team        = "fnd"                  # Foundation team identifier
  env         = local.environment      # Root/management environment
  name        = "ohif-viewer-frontend" # Resource purpose/name
  cost_center = "business_logic"       # Cost allocation identifier
}