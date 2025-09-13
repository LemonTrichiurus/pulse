# 🚀 快速开始（无域名版本）

## 📋 当前情况

域名 `www.sclspulse.cn` 还未注册，但您可以先使用IP地址部署网站进行测试。

## ⚡ 3分钟快速部署

### 1. 服务器环境初始化

```bash
# 初始化服务器环境（只需执行一次）
npm run server:setup
```

### 2. IP模式部署

```bash
# 使用IP地址部署网站
npm run deploy:ip
```

### 3. 配置环境变量

部署完成后，需要配置Supabase等环境变量：

```bash
# 连接到服务器
ssh root@47.101.144.238

# 进入应用目录
cd /var/www/sclspulse

# 编辑环境变量
nano .env.production
```

填入您的实际配置：
```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth配置
NEXTAUTH_SECRET=your_random_secret_32_chars
NEXTAUTH_URL=http://47.101.144.238

# 其他配置保持不变
```

### 4. 重启应用

```bash
# 重启应用使配置生效
pm2 restart sclspulse

# 查看应用状态
pm2 status
```

## 🌐 访问网站

部署完成后，您可以通过以下地址访问：

- **主要地址**: http://47.101.144.238
- **管理后台**: http://47.101.144.238/admin
- **API接口**: http://47.101.144.238/api

## 🔍 验证部署

```bash
# 检查部署状态
npm run deploy:check 47.101.144.238 47.101.144.238
```

## 📋 域名注册建议

### 推荐域名注册商

1. **阿里云（万网）** - https://wanwang.aliyun.com/
   - 价格：约29-55元/年（.cn域名）
   - 优势：国内访问快，客服支持好

2. **腾讯云** - https://dnspod.cloud.tencent.com/
   - 价格：约29-45元/年（.cn域名）
   - 优势：DNS解析快，集成度高

### 域名选择建议

- `sclspulse.cn` - 推荐，简洁易记
- `sclspulse.com` - 国际通用，但价格稍高
- `sclspulse.com.cn` - 国内企业常用

## 🔄 域名注册后的迁移

域名注册并解析生效后，执行以下步骤：

### 1. 配置DNS解析

在域名管理面板添加：
```
A记录: @ -> 47.101.144.238
A记录: www -> 47.101.144.238
```

### 2. 更新配置并重新部署

```bash
# 使用域名重新部署
./deploy.sh 47.101.144.238 www.sclspulse.cn
```

### 3. 申请SSL证书

```bash
ssh root@47.101.144.238
sudo certbot --nginx -d www.sclspulse.cn -d sclspulse.cn
```

## 🚨 常见问题

### Q: 网站无法访问
A: 检查以下项目：
- 服务器防火墙是否开放80端口
- PM2应用是否正常运行：`pm2 status`
- Nginx是否正常：`sudo systemctl status nginx`

### Q: 页面显示错误
A: 检查环境变量配置：
- Supabase URL和密钥是否正确
- NextAuth配置是否完整
- 查看应用日志：`pm2 logs sclspulse`

### Q: 如何更新网站内容
A: 重新部署即可：
```bash
npm run deploy:ip
```

## 📞 技术支持

如果遇到问题：

1. 查看部署日志和错误信息
2. 运行检查脚本：`npm run deploy:check`
3. 查看详细文档：`DOMAIN-REGISTRATION-GUIDE.md`

## 🎯 下一步计划

- [ ] 注册域名（建议今天完成）
- [ ] 配置DNS解析（域名注册后）
- [ ] 申请SSL证书（DNS生效后）
- [ ] 完善网站内容
- [ ] 配置网站备案（如需要）

---

**🎉 恭喜！您的学校新闻网站已经可以通过IP地址访问了！**

现在可以开始添加新闻内容，测试各项功能。域名注册完成后，再进行域名绑定即可。