#!/bin/bash

# 学校新闻网站子路径部署脚本 (http://47.101.144.238/sclspulse)
# 适用于服务器上已有其他网站的情况

set -e

echo "🚀 开始部署学校新闻网站到子路径 /sclspulse..."

# 配置变量
SERVER_IP="47.101.144.238"
SERVER_USER="root"
APP_NAME="school-news-site"
SUBPATH="/sclspulse"
REMOTE_DIR="/var/www/sclspulse"
NGINX_CONFIG="/etc/nginx/sites-available/sclspulse"
PORT=3001  # 使用不同端口避免冲突

echo "📦 1. 构建生产版本..."
# 设置子路径环境变量
export NEXT_PUBLIC_BASE_PATH="/sclspulse"
npm run build

echo "📝 2. 创建临时环境变量文件..."
cat > .env.production.temp << EOF
# 生产环境配置 - 子路径部署
NEXT_PUBLIC_BASE_PATH=/sclspulse
NEXTAUTH_URL=http://47.101.144.238/sclspulse
NEXTAUTH_SECRET=your-nextauth-secret-here

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# 应用配置
NODE_ENV=production
PORT=$PORT
EOF

echo "📦 3. 创建部署包..."
tar -czf ${APP_NAME}-subpath.tar.gz \
  .next \
  public \
  package.json \
  package-lock.json \
  next.config.ts \
  .env.production.temp \
  ecosystem.config.js

echo "📤 4. 上传文件到服务器..."
scp ${APP_NAME}-subpath.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/

echo "🔧 5. 服务器端部署..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

# 创建应用目录
sudo mkdir -p /var/www/sclspulse
cd /var/www/sclspulse

# 备份现有部署（如果存在）
if [ -d "current" ]; then
    sudo mv current backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
fi

# 解压新版本
sudo mkdir -p current
cd current
sudo tar -xzf /tmp/school-news-site-subpath.tar.gz
sudo chown -R $USER:$USER /var/www/sclspulse

# 重命名环境变量文件
mv .env.production.temp .env.production

# 安装依赖
npm ci --production

# 停止现有进程（如果存在）
pm2 delete sclspulse 2>/dev/null || true

# 启动应用
pm2 start npm --name "sclspulse" -- start
pm2 save

echo "✅ 应用已启动在端口 3001"
ENDSSH

echo "🌐 6. 配置 Nginx 子路径..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# 创建 Nginx 子路径配置
sudo tee /etc/nginx/sites-available/sclspulse > /dev/null << 'EOF'
# 学校新闻网站子路径配置
location /sclspulse/ {
    # 移除 /sclspulse 前缀并代理到应用
    rewrite ^/sclspulse/(.*) /$1 break;
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # 处理静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# API 路由
location /sclspulse/api/ {
    rewrite ^/sclspulse/api/(.*) /api/$1 break;
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
EOF

# 将配置包含到主配置中
if ! grep -q "include /etc/nginx/sites-available/sclspulse" /etc/nginx/sites-available/default; then
    sudo sed -i '/server {/a\    include /etc/nginx/sites-available/sclspulse;' /etc/nginx/sites-available/default
fi

# 测试并重载 Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Nginx 配置已更新"
ENDSSH

echo "🧹 7. 清理本地文件..."
rm -f ${APP_NAME}-subpath.tar.gz .env.production.temp

echo ""
echo "🎉 部署完成！"
echo "📱 访问地址: http://47.101.144.238/sclspulse"
echo "🔧 管理后台: http://47.101.144.238/sclspulse/admin"
echo "🔌 API 接口: http://47.101.144.238/sclspulse/api"
echo ""
echo "📋 重要提醒:"
echo "1. 请在服务器上编辑 /var/www/sclspulse/current/.env.production 配置正确的环境变量"
echo "2. 配置完成后运行: pm2 restart sclspulse"
echo "3. 检查应用状态: pm2 status"
echo "4. 查看日志: pm2 logs sclspulse"
echo ""
echo "🔧 常用维护命令:"
echo "  重启应用: ssh root@47.101.144.238 'pm2 restart sclspulse'"
echo "  查看状态: ssh root@47.101.144.238 'pm2 status'"
echo "  查看日志: ssh root@47.101.144.238 'pm2 logs sclspulse --lines 50'"
echo "  更新代码: ./deploy-subpath.sh"