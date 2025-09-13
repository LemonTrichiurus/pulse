# 手动部署指南 - 子路径部署到 47.101.144.238/sclspulse

## 当前状态
✅ 项目已成功构建（支持子路径 /sclspulse）  
✅ 部署包已创建：`deploy-package.zip`  
✅ 环境变量文件已创建：`.env.production`  

## 需要手动完成的步骤

### 1. 上传文件到服务器
```bash
# 上传部署包
scp deploy-package.zip root@47.101.144.238:/tmp/

# 上传环境变量文件
scp .env.production root@47.101.144.238:/tmp/
```

### 2. 登录服务器并部署
```bash
# 登录服务器
ssh root@47.101.144.238

# 创建应用目录
mkdir -p /var/www/sclspulse
cd /var/www/sclspulse

# 备份现有文件（如果存在）
if [ -d ".next" ]; then
  mv .next .next.backup.$(date +%Y%m%d_%H%M%S)
fi

# 解压部署包
unzip -o /tmp/deploy-package.zip

# 复制环境变量文件
cp /tmp/.env.production .env.local

# 安装依赖
npm install --production

# 设置权限
chown -R www-data:www-data /var/www/sclspulse
chmod -R 755 /var/www/sclspulse
```

### 3. 配置 PM2
```bash
# 停止现有进程（如果存在）
pm2 stop sclspulse 2>/dev/null || true
pm2 delete sclspulse 2>/dev/null || true

# 启动新进程
cd /var/www/sclspulse
pm2 start npm --name "sclspulse" -- start -- -p 3001
pm2 save
```

### 4. 配置 Nginx 子路径
```bash
# 创建 Nginx 配置
cat > /etc/nginx/sites-available/sclspulse << 'EOF'
location /sclspulse/ {
    proxy_pass http://localhost:3001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # 处理静态资源
    location ~* ^/sclspulse/(_next/static|favicon\.ico|robots\.txt) {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/sclspulse /etc/nginx/sites-enabled/

# 或者添加到现有的默认站点配置
# 编辑 /etc/nginx/sites-available/default，在 server 块中添加上述 location 配置

# 测试并重载 Nginx
nginx -t && systemctl reload nginx
```

### 5. 配置环境变量
编辑 `/var/www/sclspulse/.env.local` 文件，填入正确的配置：

```bash
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 应用配置
NEXT_PUBLIC_BASE_PATH=/sclspulse
NEXT_PUBLIC_SITE_URL=http://47.101.144.238/sclspulse

# 其他配置
NODE_ENV=production
```

### 6. 重启应用
```bash
pm2 restart sclspulse
```

## 验证部署

1. 检查 PM2 进程状态：
```bash
pm2 status
pm2 logs sclspulse
```

2. 检查 Nginx 配置：
```bash
nginx -t
systemctl status nginx
```

3. 访问网站：
   - 主页：http://47.101.144.238/sclspulse
   - API：http://47.101.144.238/sclspulse/api/health

## 常用维护命令

```bash
# 查看应用日志
pm2 logs sclspulse

# 重启应用
pm2 restart sclspulse

# 查看 Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 更新部署（重复步骤 1-2 和 6）
```

## 注意事项

1. **端口冲突**：确保端口 3001 未被其他应用占用
2. **权限设置**：确保 www-data 用户有读取应用文件的权限
3. **防火墙**：确保服务器防火墙允许 80 和 443 端口访问
4. **SSL证书**：如需 HTTPS，请配置相应的 SSL 证书
5. **环境变量**：请替换 `.env.local` 中的占位符为实际值

## 故障排除

如果遇到问题，请检查：
1. PM2 进程是否正常运行
2. Nginx 配置是否正确
3. 端口是否被占用
4. 环境变量是否配置正确
5. 文件权限是否正确设置