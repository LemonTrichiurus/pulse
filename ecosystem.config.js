// PM2生态系统配置文件
// 使用方法: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'sclspulse',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/sclspulse',
      instances: 1, // 可以设置为 'max' 使用所有CPU核心
      exec_mode: 'fork', // 或 'cluster' 用于集群模式
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // 日志配置
      log_file: '/var/log/pm2/sclspulse.log',
      out_file: '/var/log/pm2/sclspulse-out.log',
      error_file: '/var/log/pm2/sclspulse-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 自动重启配置
      watch: false, // 生产环境建议关闭文件监听
      ignore_watch: ['node_modules', '.next', 'logs'],
      
      // 内存和CPU限制
      max_memory_restart: '1G', // 内存超过1GB时重启
      
      // 重启策略
      restart_delay: 4000, // 重启延迟4秒
      max_restarts: 10, // 最大重启次数
      min_uptime: '10s', // 最小运行时间
      
      // 健康检查
      health_check_grace_period: 3000,
      
      // 其他配置
      merge_logs: true,
      time: true,
      
      // 启动后执行的脚本
      post_update: ['npm install', 'npm run build']
    }
  ],
  
  // 部署配置（可选）
  deploy: {
    production: {
      user: 'root',
      host: '47.101.144.238',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/school-news-site.git', // 替换为实际仓库地址
      path: '/var/www/sclspulse',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};