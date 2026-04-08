# Private network for future multi-server setups
resource "hcloud_network" "pickle" {
  name     = "pickle-${var.environment}"
  ip_range = "10.0.0.0/16"
}

resource "hcloud_network_subnet" "pickle" {
  network_id   = hcloud_network.pickle.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = "10.0.1.0/24"
}
