#!/bin/bash

# 部署状态检查脚本
# 使用方法: ./check-deployment.sh [domain] [server_ip]

set -e

DOMAIN=${1:-"www.sclspulse.cn"}
SERVER_IP=${2:-"47.101.144.238"}
APP_NAME="sclspulse"

echo "🔍 检查部署状态..."
echo "📡 域名: $DOMAIN"
echo "🖥️ 服务器: $SERVER_IP"
echo ""

# 1. 检查DNS解析
echo "🌐 检查DNS解析..."
if nslookup $DOMAIN | grep -q $SERVER_IP; then
    echo "✅ DNS解析正常: $DOMAIN -> $SERVER_IP"
else
    echo "❌ DNS解析异常，请检查域名配置"
    echo "💡 预期IP: $SERVER_IP"
    echo "🔍 当前解析:"
    nslookup $DOMAIN || true
fi
echo ""

# 2. 检查服务器连通性
echo "🏓 检查服务器连通性..."
if ping -c 3 $SERVER_IP > /dev/null 2>&1; then
    echo "✅ 服务器连通正常"
else
    echo "❌ 服务器连接失败，请检查网络或防火墙"
fi
echo ""

# 3. 检查HTTP访问
echo "🌍 检查HTTP访问..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ HTTP访问正常 (状态码: $HTTP_STATUS)"
elif [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo "⚠️ HTTP重定向 (状态码: $HTTP_STATUS) - 可能已配置HTTPS"
else
    echo "❌ HTTP访问异常 (状态码: $HTTP_STATUS)"
fi
echo ""

# 4. 检查HTTPS访问
echo "🔒 检查HTTPS访问..."
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN || echo "000")
if [ "$HTTPS_STATUS" = "200" ]; then
    echo "✅ HTTPS访问正常 (状态码: $HTTPS_STATUS)"
    
    # 检查SSL证书
    echo "🔐 检查SSL证书..."
    CERT_INFO=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "证书检查失败")
    if [ "$CERT_INFO" != "证书检查失败" ]; then
        echo "✅ SSL证书有效"
        echo "📅 证书信息: $CERT_INFO"
    else
        echo "⚠️ SSL证书检查失败"
    fi
else
    echo "❌ HTTPS访问异常 (状态码: $HTTPS_STATUS)"
    echo "💡 可能需要配置SSL证书"
fi
echo ""

# 5. 检查服务器状态（如果可以SSH连接）
echo "🖥️ 检查服务器应用状态..."
if ssh -o ConnectTimeout=5 -o BatchMode=yes root@$SERVER_IP "echo 'SSH连接成功'" 2>/dev/null; then
    echo "✅ SSH连接正常"
    
    echo "📊 应用进程状态:"
    ssh root@$SERVER_IP "pm2 status" 2>/dev/null || echo "❌ PM2状态检查失败"
    
    echo "🌐 Nginx状态:"
    ssh root@$SERVER_IP "sudo systemctl is-active nginx" 2>/dev/null || echo "❌ Nginx状态检查失败"
    
    echo "💾 磁盘使用情况:"
    ssh root@$SERVER_IP "df -h /" 2>/dev/null || echo "❌ 磁盘状态检查失败"
    
    echo "🧠 内存使用情况:"
    ssh root@$SERVER_IP "free -h" 2>/dev/null || echo "❌ 内存状态检查失败"
    
else
    echo "❌ SSH连接失败，无法检查服务器详细状态"
    echo "💡 请确保:"
    echo "   - SSH密钥已配置"
    echo "   - 服务器防火墙允许SSH连接"
    echo "   - 服务器SSH服务正常运行"
fi
echo ""

# 6. 性能测试
echo "⚡ 简单性能测试..."
if command -v curl > /dev/null; then
    echo "📈 响应时间测试:"
    for i in {1..3}; do
        RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://$DOMAIN 2>/dev/null || echo "超时")
        echo "   第${i}次: ${RESPONSE_TIME}秒"
    done
else
    echo "⚠️ curl命令不可用，跳过性能测试"
fi
echo ""

# 7. 生成报告
echo "📋 部署检查报告"
echo "=========================================="
echo "🕐 检查时间: $(date)"
echo "📡 域名: $DOMAIN"
echo "🖥️ 服务器IP: $SERVER_IP"
echo "🌐 HTTP状态: $HTTP_STATUS"
echo "🔒 HTTPS状态: $HTTPS_STATUS"
echo "=========================================="
echo ""

# 8. 提供建议
echo "💡 常见问题解决方案:"
echo ""
if [ "$HTTP_STATUS" != "200" ] && [ "$HTTPS_STATUS" != "200" ]; then
    echo "❌ 网站无法访问，请检查:"
    echo "   1. DNS解析是否正确指向服务器IP"
    echo "   2. 服务器防火墙是否开放80/443端口"
    echo "   3. Nginx是否正常运行: sudo systemctl status nginx"
    echo "   4. 应用是否正常运行: pm2 status"
fi

if [ "$HTTPS_STATUS" != "200" ] && [ "$HTTP_STATUS" = "200" ]; then
    echo "⚠️ HTTPS未配置，建议:"
    echo "   sudo certbot --nginx -d $DOMAIN -d ${DOMAIN#www.}"
fi

echo ""
echo "🔧 常用维护命令:"
echo "   查看应用日志: ssh root@$SERVER_IP 'pm2 logs $APP_NAME'"
echo "   重启应用: ssh root@$SERVER_IP 'pm2 restart $APP_NAME'"
echo "   查看Nginx日志: ssh root@$SERVER_IP 'sudo tail -f /var/log/nginx/error.log'"
echo "   重启Nginx: ssh root@$SERVER_IP 'sudo systemctl restart nginx'"
echo ""
echo "✅ 检查完成！"