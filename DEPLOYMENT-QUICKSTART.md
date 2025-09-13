# 🚀 快速部署指南

## 概述

本指南将帮助您将学校新闻网站部署到服务器 `47.101.144.238` 并绑定域名 `www.sclspulse.cn`。

## 📋 准备工作

### 1. 域名DNS配置

登录您的域名注册商管理面板，添加以下DNS记录：

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

### 2. 服务器访问

确保您可以SSH连接到服务器：
```bash
ssh root@47.101.144.238
```

## 🛠️ 部署步骤

### 方式一：自动化部署（推荐）

#### 1. 服务器环境初始化

在服务器上运行环境配置脚本：
```bash
# 上传脚本到服务器
scp server-setup.sh root@47.101.144.238:/tmp/

# 在服务器上执行
ssh root@47.101.144.238
chmod +x /tmp/server-setup.sh
/tmp/server-setup.sh
```

#### 2. 配置环境变量

在服务器上配置生产环境变量：
```bash
# 复制环境变量模板
cp /var/www/sclspulse/.env.template /var/www/sclspulse/.env.production

# 编辑环境变量
nano /var/www/sclspulse/.env.production
```

填入您的实际配置：
- Supabase URL和密钥
- NextAuth密钥
- 其他必要配置

#### 3. 执行自动部署

在本地项目目录执行：
```bash
# 给脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh 47.101.144.238 www.sclspulse.cn
```

#### 4. 配置SSL证书

在服务器上申请SSL证书：
```bash
sudo certbot --nginx -d www.sclspulse.cn -d sclspulse.cn
```

#### 5. 验证部署

运行检查脚本：
```bash
# 给脚本执行权限
chmod +x check-deployment.sh

# 检查部署状态
./check-deployment.sh www.sclspulse.cn 47.101.144.238
```

### 方式二：手动部署

如果自动化脚本遇到问题，请参考 `deployment-guide.md` 进行手动部署。

## 🔍 验证清单

部署完成后，请检查以下项目：

- [ ] DNS解析正确：`nslookup www.sclspulse.cn`
- [ ] HTTP访问正常：`curl -I http://www.sclspulse.cn`
- [ ] HTTPS访问正常：`curl -I https://www.sclspulse.cn`
- [ ] 应用进程运行：`pm2 status`
- [ ] Nginx服务正常：`sudo systemctl status nginx`
- [ ] 网站功能正常：访问各个页面测试

## 🚨 常见问题

### DNS解析不生效
- 等待DNS传播（通常5-30分钟）
- 检查域名注册商DNS设置
- 使用 `nslookup` 或 `dig` 命令验证

### 网站无法访问
- 检查服务器防火墙设置
- 确认Nginx配置正确
- 查看应用日志：`pm2 logs sclspulse`

### SSL证书申请失败
- 确保域名已正确解析到服务器
- 检查80端口是否开放
- 暂时关闭防火墙重试

### 应用启动失败
- 检查环境变量配置
- 查看详细错误日志
- 确认依赖包安装完整

## 📞 技术支持

如果遇到问题，请：

1. 运行 `check-deployment.sh` 获取详细状态
2. 查看相关日志文件
3. 检查 `deployment-guide.md` 中的详细说明

## 🔧 维护命令

```bash
# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs sclspulse

# 重启应用
pm2 restart sclspulse

# 查看Nginx状态
sudo systemctl status nginx

# 重启Nginx
sudo systemctl restart nginx

# 查看系统资源
htop

# 查看磁盘使用
df -h
```

## 🎉 完成！

部署成功后，您的网站将在以下地址可用：
- http://www.sclspulse.cn
- https://www.sclspulse.cn（配置SSL后）
- http://sclspulse.cn
- https://sclspulse.cn（配置SSL后）

祝您使用愉快！🎊