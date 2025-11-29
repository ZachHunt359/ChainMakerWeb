#!/bin/bash
# ChainMaker VPS Deployment Script
# Run this script on your Ubuntu 24.04 VPS as root or with sudo

set -e

echo "=== ChainMaker VPS Deployment ==="
echo

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo"
    exit 1
fi

# Install MongoDB
echo "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl enable mongod
systemctl start mongod

# Install Node.js 20.x (required by ChainMaker)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Create directory structure
echo "Creating directories..."
mkdir -p /var/www/chainmaker
mkdir -p /var/lib/chainmaker/mongodb
mkdir -p /var/www/chainmaker/public/user_images

# Set permissions
chown -R www-data:www-data /var/www/chainmaker
chown -R www-data:www-data /var/lib/chainmaker

echo
echo "Installation complete!"
echo
echo "Next steps:"
echo "1. Build ChainMaker locally: npm run build"
echo "2. Deploy files using deploy-chainmaker.sh"
echo "3. Configure nginx"
echo "4. Set up SSL with certbot"
