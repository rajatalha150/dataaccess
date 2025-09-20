module.exports = {
  apps: [
    {
      name: 'vision-backend',
      script: './server/index.js',
      cwd: '/root/dataaccess',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: './logs/vision-backend.log',
      out_file: './logs/vision-backend-out.log',
      error_file: './logs/vision-backend-error.log',
      time: true
    },
    {
      name: 'vision-frontend',
      script: './client/.output/server/index.mjs',
      cwd: '/root/dataaccess',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        NITRO_PORT: 3000,
        NITRO_HOST: '0.0.0.0'
      },
      log_file: './logs/vision-frontend.log',
      out_file: './logs/vision-frontend-out.log',
      error_file: './logs/vision-frontend-error.log',
      time: true
    }
  ]
};