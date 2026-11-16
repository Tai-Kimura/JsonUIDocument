# Remote state on S3 with native locking (use_lockfile, Terraform >= 1.11).
# The bucket is bootstrapped out-of-band (see infra/DESIGN.md §7). Its name is not committed:
# it is passed at init (partial backend configuration) — copy backend.hcl.example to
# backend.hcl (gitignored) and run `terraform init -backend-config=backend.hcl`.
terraform {
  backend "s3" {
    key          = "jsonui-doc/terraform.tfstate"
    region       = "ap-northeast-1"
    profile      = "tanosys"
    encrypt      = true
    use_lockfile = true
  }
}
