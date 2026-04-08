module "pickle_server" {
  source = "./modules/pickle-server"

  environment         = var.environment
  server_type         = var.server_type
  location            = var.location
  ssh_public_key_path = var.ssh_public_key_path
  deploy_user         = var.deploy_user
  domain              = var.domain
}
