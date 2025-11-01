/**
 * PM2 Ecosystem Configuration
 *
 * This file configures PM2 process manager for reliable, production-grade process management.
 *
 * Features:
 * - Auto-restart on crash
 * - Memory limit monitoring
 * - Log rotation
 * - Environment-specific configurations
 *
 * Usage:
 *   Development: pm2 start ecosystem.config.js --env development
 *   Production:  pm2 start ecosystem.config.js --env production
 *   Monitoring:  pm2 monit
 *   Logs:        pm2 logs
 *   Restart:     pm2 restart insiderpulse
 *   Stop:        pm2 stop insiderpulse
 */

module.exports = {
  apps: [{
    name: 'insiderpulse',

    // Development: Use tsx to run TypeScript directly
    // Production: Use compiled JavaScript (run 'npm run build' first)
    script: process.env.NODE_ENV === 'production' ? './dist/index.js' : 'tsx',
    args: process.env.NODE_ENV === 'production' ? '' : './server/index.ts',
    interpreter: process.env.NODE_ENV === 'production' ? 'node' : '', // Let PM2 use default for tsx

    // Instance management
    instances: 1, // Single instance for now (can be increased for scaling)
    exec_mode: 'fork', // Use 'cluster' for multiple instances

    // Auto-restart configuration
    autorestart: true, // Restart on crash
    watch: false, // Don't watch for file changes (use nodemon for dev)
    max_restarts: 10, // Max restarts within min_uptime
    min_uptime: '10s', // Minimum uptime before considering stable

    // Memory management
    max_memory_restart: '500M', // Restart if memory exceeds 500MB

    // Environment variables - DEVELOPMENT
    env_development: {
      NODE_ENV: 'development',
      PORT: 5000,
    },

    // Environment variables - PRODUCTION
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
    },

    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true, // Combine logs from multiple instances

    // Advanced options
    kill_timeout: 5000, // Time to wait for graceful shutdown
    listen_timeout: 10000, // Time to wait for app to be ready
    shutdown_with_message: true, // Send shutdown signal to app

    // Cron restart (optional - restart daily at 3 AM)
    // cron_restart: '0 3 * * *',

    // Post-deployment commands (optional)
    // post_deploy: 'npm run db:push && pm2 reload ecosystem.config.js --env production',
  }],

  // Deployment configuration (optional - for multi-server deployments)
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/insiderpulse.git',
      path: '/var/www/insiderpulse',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
