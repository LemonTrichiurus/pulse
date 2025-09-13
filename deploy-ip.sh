#!/bin/bash

# 临时IP部署脚本（无域名版本）
# 使用方法: ./deploy-ip.sh [server_ip]

set -e

# 配置变量
SERVER_IP=${1:-"139.196.122.188"}
APP_NAME="school-news-site"
DEPLOY_PATH="/var/www/school-news-site"
USER="root"

echo "🚀 开始部署到服务器: $SERVER_IP (无域名模式)"
echo "🌐 访问地址将是: http://$SERVER_IP"

# 1. 构建生产版本
echo "📦 构建生产版本..."
npm run build

# 2. 创建临时环境变量文件
echo "⚙️ 创建临时环境变量..."
cat > .env.production.temp << EOF
# 临时生产环境配置（IP访问模式）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# NextAuth配置（使用IP地址）
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://$SERVER_IP

# 应用配置
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=http://$SERVER_IP
NEXT_PUBLIC_API_URL=http://$SERVER_IP/api
EOF

# 3. 创建部署包
echo "📋 创建部署包..."
tar -czf school-news-site-ip.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.next/cache \
  --exclude=deployment-guide.md \
  --exclude=deploy.sh \
  --exclude=deploy-ip.sh \
  --exclude=DOMAIN-REGISTRATION-GUIDE.md \
  .

echo "📤 上传文件到服务器..."
scp school-news-site-ip.tar.gz $USER@$SERVER_IP:/tmp/
scp .env.production.temp $USER@$SERVER_IP:/tmp/

# 4. 在服务器上执行部署
echo "🔧 在服务器上执行部署..."
ssh $USER@$SERVER_IP << EOF
set -e

# 创建应用目录
sudo mkdir -p $DEPLOY_PATH
sudo chown -R \$USER:\$USER $DEPLOY_PATH

# 备份现有应用（如果存在）
if [ -f "$DEPLOY_PATH/package.json" ]; then
    echo "📋 备份现有应用..."
    sudo cp -r $DEPLOY_PATH $DEPLOY_PATH.backup.\$(date +%Y%m%d_%H%M%S)
fi

# 解压新版本
echo "📦 解压应用文件..."
cd $DEPLOY_PATH
tar -xzf /tmp/school-news-site-ip.tar.gz

# 复制环境变量
cp /tmp/.env.production.temp .env.production
rm /tmp/school-news-site-ip.tar.gz /tmp/.env.production.temp

# 安装依赖
echo "📚 安装生产依赖..."
npm install --production

# 检查PM2进程
if pm2 list | grep -q "$APP_NAME"; then
    echo "🔄 重启应用..."
    pm2 restart $APP_NAME
else
    echo "🚀 启动新应用..."
    pm2 start npm --name "$APP_NAME" -- start
    pm2 save
fi

# 创建临时Nginx配置（IP访问）
echo "⚙️ 创建Nginx配置（IP访问模式）..."
sudo tee /etc/nginx/sites-available/ip-access > /dev/null << 'NGINX_EOF'
server {
    listen 80 default_server;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
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
    location ~* \\.(jpg|jpeg|png|gif|ico|svg|webp|css|js)\$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

# 启用配置
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/ip-access /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "✅ 部署完成！"
echo "🌐 请访问: http://$SERVER_IP"
echo "📊 应用状态:"
pm2 status
EOF

# 清理本地文件
rm school-news-site-ip.tar.gz .env.production.temp

echo ""
echo "🎉 IP模式部署完成！"
echo "🌐 网站地址: http://$SERVER_IP"
echo "📊 查看应用状态: ssh $USER@$SERVER_IP 'pm2 status'"
echo "📝 查看应用日志: ssh $USER@$SERVER_IP 'pm2 logs $APP_NAME'"
echo ""
echo "⚠️ 重要提醒:"
echo "1. 请及时注册域名并配置DNS解析"
echo "2. 域名配置完成后，运行正式部署脚本"
echo "3. 当前无法申请SSL证书，仅支持HTTP访问"
echo "4. 请在 .env.production 中填入正确的Supabase配置"
echo ""
echo "📋 下一步操作:"
echo "1. ssh $USER@$SERVER_IP"
echo "2. cd $DEPLOY_PATH"
echo "3. nano .env.production  # 编辑环境变量"
echo "4. pm2 restart $APP_NAME  # 重启应用"