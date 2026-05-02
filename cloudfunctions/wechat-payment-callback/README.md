# 微信支付回调云函数

## 功能说明

本云函数用于处理微信支付的回调通知，实现：
1. 接收微信支付成功通知
2. 验证签名（生产环境必需）
3. 解密回调数据
4. 自动开通用户会员权限
5. 记录订单信息

## 配置步骤

### 1. 环境变量配置

在CloudBase云函数配置中设置以下环境变量：

```
WECHAT_MCHID=你的微信支付商户号
WECHAT_API_KEY=你的APIv3密钥
WECHAT_SERIAL_NO=你的商户证书序列号
WECHAT_PLATFORM_CERT=微信支付平台证书内容
```

### 2. 微信支付后台配置

1. 登录微信支付商户平台
2. 进入【产品中心】→【开发配置】
3. 设置支付回调URL：`https://你的云函数域名/wechat-payment-callback`
4. 上传API证书
5. 设置APIv3密钥

### 3. 数据库集合

需要创建以下数据库集合：

#### users 集合
存储用户信息，包含会员字段：
```json
{
  "_id": "用户OpenID",
  "membership": "month|quarter|year|permanent",
  "membershipExpire": "2026-12-31T23:59:59.999Z",
  "membershipActivatedAt": "2026-05-01T12:00:00.000Z",
  "lastOrderId": "ORDER_xxx"
}
```

#### orders 集合
存储订单信息：
```json
{
  "orderId": "ORDER_user123_month_1714521600000",
  "transactionId": "4200001234567890",
  "userId": "user123",
  "membershipType": "month",
  "amount": 29,
  "status": "paid",
  "paidAt": "2026-05-01T12:00:00.000Z",
  "createdAt": "2026-05-01T11:55:00.000Z"
}
```

## API接口

### 1. 微信支付回调接口

**路径**: `/wechat-payment-callback`  
**方法**: `POST`  
**说明**: 微信支付回调通知（由微信服务器调用）

### 2. 创建订单接口

**函数名**: `createOrder`  
**参数**:
```json
{
  "userId": "用户OpenID",
  "membershipType": "month|quarter|year|permanent",
  "userOpenId": "用户在微信下的OpenID"
}
```

**返回**:
```json
{
  "orderId": "ORDER_user123_month_1714521600000",
  "amount": 2900,
  "prepay_id": "..."
}
```

## 订单号格式

```
ORDER_{userId}_{membershipType}_{timestamp}
```

示例：`ORDER_anchen_month_1714521600000`

## 会员类型与价格

| 类型 | 标识 | 价格 | 有效期 |
|------|------|------|--------|
| 月卡 | month | ¥29 | 30天 |
| 季卡 | quarter | ¥79 | 90天 |
| 年卡 | year | ¥199 | 365天 |
| 永久 | permanent | ¥399 | 永久 |

## 测试流程

### 1. 本地测试
```bash
# 使用CloudBase CLI本地调试
tcb fn invoke wechat-payment-callback --local
```

### 2. 沙箱测试
1. 在微信支付商户平台开启沙箱模式
2. 使用沙箱API密钥
3. 使用微信支付提供的测试账号

### 3. 生产验证
1. 先测试1分钱订单
2. 检查回调日志
3. 验证会员权限开通
4. 检查订单记录

## 安全注意事项

1. **必须验证签名**：生产环境一定要验证微信支付回调签名
2. **使用HTTPS**：回调URL必须使用HTTPS
3. **幂等性处理**：同一订单可能多次回调，需要做好幂等处理
4. **日志记录**：详细记录支付流程，便于排查问题
5. **异常处理**：支付失败、签名失败等异常情况需要妥善处理

## 故障排查

### 回调未收到
- 检查微信支付后台的回调URL配置
- 确认云函数已部署且URL可访问
- 查看微信支付商户平台的【支付通知】记录

### 签名验证失败
- 确认APIv3密钥正确
- 检查签名串构造格式
- 验证平台证书是否正确

### 会员未开通
- 检查云函数日志
- 确认数据库连接正常
- 验证订单号解析逻辑

## 后续优化

1. 添加幂等性处理（防止重复开通）
2. 实现退款回调处理
3. 添加支付通知（邮件/短信）
4. 实现订单查询接口
5. 添加支付统计报表
