module.exports = {
  apps: [
    {
      name: 'bisoinvit-api',
      cwd: '/var/www/bisoinvit/backend',
      script: 'src/server.js',
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '600M',
      out_file: '/var/log/bisoinvit/api.out.log',
      error_file: '/var/log/bisoinvit/api.err.log',
      time: true,
      autorestart: true,
      watch: false,
    },
  ],
};
