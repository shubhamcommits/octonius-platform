# Bastion Host Module for Secure Database Access
# This creates a small EC2 instance in a public subnet that can be used
# to securely access RDS instances in private subnets

# Data source for latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security Group for Bastion Host
resource "aws_security_group" "bastion" {
  name        = "${var.environment}-${var.project_name}-bastion-${var.region}"
  description = "Security group for bastion host"
  vpc_id      = var.vpc_id

  # Allow SSH from whitelisted IPs only
  dynamic "ingress" {
    for_each = var.whitelisted_ips != null ? var.whitelisted_ips : {}
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value.cidr]
      description = "SSH access from ${ingress.value.description}"
    }
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-${var.project_name}-bastion-${var.region}"
    }
  )
}

# Bastion Host EC2 Instance
resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  vpc_security_group_ids = [aws_security_group.bastion.id]
  subnet_id             = var.public_subnet_id
  key_name              = var.key_name

  # Install PostgreSQL client and AWS CLI
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    rds_endpoint     = var.rds_endpoint != null ? var.rds_endpoint : "placeholder"
    database_name    = var.database_name
    database_username = var.database_username
    rds_secret_arn   = var.rds_secret_arn != null ? var.rds_secret_arn : "placeholder"
  }))

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-${var.project_name}-bastion-${var.region}"
      Type = "Bastion"
    }
  )
}

# Elastic IP for Bastion Host (optional but recommended)
resource "aws_eip" "bastion" {
  count = var.enable_elastic_ip ? 1 : 0

  instance = aws_instance.bastion.id
  domain   = "vpc"

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-${var.project_name}-bastion-eip-${var.region}"
    }
  )
} 