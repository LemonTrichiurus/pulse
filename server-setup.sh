#!/bin/bash

# 服务器环境初始化脚本
# 在服务器上运行: curl -sSL https://raw.githubusercontent.com/your-repo/server-setup.sh | bash
# 或者手动上传后运行: chmod +x server-setup.sh && ./server-setup.sh

set -e

echo "🔧 开始配置服务器环境..."

# 更新系统
echo "📦 更新系统包..."
sudo apt update && sudo apt upgrade -y

# 安装基础工具
echo "🛠️ 安装基础工具..."
sudo apt install -y curl wget git unzip htop

# 安装Node.js 18.x
echo "📦 安装Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "✅ Node.js版本: $(node --version)"
echo "✅ npm版本: $(npm --version)"

# 安装PM2
echo "🚀 安装PM2进程管理器..."
npm install -g pm2

# 安装Nginx
echo "🌐 安装Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 安装Certbot (SSL证书)
echo "🔒 安装Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# 配置防火墙
echo "🛡️ 配置防火墙..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

echo "🔥 防火墙状态:"
sudo ufw status

# 创建应用目录
echo "📁 创建应用目录..."
sudo mkdir -p /var/www/sclspulse
sudo chown -R $USER:$USER /var/www/sclspulse

# 配置Git（如果需要）
echo "📝 配置Git全局设置..."
git config --global init.defaultBranch main

# 优化系统性能
echo "⚡ 优化系统性能..."
# 增加文件描述符限制
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# 配置swap（如果内存小于2GB）
MEM_SIZE=$(free -m | awk 'NR==2{printf "%.0f", $2}')
if [ $MEM_SIZE -lt 2048 ]; then
    echo "💾 配置Swap文件（内存小于2GB）..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 创建环境变量模板
echo "📋 创建环境变量模板..."
cat > /var/www/sclspulse/.env.template << 'EOF'
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# NextAuth配置
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://www.sclspulse.cn

# 环境配置
NODE_ENV=production
PORT=3000
EOF

echo ""
echo "🎉 服务器环境配置完成！"
echo ""
echo "📋 已安装的软件:"
echo "   - Node.js: $(node --version)"
echo "   - npm: $(npm --version)"
echo "   - PM2: $(pm2 --version)"
echo "   - Nginx: $(nginx -v 2>&1)"
echo "   - Certbot: $(certbot --version | head -1)"
echo ""
echo "📁 应用目录: /var/www/sclspulse"
echo "📝 环境变量模板: /var/www/sclspulse/.env.template"
echo ""
echo "🔄 下一步操作:"
echo "1. 配置环境变量: cp /var/www/sclspulse/.env.template /var/www/sclspulse/.env.production"
echo "2. 编辑环境变量: nano /var/www/sclspulse/.env.production"
echo "3. 上传并部署应用"
echo "4. 配置SSL证书: sudo certbot --nginx -d www.sclspulse.cn -d sclspulse.cn"
echo ""
echo "🔍 系统信息:"
echo "   - 内存: ${MEM_SIZE}MB"
echo "   - 磁盘空间: $(df -h / | awk 'NR==2 {print $4}') 可用"
echo "   - 防火墙状态: $(sudo ufw status | head -1)"