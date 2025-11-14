# ClientHunt Admin Panel

Isolated admin panel for managing ClientHunt platform.

**URL**: https://admin.clienthunt.app  
**Port**: 9200 (development)

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

Use the build-and-deploy script for automated deployment:

```bash
# Run the build and deploy script
./scripts/build-and-deploy.sh
```

The script will:
1. Install/update dependencies
2. Build the Next.js application
3. Copy static files to standalone directory
4. Optionally restart PM2 with zero-downtime reload

**PM2 Process Name**: `admin-clienthunt`  
**Port**: 9200

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://api.clienthunt.app
NEXT_PUBLIC_ADMIN_URL=https://admin.clienthunt.app
```

## Features

- User management
- Subscription management
- Analytics dashboard
- Revenue tracking
- Usage statistics

## Security

- Admin-only access (backend validates)
- Strict CSP headers
- No indexing (X-Robots-Tag)
- Frame protection (X-Frame-Options: DENY)

