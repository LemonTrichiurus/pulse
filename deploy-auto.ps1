# 自动化部署脚本 - PowerShell版本
# 针对服务器 139.196.122.188

# 配置变量
$SERVER_IP = "139.196.122.188"
$APP_NAME = "school-news-site"
$DEPLOY_PATH = "/var/www/school-news-site"
$USER = "root"

Write-Host "开始自动化部署到服务器: $SERVER_IP" -ForegroundColor Green
Write-Host "访问地址将是: http://$SERVER_IP" -ForegroundColor Cyan

# 1. 构建生产版本
Write-Host "构建生产版本..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "构建失败" -ForegroundColor Red
    exit 1
}

# 2. 创建临时环境变量文件
Write-Host "创建临时环境变量..." -ForegroundColor Yellow
$envContent = @"
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
"@

$envContent | Out-File -FilePath ".env.production.temp" -Encoding UTF8

# 3. 创建部署包
Write-Host "创建部署包..." -ForegroundColor Yellow

# 删除旧的部署包
if (Test-Path "school-news-site-ip.zip") {
    Remove-Item "school-news-site-ip.zip" -Force
}

# 创建要打包的文件列表
$filesToPackage = @(
    ".next",
    "public",
    "package.json",
    "package-lock.json"
)

# 检查文件是否存在
$existingFiles = @()
foreach ($file in $filesToPackage) {
    if (Test-Path $file) {
        $existingFiles += $file
    } else {
        Write-Host "警告: 文件 $file 不存在，跳过" -ForegroundColor Yellow
    }
}

# 使用zip格式创建部署包
Compress-Archive -Path $existingFiles -DestinationPath "school-news-site-ip.zip" -Force
Write-Host "ZIP部署包创建成功" -ForegroundColor Green

# 4. 检查服务器连接
Write-Host "检查服务器连接..." -ForegroundColor Yellow
$connection = Test-NetConnection -ComputerName $SERVER_IP -Port 22
if (-not $connection.TcpTestSucceeded) {
    Write-Host "无法连接到服务器 SSH 端口 22" -ForegroundColor Red
    Write-Host "请检查:" -ForegroundColor Yellow
    Write-Host "1. 服务器是否开启 SSH 服务" -ForegroundColor White
    Write-Host "2. 防火墙是否开放 22 端口" -ForegroundColor White
    Write-Host "3. 服务器 IP 地址是否正确" -ForegroundColor White
    Write-Host "" 
    Write-Host "部署包已准备完成: school-news-site-ip.zip" -ForegroundColor Cyan
    Write-Host "环境变量文件已准备: .env.production.temp" -ForegroundColor Cyan
    Write-Host "" 
    Write-Host "请在服务器可访问后手动执行以下命令:" -ForegroundColor Yellow
    Write-Host "scp school-news-site-ip.zip root@$SERVER_IP:/tmp/" -ForegroundColor White
    Write-Host "scp .env.production.temp root@$SERVER_IP:/tmp/" -ForegroundColor White
    exit 1
}

Write-Host "服务器连接正常" -ForegroundColor Green

# 5. 上传文件到服务器
Write-Host "上传文件到服务器..." -ForegroundColor Yellow

# 上传部署包
scp "school-news-site-ip.zip" "${USER}@${SERVER_IP}:/tmp/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "部署包上传失败" -ForegroundColor Red
    exit 1
}

# 上传环境变量文件
scp ".env.production.temp" "${USER}@${SERVER_IP}:/tmp/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "环境变量文件上传失败" -ForegroundColor Red
    exit 1
}

Write-Host "文件上传成功" -ForegroundColor Green

# 6. 在服务器上执行部署
Write-Host "在服务器上执行部署..." -ForegroundColor Yellow

$serverCommands = @"
set -e
echo "创建应用目录..."
sudo mkdir -p $DEPLOY_PATH
sudo chown -R `$USER:`$USER $DEPLOY_PATH

if [ -f "$DEPLOY_PATH/package.json" ]; then
    echo "备份现有应用..."
    sudo cp -r $DEPLOY_PATH $DEPLOY_PATH.backup.`$(date +%Y%m%d_%H%M%S)
fi

echo "解压应用文件..."
cd $DEPLOY_PATH
unzip -o /tmp/school-news-site-ip.zip

echo "复制环境变量..."
cp /tmp/.env.production.temp .env.production
rm /tmp/school-news-site-ip.zip /tmp/.env.production.temp

echo "安装生产依赖..."
npm install --production

echo "检查PM2进程..."
if pm2 list | grep -q "$APP_NAME"; then
    echo "重启应用..."
    pm2 restart $APP_NAME
else
    echo "启动新应用..."
    pm2 start npm --name "$APP_NAME" -- start
    pm2 save
fi

echo "部署完成！"
echo "请访问: http://$SERVER_IP"
echo "应用状态:"
pm2 status
"@

# 执行远程部署脚本
$serverCommands | ssh "${USER}@${SERVER_IP}" 'bash -s'
if ($LASTEXITCODE -ne 0) {
    Write-Host "服务器部署失败" -ForegroundColor Red
    exit 1
}

# 清理本地文件
Write-Host "清理本地临时文件..." -ForegroundColor Yellow
Remove-Item "school-news-site-ip.zip" -Force -ErrorAction SilentlyContinue
Remove-Item ".env.production.temp" -Force -ErrorAction SilentlyContinue

Write-Host "" 
Write-Host "自动化部署完成！" -ForegroundColor Green
Write-Host "网站地址: http://$SERVER_IP" -ForegroundColor Cyan
Write-Host "查看应用状态: ssh ${USER}@${SERVER_IP} 'pm2 status'" -ForegroundColor White
Write-Host "查看应用日志: ssh ${USER}@${SERVER_IP} 'pm2 logs $APP_NAME'" -ForegroundColor White
Write-Host "" 
Write-Host "重要提醒:" -ForegroundColor Yellow
Write-Host "1. 请及时注册域名并配置DNS解析" -ForegroundColor White
Write-Host "2. 当前仅支持HTTP访问，域名配置后可申请SSL证书" -ForegroundColor White
Write-Host "3. 请在服务器上编辑 .env.production 填入正确的Supabase配置" -ForegroundColor White
Write-Host "" 
Write-Host "下一步操作:" -ForegroundColor Cyan
Write-Host "1. ssh ${USER}@${SERVER_IP}" -ForegroundColor White
Write-Host "2. cd $DEPLOY_PATH" -ForegroundColor White
Write-Host "3. nano .env.production  # 编辑环境变量" -ForegroundColor White
Write-Host "4. pm2 restart $APP_NAME  # 重启应用" -ForegroundColor White