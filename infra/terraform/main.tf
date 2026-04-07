terraform {
  required_version = ">= 1.5"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
  }

  # Remote state — uncomment one of the options below:
  #
  # Option A: Terraform Cloud (free tier, recommended)
  # cloud {
  #   organization = "pickle"
  #   workspaces {
  #     tags = ["pickle"]
  #   }
  # }
  #
  # Option B: S3-compatible backend (e.g., Hetzner Object Storage)
  # backend "s3" {
  #   bucket                      = "pickle-tfstate"
  #   key                         = "terraform.tfstate"
  #   region                      = "eu-central-1"
  #   endpoint                    = "https://fsn1.your-objectstorage.com"
  #   skip_credentials_validation = true
  #   skip_metadata_api_check     = true
  #   skip_region_validation      = true
  #   force_path_style            = true
  # }
}

provider "hcloud" {
  token = var.hcloud_token
}
