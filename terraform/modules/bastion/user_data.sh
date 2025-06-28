#!/bin/bash
# Bastion Host Setup Script
# This script installs PostgreSQL client and creates helper scripts for database access

# Update system
yum update -y

# Install PostgreSQL 15 client
yum install -y postgresql15

# Install AWS CLI v2 (if not already installed)
if ! command -v aws &> /dev/null; then
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    rm -rf aws awscliv2.zip
fi

# Install jq for JSON processing
yum install -y jq

# Create database connection helper script
cat > /home/ec2-user/connect-db.sh << 'EOF'
#!/bin/bash
# Database Connection Helper Script

echo "🔗 Octonius Database Connection Helper"
echo "======================================"
echo ""
echo "RDS Endpoint: ${rds_endpoint}"
echo "Database: ${database_name}"
echo "Username: ${database_username}"
echo ""

# Function to get password from Secrets Manager
get_db_password() {
    echo "🔑 Retrieving database password from AWS Secrets Manager..."
    aws secretsmanager get-secret-value \
        --secret-id '${rds_secret_arn}' \
        --query SecretString \
        --output text | jq -r .password
}

# Function to connect to database
connect_db() {
    echo "🚀 Connecting to database..."
    DB_PASSWORD=$(get_db_password)
    if [ $? -eq 0 ] && [ ! -z "$DB_PASSWORD" ]; then
        PGPASSWORD="$DB_PASSWORD" psql \
            -h ${rds_endpoint} \
            -p 5432 \
            -U ${database_username} \
            -d ${database_name}
    else
        echo "❌ Failed to retrieve database password"
        exit 1
    fi
}

# Function to test connection
test_connection() {
    echo "🧪 Testing database connection..."
    DB_PASSWORD=$(get_db_password)
    if [ $? -eq 0 ] && [ ! -z "$DB_PASSWORD" ]; then
        PGPASSWORD="$DB_PASSWORD" psql \
            -h ${rds_endpoint} \
            -p 5432 \
            -U ${database_username} \
            -d ${database_name} \
            -c "SELECT version();"
    else
        echo "❌ Failed to retrieve database password"
        exit 1
    fi
}

# Main menu
case "$1" in
    "connect"|"")
        connect_db
        ;;
    "test")
        test_connection
        ;;
    "password")
        get_db_password
        ;;
    *)
        echo "Usage: $0 [connect|test|password]"
        echo ""
        echo "Commands:"
        echo "  connect   - Connect to the database (default)"
        echo "  test      - Test database connection"
        echo "  password  - Get database password only"
        ;;
esac
EOF

# Make the script executable
chmod +x /home/ec2-user/connect-db.sh
chown ec2-user:ec2-user /home/ec2-user/connect-db.sh

# Create a simple SSH tunnel helper script
cat > /home/ec2-user/setup-tunnel.sh << 'EOF'
#!/bin/bash
# SSH Tunnel Setup Helper

echo "🌉 SSH Tunnel Setup Helper"
echo "========================="
echo ""
echo "To create an SSH tunnel from your local machine, run:"
echo ""
echo "ssh -L 5432:${rds_endpoint}:5432 ec2-user@$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "Then connect locally with:"
echo "psql -h localhost -p 5432 -U ${database_username} -d ${database_name}"
echo ""
echo "Password can be retrieved with: ./connect-db.sh password"
EOF

chmod +x /home/ec2-user/setup-tunnel.sh
chown ec2-user:ec2-user /home/ec2-user/setup-tunnel.sh

# Create welcome message
cat > /home/ec2-user/README.txt << 'EOF'
🎯 Octonius Bastion Host
=======================

This bastion host provides secure access to the Octonius RDS database.

Available Scripts:
-----------------
./connect-db.sh        - Connect directly to the database
./connect-db.sh test   - Test database connection
./connect-db.sh password - Get database password
./setup-tunnel.sh      - Show SSH tunnel setup instructions

Database Info:
-------------
Endpoint: ${rds_endpoint}
Database: ${database_name}
Username: ${database_username}

Security:
--------
- This bastion host is only accessible from whitelisted IP addresses
- Database password is securely stored in AWS Secrets Manager
- All connections are encrypted

Support:
-------
For issues, check the scripts above or contact your DevOps team.
EOF

chown ec2-user:ec2-user /home/ec2-user/README.txt

# Set up automatic display of README on login
echo "cat /home/ec2-user/README.txt" >> /home/ec2-user/.bashrc

echo "✅ Bastion host setup completed successfully!" > /var/log/user-data.log 