# 云函数部署说明

## 目录结构

```
cloudfunctions/
├── alipay-pay/
│   └── index.js    ← 支付宝当面付（Native扫码）
└── wechatpay-pay/
    └── index.js    ← 微信 Native 扫码支付
```

## 部署步骤

### 1. 开通腾讯云开发
- 进入 https://console.cloud.tencent.com/tcb
- 创建环境，记录**环境 ID**（格式：xxxxx-xxxxxxxx）

### 2. 部署云函数
每个云函数单独上传：
- 控制台 → 云函数 → 新建 → 本地上传 ZIP
- 函数名分别填：`alipay-pay` / `wechatpay-pay`
- 运行时选 **Node.js 12.16**

### 3. 配置环境变量

#### alipay-pay
| 变量名 | 说明 |
|--------|------|
| ALIPAY_APP_ID | 支付宝开放平台 AppId |
| ALIPAY_PRIVATE_KEY | 应用私钥（PKCS8，去掉头尾标记） |
| ALIPAY_PUBLIC_KEY | 支付宝公钥（去掉头尾标记） |
| ALIPAY_NOTIFY_URL | 支付回调地址（暂时可不填） |

#### wechatpay-pay
| 变量名 | 说明 |
|--------|------|
| WECHAT_APPID | 微信公众号 AppId |
| WECHAT_MCH_ID | 微信商户号 |
| WECHAT_API_KEY | 微信支付 APIv2 密钥（32位） |
| WECHAT_NOTIFY_URL | 支付回调地址（暂时可不填） |

### 4. 开启 HTTP 访问
每个云函数 → 配置 → 访问管理 → 开启 HTTP 触发器
复制触发器 URL，格式：`https://{envId}.api.tcloudbase.com/{funcName}.http`

### 5. 修改 activate.html CONFIG
```javascript
const CONFIG = {
    payMode: 'dual',
    cloudbaseEnvId: '你的环境ID',  // ← 替换这里
    cloudFunctions: {
        alipay: 'alipay-pay',
        wechatpay: 'wechatpay-pay'
    },
    // ...
};
```

## 注意事项
- 支付宝需在**沙箱环境**先测试，确认后切换正式 AppId
- 微信 Native 扫码需要**微信商户号**，个人用户可用**微信收款码**替代（保持 manual 模式）
- 当前 `cloudbaseEnvId = 'your-env-id'` 时系统会**自动降级**为手动收款码模式，不影响使用
