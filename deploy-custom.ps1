# 部署脚本 - 针对服务器 139.196.122.188
# PowerShell 版本

# 配置变量
$SERVER_IP = "139.196.122.188"
$SERVER_USER = "root"
$APP_NAME = "school-news-site"
$DEPLOY_PATH = "/var/www/$APP_NAME"
$LOCAL_BUILD_PATH = ".next"
$PACKAGE_NAME = "deploy-package.zip"

Write-Host "开始部署到服务器 $SERVER_IP..." -ForegroundColor Green

# 检查构建文件是否存在
if (-not (Test-Path $LOCAL_BUILD_PATH)) {
    Write-Host "错误: 构建文件不存在，请先运行 npm run build" -ForegroundColor Red
    exit 1
}

# 创建临时环境变量文件
Write-Host "创建环境变量文件..." -ForegroundColor Yellow
$envLines = @(
    "# Supabase 配置",
    "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key",
    "",
    "# Next.js 配置",
    "NEXTAUTH_URL=http://$SERVER_IP`:3000",
    "NEXTAUTH_SECRET=your-nextauth-secret",
    "",
    "# 应用配置",
    "NEXT_PUBLIC_APP_NAME=校园新闻网站",
    "NEXT_PUBLIC_APP_DESCRIPTION=现代化的校园新闻发布平台",
    "NEXT_PUBLIC_APP_URL=http://$SERVER_IP`:3000",
    "",
    "# 上传限制",
    "NEXT_PUBLIC_MAX_FILE_SIZE=10485760",
    "NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp"
)

$envLines | Out-File -FilePath ".env.production" -Encoding UTF8

# 创建部署包
Write-Host "创建部署包..." -ForegroundColor Yellow

# 删除旧的部署包
if (Test-Path $PACKAGE_NAME) {
    Remove-Item $PACKAGE_NAME -Force
}

# 创建压缩包
$filesToCompress = @(
    ".next",
    "public",
    "package.json",
    "package-lock.json",
    ".env.production"
)

# 检查文件是否存在并添加到压缩包
$existingFiles = @()
foreach ($file in $filesToCompress) {
    if (Test-Path $file) {
        $existingFiles += $file
    } else {
        Write-Host "警告: 文件 $file 不存在，跳过" -ForegroundColor Yellow
    }
}

if ($existingFiles.Count -eq 0) {
    Write-Host "错误: 没有找到要压缩的文件" -ForegroundColor Red
    exit 1
}

# 使用 PowerShell 的 Compress-Archive 命令
Compress-Archive -Path $existingFiles -DestinationPath $PACKAGE_NAME -Force

Write-Host "部署包创建完成: $PACKAGE_NAME" -ForegroundColor Green

# 显示手动部署说明
Write-Host "" 
Write-Host "部署包已准备完成！请手动执行以下步骤:" -ForegroundColor Cyan
Write-Host "" 
Write-Host "1. 上传文件到服务器:" -ForegroundColor Yellow
Write-Host "   scp $PACKAGE_NAME ${SERVER_USER}@${SERVER_IP}:/tmp/" -ForegroundColor White
Write-Host "" 
Write-Host "2. 在服务器上执行以下命令:" -ForegroundColor Yellow
Write-Host "   sudo mkdir -p $DEPLOY_PATH" -ForegroundColor White
Write-Host "   sudo chown -R ${SERVER_USER}:${SERVER_USER} $DEPLOY_PATH" -ForegroundColor White
Write-Host "   cd $DEPLOY_PATH" -ForegroundColor White
Write-Host "   sudo unzip -o /tmp/$PACKAGE_NAME" -ForegroundColor White
Write-Host "   sudo npm install --production" -ForegroundColor White
Write-Host "   sudo npm install -g pm2" -ForegroundColor White
Write-Host "   pm2 start npm --name '$APP_NAME' -- start" -ForegroundColor White
Write-Host "   pm2 save" -ForegroundColor White
Write-Host "   pm2 startup" -ForegroundColor White
Write-Host "" 

# 清理本地文件
Write-Host "清理本地临时文件..." -ForegroundColor Yellow
Remove-Item ".env.production" -Force -ErrorAction SilentlyContinue

Write-Host "本地部署准备完成！" -ForegroundColor Green