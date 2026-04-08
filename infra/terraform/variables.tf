variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "server_type" {
  description = "Hetzner server type (e.g. cx22, cx32, cx42)"
  type        = string
  default     = "cx22"
}

variable "location" {
  description = "Hetzner datacenter location"
  type        = string
  default     = "fsn1"
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key for server access"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "domain" {
  description = "Domain name for the application (e.g. pickle.pw)"
  type        = string
}

variable "deploy_user" {
  description = "Username for the deploy user on the server"
  type        = string
  default     = "deploy"
}
