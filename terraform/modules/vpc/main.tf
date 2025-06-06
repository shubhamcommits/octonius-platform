# VPC Module - Reusable VPC configuration
# Creates VPC with public/private subnets, NAT gateways, and routing

locals {
  # Naming convention: {environment}-{project}-{resource}-{region}
  name_prefix = "${var.environment}-${var.project_name}"

  # Calculate number of AZs to use (max 3 for this setup)
  azs_count = min(length(var.azs), 3)
  azs       = slice(var.azs, 0, local.azs_count)
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-vpc-${var.aws_region}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-igw-${var.aws_region}"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = local.azs_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}-${local.azs[count.index]}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = local.azs_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}-${local.azs[count.index]}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : local.azs_count) : 0

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-eip-nat-${count.index + 1}-${var.aws_region}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : local.azs_count) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_internet_gateway.main]

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}-${local.azs[count.index]}"
  })
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-public-rt-${var.aws_region}"
  })
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count = local.azs_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : local.azs_count) : local.azs_count

  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[var.single_nat_gateway ? 0 : count.index].id
    }
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}-${var.aws_region}"
  })
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count = local.azs_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[var.single_nat_gateway ? 0 : count.index].id
} 