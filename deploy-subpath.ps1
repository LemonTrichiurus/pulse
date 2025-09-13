# 学校新闻网站子路径部署脚本 (PowerShell版本)
# 部署到 http://47.101.144.238/sclspulse

$ErrorActionPreference = "Stop"

Write-Host "🚀 开始部署学校新闻网站到子路径 /sclspulse..." -ForegroundColor Green

# 配置变量
$SERVER_IP = "47.101.144.238"
$SERVER_USER = "root"
$APP_NAME = "school-news-site"
$PORT = 3001

Write-Host "📦 1. 构建生产版本..." -ForegroundColor Yellow
# 设置子路径环境变量
$env:NEXT_PUBLIC_BASE_PATH = "/sclspulse"
npm run build

Write-Host "📝 2. 创建临时环境变量文件..." -ForegroundColor Yellow
$envContent = @"
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
"@

$envContent | Out-File -FilePath ".env.production.temp" -Encoding UTF8

Write-Host "📦 3. 创建部署包..." -ForegroundColor Yellow
# 使用 PowerShell 压缩
$filesToCompress = @(".next", "public", "package.json", "package-lock.json", "next.config.ts", ".env.production.temp", "ecosystem.config.js")
Compress-Archive -Path $filesToCompress -DestinationPath "$APP_NAME-subpath.zip" -Force

Write-Host "📤 4. 上传文件到服务器..." -ForegroundColor Yellow
Write-Host "请确保已配置SSH密钥或准备输入密码" -ForegroundColor Cyan

# 使用 scp 上传文件
try {
    & scp "$APP_NAME-subpath.zip" "${SERVER_USER}@${SERVER_IP}:/tmp/"
    Write-Host "✅ 文件上传成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 文件上传失败: $_" -ForegroundColor Red
    Write-Host "请确保已安装 OpenSSH 客户端或 Git for Windows" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔧 5. 服务器端部署..." -ForegroundColor Yellow

# 创建服务器端部署脚本
$deployScript = @"
#!/bin/bash
set -e

echo "创建应用目录..."
sudo mkdir -p /var/www/sclspulse
cd /var/www/sclspulse

echo "备份现有部署..."
if [ -d "current" ]; then
    sudo mv current backup-`$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
fi

echo "解压新版本..."
sudo mkdir -p current
cd current
sudo unzip -q /tmp/$APP_NAME-subpath.zip
sudo chown -R `$USER:`$USER /var/www/sclspulse

echo "配置环境变量..."
mv .env.production.temp .env.production

echo "安装依赖..."
npm ci --production

echo "停止现有进程..."
pm2 delete sclspulse 2>/dev/null || true

echo "启动应用..."
pm2 start npm --name "sclspulse" -- start
pm2 save

echo "✅ 应用已启动在端口 3001"
"@

# 将部署脚本写入临时文件并执行
$deployScript | Out-File -FilePath "deploy-temp.sh" -Encoding UTF8

try {
    & scp "deploy-temp.sh" "${SERVER_USER}@${SERVER_IP}:/tmp/"
    & ssh "${SERVER_USER}@${SERVER_IP}" "chmod +x /tmp/deploy-temp.sh && /tmp/deploy-temp.sh"
    Write-Host "✅ 服务器端部署完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 服务器端部署失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🌐 6. 配置 Nginx 子路径..." -ForegroundColor Yellow

# 创建 Nginx 配置脚本
$nginxScript = @"
#!/bin/bash
echo "配置 Nginx 子路径..."

# 创建 Nginx 子路径配置
sudo tee /etc/nginx/sites-available/sclspulse > /dev/null << 'EOF'
# 学校新闻网站子路径配置
location /sclspulse/ {
    rewrite ^/sclspulse/(.*) /`$1 break;
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade `$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host `$host;
    proxy_set_header X-Real-IP `$remote_addr;
    proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto `$scheme;
    proxy_cache_bypass `$http_upgrade;
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)`$ {
        proxy_pass http://127.0.0.1:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

location /sclspulse/api/ {
    rewrite ^/sclspulse/api/(.*) /api/`$1 break;
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host `$host;
    proxy_set_header X-Real-IP `$remote_addr;
    proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto `$scheme;
}
EOF

# 将配置包含到主配置中
if ! grep -q "include /etc/nginx/sites-available/sclspulse" /etc/nginx/sites-available/default; then
    sudo sed -i '/server {/a\\    include /etc/nginx/sites-available/sclspulse;' /etc/nginx/sites-available/default
fi

# 测试并重载 Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Nginx 配置已更新"
"@

# 将 Nginx 配置脚本写入临时文件并执行
$nginxScript | Out-File -FilePath "nginx-temp.sh" -Encoding UTF8

try {
    & scp "nginx-temp.sh" "${SERVER_USER}@${SERVER_IP}:/tmp/"
    & ssh "${SERVER_USER}@${SERVER_IP}" "chmod +x /tmp/nginx-temp.sh && /tmp/nginx-temp.sh"
    Write-Host "✅ Nginx 配置完成" -ForegroundColor Green
} catch {
    Write-Host "❌ Nginx 配置失败: $_" -ForegroundColor Red
    Write-Host "请手动配置 Nginx" -ForegroundColor Yellow
}

Write-Host "🧹 7. 清理本地文件..." -ForegroundColor Yellow
Remove-Item "$APP_NAME-subpath.zip" -ErrorAction SilentlyContinue
Remove-Item ".env.production.temp" -ErrorAction SilentlyContinue
Remove-Item "deploy-temp.sh" -ErrorAction SilentlyContinue
Remove-Item "nginx-temp.sh" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host "📱 访问地址: http://47.101.144.238/sclspulse" -ForegroundColor Cyan
Write-Host "🔧 管理后台: http://47.101.144.238/sclspulse/admin" -ForegroundColor Cyan
Write-Host "🔌 API 接口: http://47.101.144.238/sclspulse/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 重要提醒:" -ForegroundColor Yellow
Write-Host "1. 请在服务器上编辑环境变量文件配置正确的参数"
Write-Host "2. 配置完成后重启应用"
Write-Host "3. 检查应用状态和日志"
Write-Host ""
Write-Host "🔧 常用维护命令:" -ForegroundColor Yellow
Write-Host "  重启应用: ssh root@47.101.144.238 'pm2 restart sclspulse'"
Write-Host "  查看状态: ssh root@47.101.144.238 'pm2 status'"
Write-Host "  查看日志: ssh root@47.101.144.238 'pm2 logs sclspulse --lines 50'"
Write-Host "  更新代码: powershell -ExecutionPolicy Bypass -File deploy-subpath.ps1"