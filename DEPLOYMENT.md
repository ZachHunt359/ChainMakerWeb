# ChainMaker VPS Deployment Guide

Complete deployment guide for ChainMaker on Ubuntu 24.04 VPS with chainmaker.quest domain.

## Architecture

**Production:**
- **Domain**: chainmaker.quest
- **App Port**: 3000 (local only, nginx proxies)
- **Database**: MongoDB 7.0 database `chainmaker`

**Dev:**
- **Domain**: dev.chainmaker.quest
- **App Port**: 3001 (local only, nginx proxies)
- **Database**: MongoDB 7.0 database `chainmaker-dev`

**Common:**
- **Web Server**: nginx (port 80/443, SSL)
- **Node.js**: v20.x
- **User**: www-data

## Local Setup (Windows)

### 1. Build the Application

```
cd C:\Users\khayy\source\repos\ChainMakerWeb
npm install
npm run build
```

### 2. Test Locally (Optional)

```
npm start
```
Visit http://localhost:3000

## VPS Initial Setup (One-Time)

### 1. Install MongoDB

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod
```

### 2. Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Create Directories

**Production:**
```bash
sudo mkdir -p /var/www/chainmaker
sudo mkdir -p /var/lib/chainmaker
sudo mkdir -p /var/www/chainmaker/public/user_images
sudo chown -R www-data:www-data /var/www/chainmaker
sudo chown -R www-data:www-data /var/lib/chainmaker
```

**Dev:**
```bash
sudo mkdir -p /var/www/chainmaker-dev
sudo mkdir -p /var/lib/chainmaker-dev
sudo mkdir -p /var/www/chainmaker-dev/public/user_images
sudo chown -R www-data:www-data /var/www/chainmaker-dev
sudo chown -R www-data:www-data /var/lib/chainmaker-dev
```

### 4. Install systemd Service

**Production:**
```bash
sudo cp /var/www/chainmaker/deployment/chainmaker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable chainmaker
```

**Dev:**
```bash
sudo cp /var/www/chainmaker-dev/deployment/chainmaker-dev.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable chainmaker-dev
```

### 5. Configure nginx

**Production:**
```bash
sudo cp /var/www/chainmaker/deployment/nginx-chainmaker.conf /etc/nginx/sites-available/chainmaker
sudo ln -s /etc/nginx/sites-available/chainmaker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Dev:**
```bash
sudo cp /var/www/chainmaker-dev/deployment/nginx-chainmaker-dev.conf /etc/nginx/sites-available/chainmaker-dev
sudo ln -s /etc/nginx/sites-available/chainmaker-dev /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Set Up SSL with Let's Encrypt

**Production:**
```bash
sudo certbot --nginx -d chainmaker.quest -d www.chainmaker.quest
```

**Dev:**
```bash
sudo certbot --nginx -d dev.chainmaker.quest
```

## Deployment Script (Windows → VPS)

### Production Deployment

Create `deploy-production.ps1` in ChainMakerWeb root:

```powershell
# Build application
npm run build

# Deploy to VPS (replace YOUR_VPS_IP)
$VPS = "YOUR_VPS_IP"

# Copy files
rsync -avz --delete `
  --exclude 'node_modules' `
  --exclude '.git' `
  --exclude 'deployment' `
  . $VPS:/var/www/chainmaker/

# Copy .env
scp .env $VPS:/var/www/chainmaker/

# Set permissions
ssh $VPS "sudo chown -R www-data:www-data /var/www/chainmaker"

# Restart service
ssh $VPS "sudo systemctl restart chainmaker"

Write-Host "Production deployment complete!"
Write-Host "Check status: ssh $VPS 'sudo systemctl status chainmaker'"
```

### Dev Deployment

Create `deploy-dev.ps1` in ChainMakerWeb root:

```powershell
# Build application
npm run build

# Deploy to VPS (replace YOUR_VPS_IP)
$VPS = "YOUR_VPS_IP"

# Copy files
rsync -avz --delete `
  --exclude 'node_modules' `
  --exclude '.git' `
  --exclude 'deployment' `
  . $VPS:/var/www/chainmaker-dev/

# Copy .env.dev as .env
scp .env.dev $VPS:/var/www/chainmaker-dev/.env

# Set permissions
ssh $VPS "sudo chown -R www-data:www-data /var/www/chainmaker-dev"

# Restart service
ssh $VPS "sudo systemctl restart chainmaker-dev"

Write-Host "Dev deployment complete!"
Write-Host "Check status: ssh $VPS 'sudo systemctl status chainmaker-dev'"
```

## Environment Variables

**Production (.env in /var/www/chainmaker/):**
```bash
MONGO_URI=mongodb://localhost:27017/chainmaker
PORT=3000
IMAGE_LIMIT_BYTES=5000000
IMAGE_LIMIT_STRING=5 MB
USE_HTTPS=false
CERT_PATH=false
```

**Dev (.env in /var/www/chainmaker-dev/):**
```bash
MONGO_URI=mongodb://localhost:27017/chainmaker-dev
PORT=3001
IMAGE_LIMIT_BYTES=5000000
IMAGE_LIMIT_STRING=5 MB
USE_HTTPS=false
CERT_PATH=false
```

## Useful Commands

### Check Service Status

**Production:**
```bash
sudo systemctl status chainmaker
sudo journalctl -u chainmaker -f
```

**Dev:**
```bash
sudo systemctl status chainmaker-dev
sudo journalctl -u chainmaker-dev -f
```

### Restart Service

**Production:**
```bash
sudo systemctl restart chainmaker
```

**Dev:**
```bash
sudo systemctl restart chainmaker-dev
```

### Check MongoDB
```bash
sudo systemctl status mongod
mongosh
```

### Check nginx
```bash
sudo nginx -t
sudo systemctl status nginx
```

### View Logs

**Production:**
```bash
# ChainMaker logs
sudo journalctl -u chainmaker -n 100

# nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

**Dev:**
```bash
# ChainMaker logs
sudo journalctl -u chainmaker-dev -n 100
```

## Troubleshooting

### Port 3000 Already in Use
```bash
sudo lsof -i:3000
sudo kill [PID]
```

### Port 3001 Already in Use
```bash
sudo lsof -i:3001
sudo kill [PID]
```

### MongoDB Connection Issues
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Check production database
mongosh mongodb://localhost:27017/chainmaker

# Check dev database
mongosh mongodb://localhost:27017/chainmaker-dev
```

### nginx 502 Bad Gateway

**Production:**
- Check ChainMaker service is running: `sudo systemctl status chainmaker`
- Check port 3000 is listening: `sudo ss -tlnp | grep 3000`
- Check logs: `sudo journalctl -u chainmaker -n 50`

**Dev:**
- Check ChainMaker service is running: `sudo systemctl status chainmaker-dev`
- Check port 3001 is listening: `sudo ss -tlnp | grep 3001`
- Check logs: `sudo journalctl -u chainmaker-dev -n 50`

### SSL Certificate Issues
```bash
# Renew certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

## File Structure on VPS

**Production:**
```
/var/www/chainmaker/
├── server.js
├── package.json
├── .env
├── build/
│   ├── client/
│   └── server/
├── public/
│   └── user_images/
└── deployment/
    ├── chainmaker.service
    └── nginx-chainmaker.conf
```

**Dev:**
```
/var/www/chainmaker-dev/
├── server.js
├── package.json
├── .env (copied from .env.dev)
├── build/
│   ├── client/
│   └── server/
├── public/
│   └── user_images/
└── deployment/
    ├── chainmaker-dev.service
    └── nginx-chainmaker-dev.conf
```

**System:**
```
/etc/systemd/system/
├── chainmaker.service
└── chainmaker-dev.service

/etc/nginx/sites-available/
├── chainmaker
└── chainmaker-dev

/var/lib/chainmaker/ (MongoDB data - production)
/var/lib/chainmaker-dev/ (MongoDB data - dev)
```

## Security Notes

- ChainMaker runs as www-data user
- Only port 3000 exposed to localhost
- nginx handles all external traffic
- MongoDB only accepts local connections
- SSL certificates auto-renew via certbot

## Updates

**To deploy updates to production:**
1. Build locally: `npm run build`
2. Run `deploy-production.ps1`
3. Service auto-restarts

**To deploy updates to dev:**
1. Build locally: `npm run build`
2. Run `deploy-dev.ps1`
3. Service auto-restarts

**Testing workflow:**
1. Test locally (localhost:3000)
2. Deploy to dev (dev.chainmaker.quest)
3. Test dev environment
4. Deploy to production (chainmaker.quest)

No downtime if nginx configured correctly.
