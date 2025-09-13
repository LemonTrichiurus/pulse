#!/bin/bash

# 自定义服务器部署脚本
# 目标服务器: 139.196.122.188
# 使用方法: ./deploy-custom.sh

set -e

# 配置变量
SERVER_IP="139.196.122.188"
APP_NAME="sclspulse"
DEPLOY_PATH="/var/www/sclspulse"
USER="root"

echo "🚀 开始部署到服务器: $SERVER_IP (IP访问模式)"
echo "🌐 访问地址将是: http://$SERVER_IP"

# 1. 构建生产版本
echo "📦 构建生产版本..."
npm run build

# 2. 创建生产环境变量文件
echo "⚙️ 创建生产环境配置..."
cat > .env.production << EOF
# 生产环境配置（IP访问模式）
NEXT_PUBLIC_SUPABASE_URL=https://cgzcucufhdhifsphxzpb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnemN1Y3VmaGRoaWZzcGh4enBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTc5MjIsImV4cCI6MjA3MjczMzkyMn0.mFSmpxHkV40DgauyDxODjDnrsd9URI9dH848jyjrj8U
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnemN1Y3VmaGRoaWZzcGh4enBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE1NzkyMiwiZXhwIjoyMDcyNzMzOTIyfQ.kA0yoIVL3iQ0iPxdHm98Iy-a0f1ChtPWVRjmuW1GjU8

# NextAuth配置（使用IP地址）
NEXTAUTH_SECRET=sclspulse_production_secret_key_2024
NEXTAUTH_URL=http://$SERVER_IP

# 应用配置
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_NAME=校园新闻网
NEXT_PUBLIC_APP_DESCRIPTION=连接校园，分享精彩
NEXT_PUBLIC_APP_URL=http://$SERVER_IP
NEXT_PUBLIC_API_URL=http://$SERVER_IP/api

# 上传限制
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif
EOF

# 3. 创建部署包
echo "📋 创建部署包..."
tar -czf school-news-site-custom.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.next/cache \
  --exclude=deployment-guide.md \
  --exclude=deploy*.sh \
  --exclude=DOMAIN-REGISTRATION-GUIDE.md \
  --exclude=.env.local \
  .

echo "📤 上传文件到服务器..."
scp school-news-site-custom.tar.gz $USER@$SERVER_IP:/tmp/

# 4. 在服务器上执行部署
echo "🔧 在服务器上执行部署..."
ssh $USER@$SERVER_IP << 'EOF'
set -e

# 更新系统包
echo "📦 更新系统包..."
sudo apt update

# 安装必要软件
echo "🛠️ 安装必要软件..."
sudo apt install -y curl nginx

# 安装Node.js 18.x
if ! command -v node &> /dev/null; then
    echo "📦 安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 安装PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2..."
    sudo npm install -g pm2
fi

# 创建应用目录
sudo mkdir -p /var/www/sclspulse
sudo chown -R $USER:$USER /var/www/sclspulse

# 备份现有应用（如果存在）
if [ -f "/var/www/sclspulse/package.json" ]; then
    echo "📋 备份现有应用..."
    sudo cp -r /var/www/sclspulse /var/www/sclspulse.backup.$(date +%Y%m%d_%H%M%S)
fi

# 解压新版本
echo "📦 解压应用文件..."
cd /var/www/sclspulse
tar -xzf /tmp/school-news-site-custom.tar.gz
rm /tmp/school-news-site-custom.tar.gz

# 安装依赖
echo "📚 安装生产依赖..."
npm install --production

# 检查PM2进程
if pm2 list | grep -q "sclspulse"; then
    echo "🔄 重启应用..."
    pm2 restart sclspulse
else
    echo "🚀 启动新应用..."
    pm2 start npm --name "sclspulse" -- start
    pm2 save
    pm2 startup
fi

# 创建Nginx配置
echo "⚙️ 创建Nginx配置..."
sudo tee /etc/nginx/sites-available/sclspulse > /dev/null << 'NGINX_EOF'
server {
    listen 80 default_server;
    server_name _;
    
    # 增加客户端最大请求体大小
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件缓存
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 图片和媒体文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|css|js)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

# 启用配置
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/sclspulse /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 启用服务自启动
sudo systemctl enable nginx

echo "✅ 部署完成！"
echo "🌐 请访问: http://139.196.122.188"
echo "📊 应用状态:"
pm2 status
EOF

# 清理本地文件
rm school-news-site-custom.tar.gz .env.production

echo ""
echo "🎉 部署完成！"
echo "🌐 网站地址: http://139.196.122.188"
echo "📊 查看应用状态: ssh $USER@$SERVER_IP 'pm2 status'"
echo "📝 查看应用日志: ssh $USER@$SERVER_IP 'pm2 logs sclspulse'"
echo ""
echo "📋 部署后检查清单:"
echo "1. 访问网站确认功能正常"
echo "2. 检查用户注册和登录功能"
echo "3. 测试新闻发布和评论功能"
echo "4. 验证文件上传功能"
echo ""
echo "🔧 如需调试:"
echo "ssh $USER@$SERVER_IP"
echo "cd /var/www/sclspulse"
echo "pm2 logs sclspulse"