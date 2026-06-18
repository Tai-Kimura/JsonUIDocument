# Remote state on S3 with native locking (use_lockfile, Terraform >= 1.11).
# The bucket is bootstrapped out-of-band (see infra/DESIGN.md §7).
terraform {
  backend "s3" {
    bucket       = "tanosys-terraform-state-544218887430"
    key          = "jsonui-doc/terraform.tfstate"
    region       = "ap-northeast-1"
    profile      = "tanosys"
    encrypt      = true
    use_lockfile = true
  }
}
