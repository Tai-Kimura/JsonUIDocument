data "aws_caller_identity" "current" {}

# Existing public hosted zone for tanosys.com (managed elsewhere; we only add records).
data "aws_route53_zone" "root" {
  name         = "${var.root_domain}."
  private_zone = false
}

# The GitHub Actions OIDC provider already exists in this account — reference it,
# do not recreate (one provider per URL per account).
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}
