output "bastion_instance_id" {
  description = "ID of the bastion host instance"
  value       = aws_instance.bastion.id
}

output "bastion_public_ip" {
  description = "Public IP address of the bastion host"
  value       = var.enable_elastic_ip ? aws_eip.bastion[0].public_ip : aws_instance.bastion.public_ip
}

output "bastion_private_ip" {
  description = "Private IP address of the bastion host"
  value       = aws_instance.bastion.private_ip
}

output "bastion_security_group_id" {
  description = "ID of the bastion host security group"
  value       = aws_security_group.bastion.id
}

output "ssh_command" {
  description = "SSH command to connect to the bastion host"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${var.enable_elastic_ip ? aws_eip.bastion[0].public_ip : aws_instance.bastion.public_ip}"
}

output "ssh_tunnel_command" {
  description = "SSH tunnel command for local database access"
  value       = "ssh -L 5432:${var.rds_endpoint}:5432 -i ~/.ssh/${var.key_name}.pem ec2-user@${var.enable_elastic_ip ? aws_eip.bastion[0].public_ip : aws_instance.bastion.public_ip}"
}

output "local_psql_command" {
  description = "PostgreSQL command to use after SSH tunnel is established"
  value       = "psql -h localhost -p 5432 -U ${var.database_username} -d ${var.database_name}"
} 