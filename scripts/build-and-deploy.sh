#!/bin/bash

# Build and Deploy Script for ClientHunt Admin Panel
# This script builds the Next.js app and copies necessary files for standalone deployment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ClientHunt Admin Panel - Build & Deploy${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo -e "${YELLOW}Step 1: Installing/updating dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
echo ""

# Check if PM2 is running (to determine deployment strategy)
PM2_RUNNING=false
if pm2 list | grep -q "admin-clienthunt"; then
    PM2_RUNNING=true
    echo -e "${YELLOW}⚠ PM2 process detected - will use zero-downtime deployment${NC}"
fi

echo -e "${YELLOW}Step 2: Building Next.js application...${NC}"

# Check if .env.production exists and load it
if [ -f ".env.production" ]; then
    echo -e "${YELLOW}  Loading environment variables from .env.production...${NC}"
    export $(cat .env.production | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${YELLOW}  ⚠ Warning: .env.production not found${NC}"
    echo -e "${YELLOW}  Using default production values (https://api.clienthunt.app)${NC}"
    # Set defaults if not already set
    export NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-'https://api.clienthunt.app'}
    export NEXT_PUBLIC_ADMIN_URL=${NEXT_PUBLIC_ADMIN_URL:-'https://admin.clienthunt.app'}
fi

# Build the application
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed successfully${NC}"
echo ""

# Check if standalone build exists
if [ ! -d ".next/standalone" ]; then
    echo -e "${RED}❌ Error: .next/standalone directory not found!${NC}"
    echo -e "${YELLOW}Make sure next.config.ts has 'output: standalone' configured.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 3: Copying required Next.js files...${NC}"

# Copy .next directory structure to standalone/.next
# This is required for Next.js standalone mode to work correctly
if [ -d ".next" ]; then
    # Create .next directory in standalone
    mkdir -p .next/standalone/.next
    
    # Copy static files (includes CSS, JS, and optimized images)
    if [ -d ".next/static" ]; then
        mkdir -p .next/standalone/.next/static
        cp -r .next/static/* .next/standalone/.next/static/
        echo -e "${GREEN}✓ Copied .next/static files (includes CSS, JS, and optimized images)${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: .next/static directory not found${NC}"
    fi
    
    # Copy server build files (required for standalone mode)
    # These files are needed for Next.js to run properly and serve static assets
    if [ -d ".next/server" ]; then
        mkdir -p .next/standalone/.next/server
        # Copy all manifest files from server directory
        find .next/server -maxdepth 1 -name "*.json" -type f -exec cp {} .next/standalone/.next/server/ \; 2>/dev/null || true
        echo -e "${GREEN}✓ Copied Next.js server manifest files${NC}"
    fi
    
    # Copy root-level manifest files (required for routing and asset serving)
    for manifest in "routes-manifest.json" "prerender-manifest.json" "BUILD_ID" "package.json" "middleware-manifest.json"; do
        if [ -f ".next/${manifest}" ]; then
            cp ".next/${manifest}" .next/standalone/.next/ 2>/dev/null || true
        fi
    done
    echo -e "${GREEN}✓ Copied Next.js root manifest files${NC}"
else
    echo -e "${RED}❌ Error: .next directory not found!${NC}"
    exit 1
fi

# Copy public folder to standalone/public (if it exists)
if [ -d "public" ]; then
    # Count images before copying
    IMAGE_COUNT=$(find public -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.gif" -o -iname "*.svg" -o -iname "*.webp" -o -iname "*.ico" \) 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$IMAGE_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}  Found ${IMAGE_COUNT} image file(s) in public folder${NC}"
    fi
    
    # Copy public folder recursively (preserves structure and permissions)
    cp -r public .next/standalone/
    
    if [ "$IMAGE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ Copied public folder (${IMAGE_COUNT} image files included)${NC}"
    else
        echo -e "${GREEN}✓ Copied public folder${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Warning: public directory not found (this is OK if not using public assets)${NC}"
fi

echo ""
echo -e "${GREEN}✓ All files copied successfully${NC}"
echo ""

# Ask if user wants to restart PM2
read -p "Do you want to restart PM2? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Step 4: Deploying to PM2...${NC}"
    
    # Check if PM2 process exists
    if pm2 list | grep -q "admin-clienthunt"; then
        echo -e "${YELLOW}  Existing process detected - using zero-downtime reload...${NC}"
        
        # Use PM2 reload for zero-downtime deployment (graceful restart)
        # This keeps the old process running until the new one is ready
        cd .next/standalone
        PORT=9200 HOSTNAME=0.0.0.0 pm2 reload admin-clienthunt --update-env
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ PM2 reloaded successfully (zero-downtime)${NC}"
        else
            echo -e "${YELLOW}  Reload failed, trying stop/start...${NC}"
            # Fallback to stop/start if reload fails
            pm2 stop admin-clienthunt 2>/dev/null || true
            sleep 1
            PORT=9200 HOSTNAME=0.0.0.0 pm2 start server.js --name admin-clienthunt --update-env
            echo -e "${GREEN}✓ PM2 restarted successfully${NC}"
        fi
    else
        echo -e "${YELLOW}  No existing process - starting new instance...${NC}"
        # Start from standalone directory
        cd .next/standalone
        PORT=9200 HOSTNAME=0.0.0.0 pm2 start server.js --name admin-clienthunt --update-env
        echo -e "${GREEN}✓ PM2 started successfully${NC}"
    fi
    
    pm2 save
    
    echo ""
    echo -e "${GREEN}Admin panel is now running on port 9200${NC}"
    echo ""
    echo "Useful commands:"
    echo "  - View logs: pm2 logs admin-clienthunt"
    echo "  - Check status: pm2 status"
    echo "  - Monitor: pm2 monit"
    echo "  - Reload (zero-downtime): pm2 reload admin-clienthunt"
else
    echo ""
    echo -e "${YELLOW}To start manually, run:${NC}"
    echo "  cd .next/standalone"
    echo "  PORT=9200 HOSTNAME=0.0.0.0 pm2 start server.js --name admin-clienthunt --update-env"
    echo "  pm2 save"
    echo ""
    echo -e "${YELLOW}To reload existing process (zero-downtime):${NC}"
    echo "  pm2 reload admin-clienthunt"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Build & Deploy Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

