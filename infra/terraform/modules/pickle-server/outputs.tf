output "server_ip" {
  description = "Public IPv4 address"
  value       = hcloud_server.pickle.ipv4_address
}

output "server_ipv6" {
  description = "Public IPv6 address"
  value       = hcloud_server.pickle.ipv6_address
}

output "server_name" {
  description = "Server name"
  value       = hcloud_server.pickle.name
}

output "server_status" {
  description = "Server status"
  value       = hcloud_server.pickle.status
}

output "server_id" {
  description = "Server ID"
  value       = hcloud_server.pickle.id
}

output "volume_id" {
  description = "Data volume ID"
  value       = hcloud_volume.data.id
}
