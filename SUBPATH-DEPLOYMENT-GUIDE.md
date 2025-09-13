# 🌐 子路径部署指南

## 📋 概述

当服务器IP上已经有其他网站时，可以将学校新闻网站部署到子路径 `/sclspulse`，实现多网站共存。

**部署后访问地址：** `http://47.101.144.238/sclspulse`

## 🚀 快速部署

### 1. 一键部署

```bash
# 在项目根目录执行
npm run deploy:subpath
```

### 2. 配置环境变量

部署完成后，需要在服务器上配置环境变量：

```bash
# SSH 连接到服务器
ssh root@47.101.144.238

# 编辑环境变量文件
nano /var/www/sclspulse/current/.env.production
```

配置以下关键变量：

```env
# 子路径配置
NEXT_PUBLIC_BASE_PATH=/sclspulse
NEXTAUTH_URL=http://47.101.144.238/sclspulse
NEXTAUTH_SECRET=your-secure-secret-here

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# 应用配置
NODE_ENV=production
PORT=3001
```

### 3. 重启应用

```bash
# 重启应用使配置生效
pm2 restart sclspulse
```

## 🔧 技术实现

### Next.js 配置

项目已配置支持子路径部署：

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  trailingSlash: true,
  output: 'standalone',
};
```

### Nginx 配置

自动配置的 Nginx 规则：

```nginx
# 主应用路由
location /sclspulse/ {
    rewrite ^/sclspulse/(.*) /$1 break;
    proxy_pass http://127.0.0.1:3001;
    # ... 其他代理配置
}

# API 路由
location /sclspulse/api/ {
    rewrite ^/sclspulse/api/(.*) /api/$1 break;
    proxy_pass http://127.0.0.1:3001;
    # ... 其他代理配置
}
```

### 端口配置

- **应用端口**: 3001（避免与主网站冲突）
- **访问端口**: 80（通过 Nginx 代理）

## 📱 访问地址

部署完成后，可通过以下地址访问：

- **网站首页**: http://47.101.144.238/sclspulse
- **管理后台**: http://47.101.144.238/sclspulse/admin
- **API 接口**: http://47.101.144.238/sclspulse/api
- **登录页面**: http://47.101.144.238/sclspulse/auth/signin

## 🔍 验证部署

### 1. 检查应用状态

```bash
ssh root@47.101.144.238 'pm2 status'
```

应该看到 `sclspulse` 应用状态为 `online`。

### 2. 检查网站访问

```bash
curl -I http://47.101.144.238/sclspulse
```

应该返回 `200 OK` 状态。

### 3. 检查 API 接口

```bash
curl http://47.101.144.238/sclspulse/api/health
```

## 🛠️ 常用维护命令

```bash
# 查看应用状态
ssh root@47.101.144.238 'pm2 status'

# 重启应用
ssh root@47.101.144.238 'pm2 restart sclspulse'

# 查看应用日志
ssh root@47.101.144.238 'pm2 logs sclspulse --lines 50'

# 查看实时日志
ssh root@47.101.144.238 'pm2 logs sclspulse -f'

# 重新部署
npm run deploy:subpath
```

## 🔒 安全考虑

1. **环境变量安全**: 确保 `.env.production` 文件权限正确
2. **数据库安全**: 使用强密码和 RLS 策略
3. **API 安全**: 配置正确的 CORS 和认证
4. **防火墙**: 确保只开放必要端口

## 🚨 常见问题

### Q: 静态资源加载失败
**A**: 检查 `NEXT_PUBLIC_BASE_PATH` 环境变量是否正确设置为 `/sclspulse`

### Q: API 请求 404
**A**: 确认 Nginx 配置中的 API 路由重写规则正确

### Q: 页面样式错乱
**A**: 清除浏览器缓存，检查 CSS 文件路径是否正确

### Q: 登录后跳转错误
**A**: 检查 `NEXTAUTH_URL` 是否设置为完整的子路径 URL

## 📞 技术支持

如遇到问题，请检查：

1. PM2 进程状态：`pm2 status`
2. 应用日志：`pm2 logs sclspulse`
3. Nginx 错误日志：`tail -f /var/log/nginx/error.log`
4. 系统资源：`htop` 或 `free -h`

## 🔄 更新部署

当需要更新网站时，只需重新运行部署命令：

```bash
npm run deploy:subpath
```

系统会自动：
- 构建新版本
- 备份当前版本
- 部署新版本
- 重启应用

## 🌟 优势

✅ **多网站共存**: 不影响服务器上的其他网站  
✅ **独立进程**: 使用独立的 PM2 进程和端口  
✅ **自动化部署**: 一键部署，自动配置  
✅ **易于维护**: 完整的日志和监控  
✅ **安全隔离**: 独立的应用目录和配置