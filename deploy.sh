#!/bin/bash

# 学校新闻网站自动部署脚本
# 使用方法: ./deploy.sh [server_ip] [domain]

set -e

# 配置变量
SERVER_IP=${1:-"47.101.144.238"}
DOMAIN=${2:-"www.sclspulse.cn"}
APP_NAME="sclspulse"
DEPLOY_PATH="/var/www/sclspulse"
USER="root"

echo "🚀 开始部署到服务器: $SERVER_IP"
echo "📡 域名: $DOMAIN"

# 1. 构建生产版本
echo "📦 构建生产版本..."
npm run build

# 2. 创建部署包
echo "📋 创建部署包..."
tar -czf school-news-site.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.next/cache \
  --exclude=deployment-guide.md \
  --exclude=deploy.sh \
  .

echo "📤 上传文件到服务器..."
scp school-news-site.tar.gz $USER@$SERVER_IP:/tmp/

# 3. 在服务器上执行部署
echo "🔧 在服务器上执行部署..."
ssh $USER@$SERVER_IP << EOF
set -e

# 创建应用目录
sudo mkdir -p $DEPLOY_PATH
sudo chown -R \$USER:\$USER $DEPLOY_PATH

# 备份现有应用（如果存在）
if [ -d "$DEPLOY_PATH/package.json" ]; then
    echo "📋 备份现有应用..."
    sudo cp -r $DEPLOY_PATH $DEPLOY_PATH.backup.\$(date +%Y%m%d_%H%M%S)
fi

# 解压新版本
echo "📦 解压应用文件..."
cd $DEPLOY_PATH
tar -xzf /tmp/school-news-site.tar.gz
rm /tmp/school-news-site.tar.gz

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

# 检查Nginx配置
if [ ! -f "/etc/nginx/sites-available/$DOMAIN" ]; then
    echo "⚙️ 创建Nginx配置..."
    sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name $DOMAIN ${DOMAIN#www.};
    
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
    }
}
NGINX_EOF

    sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
fi

echo "✅ 部署完成！"
echo "🌐 请访问: http://$DOMAIN"
echo "📊 应用状态:"
pm2 status
EOF

# 清理本地文件
rm school-news-site.tar.gz

echo ""
echo "🎉 部署完成！"
echo "🌐 网站地址: http://$DOMAIN"
echo "📊 查看应用状态: ssh $USER@$SERVER_IP 'pm2 status'"
echo "📝 查看应用日志: ssh $USER@$SERVER_IP 'pm2 logs $APP_NAME'"
echo ""
echo "🔒 配置SSL证书:"
echo "ssh $USER@$SERVER_IP 'sudo certbot --nginx -d $DOMAIN -d ${DOMAIN#www.}'"