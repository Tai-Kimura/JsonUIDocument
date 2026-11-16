# Default provider: Tokyo region for the S3 origin bucket and IAM.
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  default_tags {
    tags = {
      Project   = "jsonui-doc"
      ManagedBy = "terraform"
      Site      = var.site_fqdn
    }
  }
}

# CloudFront viewer certificates must live in us-east-1.
provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = var.aws_profile

  default_tags {
    tags = {
      Project   = "jsonui-doc"
      ManagedBy = "terraform"
      Site      = var.site_fqdn
    }
  }
}
