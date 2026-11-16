variable "aws_profile" {
  description = "AWS CLI named profile used for all API calls."
  type        = string
  default     = "tanosys"
}

variable "aws_region" {
  description = "Primary region for the S3 origin bucket and IAM resources."
  type        = string
  default     = "ap-northeast-1"
}

variable "root_domain" {
  description = "Apex domain whose Route 53 public hosted zone hosts the records."
  type        = string
  default     = "tanosys.com"
}

variable "site_fqdn" {
  description = "Fully-qualified domain the docs site is served on."
  type        = string
  default     = "jsonui.tanosys.com"
}

variable "site_bucket_name" {
  description = "Globally-unique name for the private origin bucket."
  type        = string
  default     = "jsonui-tanosys-com-site"
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_200 = NA/EU/Asia."
  type        = string
  default     = "PriceClass_200"
}

variable "github_repo" {
  description = "owner/name of the GitHub repo allowed to assume the deploy role via OIDC."
  type        = string
  default     = "Tai-Kimura/JsonUIDocument"
}

variable "github_deploy_ref" {
  description = "Git ref allowed to assume the deploy role (branch that triggers deploys)."
  type        = string
  default     = "refs/heads/main"
}
