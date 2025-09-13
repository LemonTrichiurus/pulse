# 域名和服务器部署配置指南

## 1. DNS 配置

### 域名解析设置
登录您的域名注册商管理面板（如阿里云、腾讯云等），添加以下DNS记录：

```
记录类型: A
主机记录: www
记录值: 47.101.144.238
TTL: 600

记录类型: A  
主机记录: @
记录值: 47.101.144.238
TTL: 600
```

### 验证DNS解析
```bash
# 检查域名解析是否生效
nslookup www.sclspulse.cn
ping www.sclspulse.cn
```

## 2. 服务器环境配置

### 连接服务器
```bash
ssh root@47.101.144.238
```

### 安装Node.js和npm
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 安装PM2进程管理器
```bash
npm install -g pm2
```

### 安装Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 3. 项目部署

### 创建项目目录
```bash
sudo mkdir -p /var/www/sclspulse
sudo chown -R $USER:$USER /var/www/sclspulse
cd /var/www/sclspulse
```

### 上传项目文件
在本地项目目录执行：
```bash
# 构建生产版本
npm run build

# 压缩项目文件（排除node_modules）
tar -czf school-news-site.tar.gz --exclude=node_modules --exclude=.git .

# 上传到服务器
scp school-news-site.tar.gz root@47.101.144.238:/var/www/sclspulse/
```

### 在服务器上解压和安装
```bash
cd /var/www/sclspulse
tar -xzf school-news-site.tar.gz
npm install --production
```

## 4. 环境变量配置

创建生产环境配置文件：
```bash
cd /var/www/sclspulse
nano .env.production
```

添加以下内容：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://www.sclspulse.cn
NODE_ENV=production
```

## 5. Nginx配置

创建Nginx配置文件：
```bash
sudo nano /etc/nginx/sites-available/sclspulse.cn
```

添加以下配置：
```nginx
server {
    listen 80;
    server_name www.sclspulse.cn sclspulse.cn;
    
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
    }
}
```

启用站点配置：
```bash
sudo ln -s /etc/nginx/sites-available/sclspulse.cn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. 启动应用

使用PM2启动Next.js应用：
```bash
cd /var/www/sclspulse
pm2 start npm --name "sclspulse" -- start
pm2 save
pm2 startup
```

## 7. SSL证书配置

### 安装Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 申请SSL证书
```bash
sudo certbot --nginx -d www.sclspulse.cn -d sclspulse.cn
```

### 设置自动续期
```bash
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

## 8. 防火墙配置

```bash
# 启用UFW防火墙
sudo ufw enable

# 允许SSH
sudo ufw allow ssh

# 允许HTTP和HTTPS
sudo ufw allow 'Nginx Full'

# 查看状态
sudo ufw status
```

## 9. 验证部署

1. 检查DNS解析：`nslookup www.sclspulse.cn`
2. 检查HTTP访问：`curl -I http://www.sclspulse.cn`
3. 检查HTTPS访问：`curl -I https://www.sclspulse.cn`
4. 检查PM2进程：`pm2 status`
5. 检查Nginx状态：`sudo systemctl status nginx`

## 10. 常用维护命令

```bash
# 查看应用日志
pm2 logs sclspulse

# 重启应用
pm2 restart sclspulse

# 更新应用
cd /var/www/sclspulse
git pull  # 如果使用git
npm run build
pm2 restart sclspulse

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 注意事项

1. 确保服务器安全组/防火墙开放80、443、22端口
2. 定期备份数据库和应用文件
3. 监控服务器资源使用情况
4. 及时更新系统和依赖包
5. 配置日志轮转避免磁盘空间不足