/**
 * PM2 Ecosystem Configuration for Admin Panel
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [{
    name: 'admin-clienthunt',
    script: '.next/standalone/server.js',
    cwd: process.cwd(),
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 9200,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.clienthunt.app',
      NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.clienthunt.app'
    },
    error_file: './logs/admin-error.log',
    out_file: './logs/admin-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};

