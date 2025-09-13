# 🌐 域名注册和配置指南

## 当前情况

您提到域名 `www.sclspulse.cn` 还没有注册下来，以下是完整的解决方案。

## 📋 域名注册步骤

### 1. 选择域名注册商

**推荐的国内域名注册商：**
- **阿里云（万网）** - https://wanwang.aliyun.com/
- **腾讯云** - https://dnspod.cloud.tencent.com/
- **华为云** - https://www.huaweicloud.com/product/domain.html
- **百度云** - https://cloud.baidu.com/product/bcd.html

**推荐的国外域名注册商：**
- **Namecheap** - https://www.namecheap.com/
- **GoDaddy** - https://www.godaddy.com/
- **Cloudflare** - https://www.cloudflare.com/products/registrar/

### 2. 域名注册流程

#### 阿里云注册步骤：
1. 访问 https://wanwang.aliyun.com/
2. 搜索域名 `sclspulse.cn`
3. 检查域名可用性
4. 选择注册年限（建议1-3年）
5. 填写域名信息和联系方式
6. 完成实名认证
7. 支付费用完成注册

#### 腾讯云注册步骤：
1. 访问 https://dnspod.cloud.tencent.com/
2. 搜索并选择域名
3. 加入购物车并结算
4. 完成实名认证
5. 等待审核通过

### 3. 域名费用参考

- `.cn` 域名：约 29-55元/年
- `.com` 域名：约 55-85元/年
- `.com.cn` 域名：约 29-45元/年

## 🔄 替代方案（域名注册期间）

### 方案一：使用IP地址直接访问

在域名注册完成前，可以直接使用IP地址访问：
- http://47.101.144.238:3000
- 或配置Nginx后：http://47.101.144.238

### 方案二：使用免费域名服务

**临时免费域名选项：**
- **Freenom** - 提供 .tk, .ml, .ga 等免费域名
- **No-IP** - 提供免费动态DNS服务
- **DuckDNS** - 免费动态DNS

### 方案三：使用子域名

如果您有其他已注册的域名，可以创建子域名：
- news.yourdomain.com
- school.yourdomain.com

## ⚙️ 临时配置修改

### 1. 修改Nginx配置

临时使用IP地址的Nginx配置：

```nginx
server {
    listen 80;
    server_name 47.101.144.238;
    
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

### 2. 修改环境变量

临时修改 `.env.production`：

```env
NEXTAUTH_URL=http://47.101.144.238
NEXT_PUBLIC_APP_URL=http://47.101.144.238
NEXT_PUBLIC_API_URL=http://47.101.144.238/api
```

### 3. 部署命令调整

使用IP地址部署：

```bash
# 修改部署脚本中的域名参数
./deploy.sh 47.101.144.238 47.101.144.238

# 或直接使用IP
npm run deploy
```

## 🎯 推荐行动计划

### 立即行动（今天）

1. **注册域名**
   ```bash
   # 访问阿里云或腾讯云
   # 搜索并注册 sclspulse.cn
   # 完成实名认证
   ```

2. **临时部署**
   ```bash
   # 使用IP地址先部署网站
   cd school-news-site
   
   # 修改环境变量为IP地址
   cp .env.production.example .env.production
   # 编辑 .env.production，将域名改为IP
   
   # 执行部署
   npm run deploy
   ```

### 域名注册后（1-3天）

1. **配置DNS解析**
   ```
   A记录: @ -> 47.101.144.238
   A记录: www -> 47.101.144.238
   ```

2. **更新配置**
   ```bash
   # 更新环境变量为域名
   # 重新部署
   # 申请SSL证书
   ```

## 📞 域名注册商客服

如果遇到问题，可以联系客服：

- **阿里云客服**：95187
- **腾讯云客服**：4009100100
- **华为云客服**：4000955988

## ⚠️ 注意事项

1. **实名认证**：国内域名需要实名认证，通常需要1-3个工作日
2. **备案要求**：如果服务器在国内，可能需要ICP备案
3. **DNS生效时间**：域名解析生效通常需要10分钟到24小时
4. **证书申请**：只有域名解析生效后才能申请SSL证书

## 🚀 快速启动（无域名版本）

如果您想立即开始，可以：

```bash
# 1. 修改部署脚本使用IP
sed -i 's/www.sclspulse.cn/47.101.144.238/g' deploy.sh
sed -i 's/sclspulse.cn/47.101.144.238/g' deploy.sh

# 2. 执行部署
npm run deploy

# 3. 访问网站
# http://47.101.144.238
```

域名注册完成后，再按照原配置进行域名绑定即可！