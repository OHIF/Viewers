resource "aws_route53_record" "ohif_viewer" {
  zone_id = local.zone_id
  name    = local.domain
  type    = "A"

  alias {
    name                   = module.frontend_cdn.cf_domain_name
    zone_id                = module.frontend_cdn.cf_hosted_zone_id
    evaluate_target_health = true
  }
}