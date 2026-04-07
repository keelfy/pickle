resource "hcloud_ssh_key" "deploy" {
  name       = "pickle-${var.environment}-deploy"
  public_key = file(var.ssh_public_key_path)
}

resource "hcloud_server" "pickle" {
  name        = "pickle-${var.environment}"
  image       = "ubuntu-24.04"
  server_type = var.server_type
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.deploy.id]

  user_data = templatefile("${path.module}/templates/cloud-init.yml", {
    deploy_user    = var.deploy_user
    ssh_public_key = file(var.ssh_public_key_path)
    environment    = var.environment
    domain         = var.domain
  })

  labels = {
    environment = var.environment
    project     = "pickle"
  }

  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }

  lifecycle {
    ignore_changes = [user_data]
  }
}

# Reverse DNS
resource "hcloud_rdns" "pickle_ipv4" {
  server_id  = hcloud_server.pickle.id
  ip_address = hcloud_server.pickle.ipv4_address
  dns_ptr    = var.environment == "production" ? var.domain : "${var.environment}.${var.domain}"
}

# Attach volume for persistent data
resource "hcloud_volume" "data" {
  name      = "pickle-${var.environment}-data"
  size      = var.environment == "production" ? 50 : 20
  server_id = hcloud_server.pickle.id
  location  = var.location
  format    = "ext4"

  labels = {
    environment = var.environment
    project     = "pickle"
  }
}
