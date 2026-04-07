output "server_ip" {
  description = "Public IPv4 address of the server"
  value       = module.pickle_server.server_ip
}

output "server_ipv6" {
  description = "Public IPv6 address of the server"
  value       = module.pickle_server.server_ipv6
}

output "server_name" {
  description = "Name of the server"
  value       = module.pickle_server.server_name
}

output "server_status" {
  description = "Status of the server"
  value       = module.pickle_server.server_status
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh ${var.deploy_user}@${module.pickle_server.server_ip}"
}
