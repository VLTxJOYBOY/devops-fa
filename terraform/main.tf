terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  required_version = ">= 1.6.0"
}

provider "aws" {
  region = "ap-southeast-2"
}

# Find the latest Ubuntu 24.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true

  owners = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# Default VPC
data "aws_vpc" "default" {
  default = true
}

# Default subnet
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security group
resource "aws_security_group" "pulsecity" {
  name        = "pulsecity-sg"
  description = "Security group for PulseCity"
  vpc_id      = data.aws_vpc.default.id

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # PulseCity backend
  ingress {
    description = "Backend"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # PulseCity frontend / Grafana direct access
  ingress {
    description = "Frontend and Grafana"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Prometheus
  ingress {
    description = "Prometheus"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "PulseCity-SecurityGroup"
  }
}

# EC2 instance
resource "aws_instance" "pulsecity" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  subnet_id = data.aws_subnets.default.ids[0]

  vpc_security_group_ids = [
    aws_security_group.pulsecity.id
  ]

  associate_public_ip_address = true

  key_name = var.key_name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              set -e
              exec > /var/log/pulsecity-bootstrap.log 2>&1

              echo "=== 1. Setting up 2GB Swap ==="
              fallocate -l 2G /swapfile
              chmod 600 /swapfile
              mkswap /swapfile
              swapon /swapfile
              echo '/swapfile none swap sw 0 0' >> /etc/fstab

              echo "=== 2. Installing Docker & Git ==="
              apt-get update -y
              apt-get install -y docker.io docker-compose-v2 git curl
              systemctl enable --now docker
              usermod -aG docker ubuntu

              echo "=== 3. Cloning PulseCity Repository ==="
              mkdir -p /home/ubuntu/PulseCity
              git clone https://github.com/VLTxJOYBOY/devops-fa.git /home/ubuntu/PulseCity
              chown -R ubuntu:ubuntu /home/ubuntu/PulseCity

              echo "=== 4. Setting up Backend Environment ==="
              cat << 'ENVFILE' > /home/ubuntu/PulseCity/backend/.env
PORT=5000
MONGO_URI=mongodb+srv://om:OmPatil6268@cluster3.mongodb.net/pulsecity?retryWrites=true&w=majority
JWT_SECRET=pulse_city_production_super_secret_jwt_key_2026_secured
ENVFILE
              chown ubuntu:ubuntu /home/ubuntu/PulseCity/backend/.env
              chmod 600 /home/ubuntu/PulseCity/backend/.env

              echo "=== 5. Launching PulseCity with Docker Compose ==="
              cd /home/ubuntu/PulseCity
              docker compose up -d --build

              echo "=== PulseCity Startup Complete! ==="
              EOF

  tags = {
    Name = "PulseCity-Server"
  }
}

output "instance_public_ip" {
  description = "Public IP of PulseCity server"
  value       = aws_instance.pulsecity.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of PulseCity server"
  value       = aws_instance.pulsecity.public_dns
}
