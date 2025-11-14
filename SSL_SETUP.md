# SSL Setup for Admin Panel

This guide explains how to set up HTTPS for the admin panel at `admin.clienthunt.app`.

## Prerequisites

- Domain `admin.clienthunt.app` pointing to your server
- Nginx installed
- Ports 80 and 443 open in firewall
- Admin panel running on port 9200

## Step 1: Obtain SSL Certificate

Use Certbot to obtain a Let's Encrypt SSL certificate:

```bash
sudo certbot certonly --nginx -d admin.clienthunt.app
```

This will:
- Obtain the SSL certificate
- Save it to `/etc/letsencrypt/live/admin.clienthunt.app/`
- Set up automatic renewal

## Step 2: Update Nginx Configuration

1. **Copy the HTTPS configuration**:
```bash
cd /path/to/lead-admin
sudo cp nginx-https.conf /etc/nginx/sites-available/admin-clienthunt
```

2. **Verify the certificate paths** in the config file match your certificate location:
```bash
sudo nano /etc/nginx/sites-available/admin-clienthunt
```

The paths should be:
- `ssl_certificate /etc/letsencrypt/live/admin.clienthunt.app/fullchain.pem;`
- `ssl_certificate_key /etc/letsencrypt/live/admin.clienthunt.app/privkey.pem;`
- `ssl_trusted_certificate /etc/letsencrypt/live/admin.clienthunt.app/chain.pem;`

3. **Enable the site** (if not already enabled):
```bash
sudo ln -sf /etc/nginx/sites-available/admin-clienthunt /etc/nginx/sites-enabled/
```

4. **Test the configuration**:
```bash
sudo nginx -t
```

5. **Reload Nginx**:
```bash
sudo systemctl reload nginx
```

## Step 3: Verify HTTPS

1. **Test with curl**:
```bash
curl -I https://admin.clienthunt.app
```

You should see:
- `HTTP/2 200` or similar
- Security headers in the response

2. **Test in browser**:
- Visit `https://admin.clienthunt.app`
- Check that the padlock icon shows (secure connection)
- Verify HTTP redirects to HTTPS

## Step 4: Automatic Certificate Renewal

Certbot automatically sets up a renewal cron job. Verify it's working:

```bash
sudo certbot renew --dry-run
```

This should complete without errors. Certificates will auto-renew before expiration.

## Troubleshooting

### Certificate Not Found
If you see errors about certificate files not found:
```bash
# Check if certificates exist
sudo ls -la /etc/letsencrypt/live/admin.clienthunt.app/

# Verify paths in Nginx config match
sudo nginx -t
```

### Nginx Won't Start
Check the error logs:
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### HTTP Not Redirecting to HTTPS
Make sure both server blocks (port 80 and 443) are in the config file.

### SSL Certificate Expired
Renew manually:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

## Security Notes

- The admin panel uses strict security headers
- HSTS is enabled (forces HTTPS)
- CSP is configured to prevent XSS
- Admin panel is not indexed by search engines
- Frame embedding is disabled

## Configuration Files

- **HTTP only**: `nginx.conf` (for development)
- **HTTPS**: `nginx-https.conf` (for production)

Switch between them by copying the appropriate file to `/etc/nginx/sites-available/admin-clienthunt`.

