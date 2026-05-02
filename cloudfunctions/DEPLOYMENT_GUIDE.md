# 微信支付集成部署指南

## 📋 前期准备

### 必需的信息和账号

1. **微信支付商户号**
   - 在 https://pay.weixin.qq.com 注册
   - 需要企业资质或个体工商户
   - 获取：商户号 (mch_id)

2. **CloudBase 账号**
   - 在 https://cloud.tencent.com/product/tcb 开通
   - 创建环境，获取环境ID

3. **API密钥和证书**
   - 登录微信支付商户平台
   - 【账户中心】→【API安全】
   - 设置APIv3密钥
   - 申请API证书，下载证书和私钥

---

## 🚀 部署步骤

### 第一步：创建CloudBase环境

1. 登录腾讯云控制台
2. 进入【云开发 CloudBase】
3. 创建新环境（选择按量计费）
4. 记录环境ID（格式：`env-xxx`）

### 第二步：配置数据库

在CloudBase控制台中，创建以下数据库集合：

#### 1. users 集合
用于存储用户信息，手动创建索引：
- `_id` (自动索引)
- `membership` (普通索引)
- `membershipExpire` (普通索引)

#### 2. orders 集合
用于存储订单信息，手动创建索引：
- `orderId` (唯一索引)
- `transactionId` (普通索引)
- `userId` (普通索引)
- `createdAt` (普通索引)

### 第三步：部署云函数

#### 方法A：使用CloudBase CLI（推荐）

1. **安装CLI**
```bash
npm install -g @cloudbase/cli
```

2. **登录**
```bash
tcb login
```

3. **初始化项目**（如果还没有）
```bash
cd AI工具场
tcb init
```

4. **部署云函数**
```bash
tcb fn deploy wechat-payment-callback --envId 你的环境ID
```

5. **配置环境变量**

在CloudBase控制台 →【云函数】→【wechat-payment-callback】→【环境变量】

添加以下变量：
```
WECHAT_MCHID=你的商户号
WECHAT_API_V3_KEY=你的APIv3密钥
WECHAT_SERIAL_NO=你的证书序列号
WECHAT_PLATFORM_CERT=你的平台证书内容（包括-----BEGIN CERTIFICATE-----）
WECHAT_MERCHANT_KEY=你的商户私钥内容（包括-----BEGIN PRIVATE KEY-----）
NODE_ENV=production
```

6. **获取云函数URL**

在【云函数】→【wechat-payment-callback】→【触发管理】
- 开启HTTP触发
- 记录触发URL，格式类似：
  `https://你的环境ID.ap-shanghai.app.tcloudbase.com/wechat-payment-callback`

#### 方法B：手动上传（简单）

1. 打包云函数目录：
```bash
cd cloudfunctions/wechat-payment-callback
npm install
# 创建zip包
```

2. 在CloudBase控制台手动上传

### 第四步：配置微信支付回调URL

1. 登录微信支付商户平台
2. 【产品中心】→【开发配置】
3. 设置【支付通知URL】为：
   ```
   https://你的环境ID.ap-shanghai.app.tcloudbase.com/wechat-payment-callback
   ```
4. 保存并等待生效（约5分钟）

### 第五步：修改前端页面

#### 1. 更新 activate.html（激活码页面）

添加微信支付JSAPI调用：

```javascript
// 微信支付函数
async function wechatPay(userId, membershipType) {
  // 1. 获取用户OpenID（需要后端接口）
  const openId = await getUserOpenId(userId);
  
  // 2. 调用云函数创建订单
  const result = await cloud.callFunction({
    name: 'wechat-payment-callback',
    data: {
      type: 'createOrder',
      userId: userId,
      membershipType: membershipType,
      openId: openId
    }
  });
  
  if (result.result.code !== 0) {
    alert('创建订单失败：' + result.result.message);
    return;
  }
  
  const payParams = result.result.data;
  
  // 3. 调用微信支付
  WeixinJSBridge.invoke(
    'getBrandWCPayRequest', {
      appId: payParams.appId,
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType,
      paySign: payParams.paySign
    },
    function(res) {
      if (res.err_msg === "get_brand_wcpay_request:ok") {
        // 支付成功
        alert('支付成功！会员已开通');
        checkMembershipStatus(userId);
      } else {
        // 支付失败
        alert('支付失败：' + res.err_msg);
      }
    }
  );
}
```

#### 2. 更新 user.html（用户中心）

添加会员状态显示和续费入口：

```html
<!-- 会员信息卡片 -->
<div id="membershipCard" class="membership-card" style="display:none;">
  <h3>我的会员</h3>
  <p>会员类型：<span id="membershipType"></span></p>
  <p>过期时间：<span id="membershipExpire"></span></p>
  <button onclick="showRenewDialog()">续费</button>
</div>

<script>
// 检查会员状态
async function checkMembershipStatus(userId) {
  const result = await db.collection('users').doc(userId).get();
  
  if (result.data.length > 0) {
    const user = result.data[0];
    if (user.membership && user.membershipExpire) {
      const expireDate = new Date(user.membershipExpire);
      if (expireDate > new Date()) {
        // 会员有效
        document.getElementById('membershipCard').style.display = 'block';
        document.getElementById('membershipType').textContent = getMembershipName(user.membership);
        document.getElementById('membershipExpire').textContent = expireDate.toLocaleDateString();
      }
    }
  }
}
</script>
```

### 第六步：测试

#### 1. 沙箱测试（推荐）

1. 在微信支付商户平台开启沙箱模式
2. 使用沙箱API密钥和测试证书
3. 使用微信提供的测试账号扫码支付
4. 验证回调是否收到

#### 2. 生产环境测试

1. 先测试0.01元的订单
2. 使用真实微信账号扫码支付
3. 检查：
   - 微信支付后台是否收到支付通知
   - CloudBase云函数日志是否有记录
   - 数据库users集合是否更新了会员信息
   - 数据库orders集合是否有订单记录

---

## 🔧 故障排查

### 问题1：回调未收到

**可能原因**：
- 回调URL配置错误
- 云函数未部署或URL无法访问
- 微信支付商户号与云函数配置不匹配

**解决方法**：
1. 在浏览器访问回调URL，看是否返回错误
2. 检查CloudBase云函数日志
3. 在微信支付商户平台【支付通知】查看通知记录

### 问题2：签名验证失败

**可能原因**：
- APIv3密钥错误
- 平台证书内容错误
- 签名串构造错误

**解决方法**：
1. 确认APIv3密钥正确（在微信支付商户平台查看）
2. 确认平台证书是最新的（可能需要重新下载）
3. 开启云函数日志，查看具体的签名验证过程

### 问题3：会员未开通

**可能原因**：
- 数据库连接失败
- 订单号格式错误
- 会员类型不匹配

**解决方法**：
1. 检查CloudBase数据库是否正常运行
2. 查看云函数日志，看是否有异常
3. 手动检查数据库users集合，看是否有更新

### 问题4：前端无法调起支付

**可能原因**：
- 微信JS-SDK未正确引入
- 当前不在微信浏览器环境中
- 订单参数错误

**解决方法**：
1. 确认在微信浏览器中打开页面
2. 检查浏览器控制台是否有错误
3. 验证订单参数是否正确

---

## 📊 监控和日志

### 查看云函数日志

1. 登录CloudBase控制台
2. 【云函数】→【wechat-payment-callback】
3. 【日志】查看调用记录

### 关键日志点

在云函数中，我已经添加了详细的日志：
- `📬 收到微信支付回调` - 回调入口
- `✅ 签名验证通过` - 签名验证
- `🔓 解密后的支付数据` - 数据解密
- `💰 处理支付成功通知` - 支付处理
- `✅ 用户 xxx 会员开通成功` - 会员开通
- `📝 订单记录成功` - 订单记录

### 设置告警

在CloudBase控制台可以设置云函数告警：
- 调用次数异常
- 错误率过高
- 响应时间过长

---

## 🔐 安全建议

1. **环境变量加密**
   - 敏感信息（密钥、证书）使用CloudBase的密钥管理功能
   - 不要直接写在代码中

2. **HTTPS强制**
   - 确保回调URL使用HTTPS
   - CloudBase默认提供HTTPS

3. **签名验证**
   - 生产环境必须开启签名验证
   - 定期更新平台证书

4. **幂等性处理**
   - 云函数已处理幂等性（检查订单是否已处理）
   - 前端也应做好防重复提交

5. **日志记录**
   - 详细记录支付流程
   - 但不要记录敏感信息（如完整证书、私钥）

---

## 📞 技术支持

如果遇到问题，可以：
1. 查看CloudBase文档：https://docs.cloudbase.net/
2. 查看微信支付文档：https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml
3. 联系CloudBase技术支持
4. 联系微信支付技术支持

---

## ✅ 部署检查清单

- [ ] CloudBase环境已创建
- [ ] 数据库集合已创建（users、orders）
- [ ] 云函数已部署
- [ ] 环境变量已配置
- [ ] 微信支付回调URL已配置
- [ ] 前端页面已更新
- [ ] 沙箱测试通过
- [ ] 生产环境测试通过（小额）
- [ ] 监控告警已配置

---

**祝你部署顺利！** 🎉

如有问题，请查看云函数日志获取详细错误信息。
