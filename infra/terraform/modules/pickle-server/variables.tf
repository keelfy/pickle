variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
}

variable "server_type" {
  description = "Hetzner server type"
  type        = string
}

variable "location" {
  description = "Hetzner datacenter location"
  type        = string
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key"
  type        = string
}

variable "deploy_user" {
  description = "Username for the deploy user"
  type        = string
}

variable "domain" {
  description = "Domain name for the application"
  type        = string
}
