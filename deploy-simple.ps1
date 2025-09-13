# 简化版自动化部署脚本
# 服务器: 139.196.122.188

$SERVER_IP = "139.196.122.188"
$APP_NAME = "school-news-site"
$DEPLOY_PATH = "/var/www/school-news-site"
$USER = "root"

Write-Host "开始部署到服务器: $SERVER_IP" -ForegroundColor Green

# 1. 构建项目
Write-Host "正在构建项目..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "构建完成" -ForegroundColor Green

# 2. 创建环境变量文件
Write-Host "创建环境变量文件..." -ForegroundColor Yellow
@"
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://$SERVER_IP
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=http://$SERVER_IP
NEXT_PUBLIC_API_URL=http://$SERVER_IP/api
"@ | Out-File -FilePath ".env.production.temp" -Encoding UTF8

# 3. 创建部署包
Write-Host "创建部署包..." -ForegroundColor Yellow
if (Test-Path "deploy-package.zip") {
    Remove-Item "deploy-package.zip" -Force
}

$files = @(".next", "public", "package.json", "package-lock.json")
$existingFiles = @()
foreach ($file in $files) {
    if (Test-Path $file) {
        $existingFiles += $file
    }
}

Compress-Archive -Path $existingFiles -DestinationPath "deploy-package.zip" -Force
Write-Host "部署包创建完成" -ForegroundColor Green

# 4. 检查服务器连接
Write-Host "检查服务器连接..." -ForegroundColor Yellow
$connection = Test-NetConnection -ComputerName $SERVER_IP -Port 22 -WarningAction SilentlyContinue
if (-not $connection.TcpTestSucceeded) {
    Write-Host "无法连接服务器SSH端口" -ForegroundColor Red
    Write-Host "部署包已准备: deploy-package.zip" -ForegroundColor Cyan
    Write-Host "环境文件已准备: .env.production.temp" -ForegroundColor Cyan
    Write-Host "请检查服务器SSH服务状态" -ForegroundColor Yellow
    exit 1
}
Write-Host "服务器连接正常" -ForegroundColor Green

# 5. 上传文件
Write-Host "上传文件到服务器..." -ForegroundColor Yellow
scp "deploy-package.zip" "${USER}@${SERVER_IP}:/tmp/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "部署包上传失败" -ForegroundColor Red
    exit 1
}

scp ".env.production.temp" "${USER}@${SERVER_IP}:/tmp/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "环境文件上传失败" -ForegroundColor Red
    exit 1
}
Write-Host "文件上传完成" -ForegroundColor Green

# 6. 执行服务器部署
Write-Host "执行服务器部署..." -ForegroundColor Yellow
$deployScript = @'
set -e
echo "创建目录..."
sudo mkdir -p /var/www/school-news-site
sudo chown -R $USER:$USER /var/www/school-news-site

if [ -f "/var/www/school-news-site/package.json" ]; then
    echo "备份现有版本..."
    sudo cp -r /var/www/school-news-site /var/www/school-news-site.backup.$(date +%Y%m%d_%H%M%S)
fi

echo "解压新版本..."
cd /var/www/school-news-site
unzip -o /tmp/deploy-package.zip

echo "配置环境变量..."
cp /tmp/.env.production.temp .env.production
rm /tmp/deploy-package.zip /tmp/.env.production.temp

echo "安装依赖..."
npm install --production

echo "管理PM2进程..."
if pm2 list | grep -q "school-news-site"; then
    echo "重启应用..."
    pm2 restart school-news-site
else
    echo "启动应用..."
    pm2 start npm --name "school-news-site" -- start
    pm2 save
fi

echo "部署完成"
echo "访问地址: http://139.196.122.188"
pm2 status
'@

$deployScript | ssh "${USER}@${SERVER_IP}" 'bash -s'
if ($LASTEXITCODE -ne 0) {
    Write-Host "服务器部署失败" -ForegroundColor Red
    exit 1
}

# 7. 清理本地文件
Write-Host "清理临时文件..." -ForegroundColor Yellow
Remove-Item "deploy-package.zip" -Force -ErrorAction SilentlyContinue
Remove-Item ".env.production.temp" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "部署成功完成!" -ForegroundColor Green
Write-Host "网站地址: http://$SERVER_IP" -ForegroundColor Cyan
Write-Host "管理命令:" -ForegroundColor Yellow
Write-Host "  查看状态: ssh ${USER}@${SERVER_IP} 'pm2 status'" -ForegroundColor White
Write-Host "  查看日志: ssh ${USER}@${SERVER_IP} 'pm2 logs $APP_NAME'" -ForegroundColor White
Write-Host "  重启应用: ssh ${USER}@${SERVER_IP} 'pm2 restart $APP_NAME'" -ForegroundColor White
Write-Host ""
Write-Host "注意事项:" -ForegroundColor Yellow
Write-Host "1. 请编辑服务器上的 .env.production 文件配置正确的Supabase信息" -ForegroundColor White
Write-Host "2. 当前为HTTP访问，建议后续配置域名和SSL证书" -ForegroundColor White