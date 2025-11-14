# Admin Panel Deployment Guide

**Domain**: `admin.clienthunt.app`  
**Port**: `9200` (Next.js standalone server)

---

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Nginx** installed and configured
3. **PM2** (or similar process manager) for running Next.js
4. **SSL Certificate** (for HTTPS - recommended)

---

## Deployment Steps

### 1. Build the Admin Panel

```bash
cd lead-admin
npm install
npm run build
```

This creates a standalone build in `.next/standalone/` directory.

### 2. Start Next.js Server

Using PM2:

```bash
# Start the Next.js standalone server
pm2 start .next/standalone/server.js --name admin-clienthunt --interpreter node

# Or using npm script
npm run start
```

The server will run on port `9200` by default.

### 3. Configure Nginx

#### Option A: HTTP Only (Development/Testing)

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/admin-clienthunt

# Create symlink
sudo ln -s /etc/nginx/sites-available/admin-clienthunt /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

#### Option B: HTTPS (Production - Recommended)

1. **Obtain SSL Certificate** (using Let's Encrypt):

```bash
sudo certbot certonly --nginx -d admin.clienthunt.app
```

2. **Update SSL paths in nginx-https.conf** if needed

3. **Copy HTTPS config**:

```bash
# Copy nginx config
sudo cp nginx-https.conf /etc/nginx/sites-available/admin-clienthunt

# Create symlink
sudo ln -s /etc/nginx/sites-available/admin-clienthunt /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 4. Update DNS

Add an A record pointing `admin.clienthunt.app` to your server's IP address:

```
Type: A
Name: admin
Value: YOUR_SERVER_IP
TTL: 3600
```

### 5. Environment Variables

Create a `.env.production` file or set environment variables:

```bash
NEXT_PUBLIC_API_URL=https://api.clienthunt.app
NODE_ENV=production
PORT=9200
```

---

## PM2 Configuration

Create `ecosystem.config.js` for PM2:

```javascript
module.exports = {
  apps: [{
    name: 'admin-clienthunt',
    script: '.next/standalone/server.js',
    cwd: '/path/to/lead-admin',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 9200,
      NEXT_PUBLIC_API_URL: 'https://api.clienthunt.app'
    },
    error_file: './logs/admin-error.log',
    out_file: './logs/admin-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M'
  }]
};
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Nginx Configuration Details

### Security Features

- ✅ **X-Frame-Options: DENY** - Prevents clickjacking
- ✅ **X-Content-Type-Options: nosniff** - Prevents MIME sniffing
- ✅ **X-XSS-Protection** - XSS protection
- ✅ **Referrer-Policy: no-referrer** - Strict referrer policy
- ✅ **X-Robots-Tag: noindex, nofollow** - Prevents search engine indexing
- ✅ **Content-Security-Policy** - Strict CSP for admin panel
- ✅ **HSTS** (HTTPS only) - Forces HTTPS connections

### Performance Features

- ✅ **Gzip compression** - Compresses responses
- ✅ **Static file caching** - Long-term caching for `/_next/static/`
- ✅ **Proxy buffering off** - Better for real-time updates

---

## Health Check

The admin panel exposes a health check endpoint:

```bash
curl http://admin.clienthunt.app/health
```

---

## Troubleshooting

### Check Nginx Status

```bash
sudo systemctl status nginx
sudo nginx -t
```

### Check PM2 Status

```bash
pm2 status
pm2 logs admin-clienthunt
```

### Check Port 9200

```bash
sudo lsof -i :9200
netstat -tulpn | grep 9200
```

### View Nginx Logs

```bash
sudo tail -f /var/log/nginx/admin-clienthunt-access.log
sudo tail -f /var/log/nginx/admin-clienthunt-error.log
```

### Common Issues

1. **502 Bad Gateway**: Next.js server not running on port 9200
2. **403 Forbidden**: Check file permissions and nginx configuration
3. **SSL errors**: Verify SSL certificate paths and permissions
4. **CORS errors**: Ensure `NEXT_PUBLIC_API_URL` is set correctly

---

## SSL Certificate Renewal

If using Let's Encrypt, certificates auto-renew. Test renewal:

```bash
sudo certbot renew --dry-run
```

---

## Updates/Deployment

1. Pull latest changes
2. Build: `npm run build`
3. Restart PM2: `pm2 restart admin-clienthunt`
4. Verify: Check `https://admin.clienthunt.app`

---

## Security Notes

- ✅ Admin panel should **never** be indexed by search engines
- ✅ Use HTTPS in production (required for secure cookies)
- ✅ Keep Next.js and dependencies updated
- ✅ Monitor logs for suspicious activity
- ✅ Use strong authentication (already implemented)
- ✅ CSRF protection is enabled (already implemented)

---

## Backup

Backup important files:

```bash
# Backup nginx config
sudo cp /etc/nginx/sites-available/admin-clienthunt ~/backup/

# Backup PM2 config
cp ecosystem.config.js ~/backup/
```

---

**Status**: ✅ Ready for deployment

