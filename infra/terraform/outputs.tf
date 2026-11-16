output "site_url" {
  description = "Public URL of the docs site."
  value       = "https://${var.site_fqdn}"
}

output "site_bucket" {
  description = "Origin S3 bucket name (deploy target for aws s3 sync)."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "Distribution ID (used for cache invalidation)."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain (dxxxx.cloudfront.net)."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "gha_deploy_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC deploys."
  value       = aws_iam_role.gha_deploy.arn
}
