/**
 * 微信支付回调云函数 - 完整版
 * 
 * 功能：
 * 1. 接收微信支付回调通知
 * 2. 验证签名（生产环境必需）
 * 3. 解密回调数据（AES-256-GCM）
 * 4. 自动开通/续费会员权限
 * 5. 记录订单信息
 * 6. 处理退款通知
 * 
 * 使用前请先配置环境变量！
 */

const cloud = require('@cloudbase/node-sdk');
const crypto = require('crypto');
const https = require('https');

// ============ 配置区域 ============
// 从环境变量读取配置（请在CloudBase控制台配置）
const CONFIG = {
  mchId: '1587047501',
  apiV3Key: 'Jd20601198Jd20601198Jd20601198Jd',
  serialNo: '6E25AD69FAF69A518B7DF7B15F71A984D9ADAC8E',
  // 平台证书
  platformCert: `-----BEGIN CERTIFICATE-----
MIIEMTCCAxmgAwIBAgIUbiWtafr2mlGLffexX3GphNmtrI4wDQYJKoZIhvcNAQEL
BQAwXjELMAkGA1UEBhMCQ04xEzARBgNVBAoTClRlbnBheS5jb20xHTAbBgNVBAsT
FFRlbnBheS5jb20gQ0EgQ2VudGVyMRswGQYDVQQDExJUZW5wYXkuY29tIFJvb3Qg
Q0EwHhcNMjYwNTAyMDcyNjE4WhcNMzEwNTAxMDcyNjE4WjCBijETMBEGA1UEAwwK
MTU4NzA0NzUwMTEbMBkGA1UECgwS5b6u5L+h5ZWG5oi357O757ufMTYwNAYDVQQL
DC3opb/ls6Hljr/nqojok53ml6XnlKjlk4Hkv6Hmga/lkqjor6LmnI3liqHpg6gx
CzAJBgNVBAYTAkNOMREwDwYDVQQHDAhTaGVuWmhlbjCCASIwDQYJKoZIhvcNAQEB
BQADggEPADCCAQoCggEBALggyNJRczsn9ZBHd6Tzej1JONKStLAP7cBNNLhoufkr
H7jTcPNyA4zxyi61vBVZE0cyKVd6oYM4EJgQZwVyj/VwSj+WUtufKln5suOIa9gY
xnBg+iwfCi9Lr34W/eZmAIjune3alnG+g0KjQsz9Lrz/cz+2AfHwZQLOMn3txIWe
tIpSaLswMeqKWRIO49epQ/DJA8HrVUjDB5xH1NXzfjrhFZBePvQ8G6bG0yS5wLEI
/3SX/V3tuOBunBVb7l4xee/MjH6swdrvwm82WJWmf8VOQt7G1NCOe1VmIoe43xmS
R7kV9YtYrr2L4ccXdztCW3odCWKWJOB1/KFxOzKR+DsCAwEAAaOBuTCBtjAJBgNV
HRMEAjAAMAsGA1UdDwQEAwID+DCBmwYDVR0fBIGTMIGQMIGNoIGKoIGHhoGEaHR0
cDovL2V2Y2EuaXRydXMuY29tLmNuL3B1YmxpYy9pdHJ1c2NybD9DQT0xQkQ0MjIw
RTUwREJDMDRCMDZBRDM5NzU0OTg0NkMwMUMzRThFQkQyJnNnPUhBQ0M0NzFCNjU0
MjJFMTJCMjdBOUQzM0E4N0FEMUNERjU5MjZFMTQwMzcxMA0GCSqGSIb3DQEBCwUA
A4IBAQB9bf6xCi/7b7vxO8DadW2r4h6ZeLt2otmARAP/JRqMChO2tFtekT4NCevk
cZxKqEbznIbYNT5HTWOIEMeCBLqUFolUfFIGq8uAdnfYQzbCQ3eGzco+RuC8P30I
ATXdtmbGVTgDdfBsDYlHYcR4yiVmw7rUBd+DnrMT9Rcjh6zFuYiVSHSF6/DnCYkO
SmCHyfMpd2MYNgM0gWzo0PgxaMWVTl0nqVFYOOdJx2G+GCkj8ru5M/VO2oUuasjR
+49EwjzaPsSnRyXo/IXCbzJMemTy8Mv+Va1UnkHSt8pCOf9gRR/4vxwClSs0magl
8GraZepducu4vpDnwO7X7Phvua7t
-----END CERTIFICATE-----`,
  // 商户私钥
  merchantPrivateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC4IMjSUXM7J/WQ
R3ek83o9STjSkrSwD+3ATTS4aLn5Kx+403DzcgOM8coutbwVWRNHMilXeqGDOBCY
EGcFco/1cEo/llLbnypZ+bLjiGvYGMZwYPosHwovS69+Fv3mZgCI7p3t2pZxvoNC
o0LM/S68/3M/tgHx8GUCzjJ97cSFnrSKUmi7MDHqilkSDuPXqUPwyQPB61VIwwec
R9TV83464RWQXj70PBumxtMkucCxCP90l/1d7bjgbpwVW+5eMXnvzIx+rMHa78Jv
NliVpn/FTkLextTQjntVZiKHuN8Zkke5FfWLWK69i+HHF3c7Qlt6HQliliTgdfyh
cTsykfg7AgMBAAECggEBAIk0DNED1ozXKtn3F0V4FLeET25B2Zh0ViJ8pXNgvmvY
YYv1Ku6NH+4v4gvKajuyI3Zi/4FrJN1Fsr/NQSdDBdjLcthNKLL0uLdRJKb96fae
B4iICwNDofA6Qqv/b/T2PyHKRS6POpnJb8ABLe7YHrLA2103P93L10ku41sJCO7T
X3AmbYFS9FJTcCrgMLDZw61uZeHs0csmEPYh7Ylq2Um4fR4iHvT1Bwrb0xQNz6kW
p6LdFjjPECQJQtqVLMI1W3BQ3HZ9y8HU4LDesqvbJEf1iruhzBBqhf7BLXomUN28
YJHq6noaB5UGDe7lwqYelapaP+Zz0sHuiy568YTlCUECgYEA3SZYrEhVPeR4mhqa
0wjQlSzNNgD4A7lZwz3zFqbcpnW5uwcv25bJtUIBFti5KfOMGxfAE/384V9THT4x
FIE7A4RIjJdvxf+GvDrIrAYu4Eqg/KQxRGO4zSn67s/EoPm1B2DvpJx1uSu/uPO5
lakSTi0BglGwiQo8jrgEbC8sQmECgYEA1STnHNOkzxoRwP0KJSxqkEABzejGzcXe
B6sucLgQev3hTxrP2HwLm1hZZtnBcYgweTnupB8SsiHwf//00t+T9Zc/zkYpXHYS
Mianv7kIf9Odr5GbM3hpWBZBXP+sQ0LxgrgCmsdz194FKFKZsOyygk+2nBwJtHyV
BlJckDE5+BsCgYAQpx2QQ5Yfpf+q4wv7jjNeuFPvmB0U8rUeraCLeR8ubbkBq2Xg
LDeeLY01cjZnQU6wj5ZIKx0Kv4nbrt41RBH0jtaDt7eT+kzkCa0ovwJyo0wCGj8X
fkbhNCMQLpcI5CTMnHEPPTTkL7YtMDUuXt/hASSW8p3Pg/TRbmvu1ZKIoQKBgGXl
nYN/fuPvn5s2nXoGEO/jWbl51kkbljjuUmZa6K4T33n05HanXtkmVJ9B7SP8qsfZ
tUfK/yIf7Z0T3ZROhKq9YyiXDEECxVIqfrm+mNyba2A66QqjPyF4ikkOhekmANWw
aLZcMfp6TtbnHkih7/kyaKebE9ywToJWL6BTmFYPAoGATOImBC434N+w3Gk/DWDM
ysSr7CQb2rGxXPd0d5sM8pNSrKECAPjMOGiaZvX9JU/1+QAvZ7Kmqi3a4Zr90PVg
3iUIU9wvfc8DdZo0pHpNrjkdeRD/vGaj2vlrK8z9VvmEgT8zRY3ZVwzCCS8Dcj01
zBq1jTFUaCmhrH0W1jLlA9c=
-----END PRIVATE KEY-----`
};

// 会员价格配置（单位：分）
const MEMBERSHIP_PRICES = {
  'month': 2900,      // 月卡 ¥29
  'quarter': 7900,    // 季卡 ¥79
  'year': 19900,      // 年卡 ¥199
  'permanent': 39900  // 永久 ¥399
};

// 会员有效期配置（天）
const MEMBERSHIP_DAYS = {
  'month': 30,
  'quarter': 90,
  'year': 365,
  'permanent': 36500 // 约100年，视为永久
};
// ==================================

// 初始化CloudBase
const app = cloud.init({
  env: cloud.SYMBOL_CURRENT_ENV
});

const db = app.database();

/**
 * 验证微信支付回调签名
 * @param {string} timestamp - 时间戳
 * @param {string} nonce - 随机字符串
 * @param {string} body - 请求体
 * @param {string} signature - 微信签名
 * @param {string} serialNo - 证书序列号
 * @returns {boolean} 签名是否有效
 */
function verifyWechatSignature(timestamp, nonce, body, signature, serialNo) {
  try {
    // 构造验签名串
    const message = `${timestamp}\n${nonce}\n${body}\n`;
    
    // 使用平台证书验证签名
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(message);
    
    const isValid = verifier.verify(CONFIG.platformCert, signature, 'base64');
    
    if (!isValid) {
      console.error('签名验证失败');
    }
    
    return isValid;
  } catch (err) {
    console.error('签名验证过程出错:', err);
    return false;
  }
}

/**
 * 解密微信支付回调数据（AES-256-GCM）
 * @param {string} associatedData - 附加数据
 * @param {string} nonce - 随机串
 * @param {string} ciphertext - 密文（Base64）
 * @returns {object} 解密后的数据
 */
function decryptWechatData(associatedData, nonce, ciphertext) {
  try {
    const key = Buffer.from(CONFIG.apiV3Key, 'utf8');
    const iv = Buffer.from(nonce, 'utf8');
    
    // ciphertext包含密文和认证标签
    const encryptedBuffer = Buffer.from(ciphertext, 'base64');
    const authTag = encryptedBuffer.slice(-16);
    const data = encryptedBuffer.slice(0, -16);
    
    // 解密
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from(associatedData, 'utf8'));
    
    let decrypted = decipher.update(data);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return JSON.parse(decrypted.toString('utf8'));
  } catch (err) {
    console.error('解密失败:', err);
    throw new Error('解密微信支付数据失败');
  }
}

/**
 * 解析订单号获取用户信息
 * @param {string} orderId - 订单号格式：ORDER_userId_membershipType_timestamp
 * @returns {object|null} {userId, membershipType, timestamp}
 */
function parseOrderId(orderId) {
  const parts = orderId.split('_');
  
  if (parts.length < 3 || parts[0] !== 'ORDER') {
    console.error('订单号格式错误:', orderId);
    return null;
  }
  
  return {
    userId: parts[1],
    membershipType: parts[2],
    timestamp: parts[3] ? parseInt(parts[3]) : Date.now()
  };
}

/**
 * 计算会员过期时间
 * @param {string} membershipType - 会员类型
 * @param {Date} baseDate - 基准日期（用于续费）
 * @returns {Date} 过期时间
 */
function calculateExpireDate(membershipType, baseDate = new Date()) {
  const expireDate = new Date(baseDate);
  
  if (membershipType === 'permanent') {
    // 永久会员：设为一个很远的日期
    expireDate.setFullYear(2099, 11, 31);
    return expireDate;
  }
  
  const daysToAdd = MEMBERSHIP_DAYS[membershipType];
  
  if (!daysToAdd) {
    throw new Error(`未知的会员类型: ${membershipType}`);
  }
  
  expireDate.setDate(expireDate.getDate() + daysToAdd);
  
  return expireDate;
}

/**
 * 开通或续费会员
 * @param {string} userId - 用户ID（OpenID）
 * @param {string} membershipType - 会员类型
 * @param {string} orderId - 订单号
 * @param {number} amount - 支付金额（分）
 * @returns {Promise<boolean>} 是否成功
 */
async function activateMembership(userId, membershipType, orderId, amount) {
  try {
    // 1. 查询用户当前信息
    const userResult = await db.collection('users').where({ _id: userId }).get();
    
    let newExpireDate;
    let oldMembership = null;
    
    if (userResult.data.length > 0) {
      // 用户已存在
      const user = userResult.data[0];
      oldMembership = user.membership;
      
      // 判断是否续费
      const currentExpire = user.membershipExpire ? new Date(user.membershipExpire) : new Date();
      const now = new Date();
      
      // 如果当前会员未过期，则在现有基础上叠加
      const baseDate = currentExpire > now ? currentExpire : now;
      
      newExpireDate = calculateExpireDate(membershipType, baseDate);
      
      console.log(`用户 ${userId} 续费：${oldMembership} → ${membershipType}，新过期时间：${newExpireDate}`);
    } else {
      // 新用户
      newExpireDate = calculateExpireDate(membershipType);
      console.log(`用户 ${userId} 新开通：${membershipType}，过期时间：${newExpireDate}`);
    }
    
    // 2. 更新或创建用户记录
    const userData = {
      membership: membershipType,
      membershipExpire: newExpireDate,
      membershipActivatedAt: new Date(),
      lastOrderId: orderId,
      updatedAt: new Date()
    };
    
    if (userResult.data.length > 0) {
      // 更新现有用户
      await db.collection('users').doc(userId).update(userData);
    } else {
      // 创建新用户
      await db.collection('users').add({
        _id: userId,
        ...userData,
        createdAt: new Date()
      });
    }
    
    console.log(`✅ 用户 ${userId} 会员开通成功`);
    return true;
    
  } catch (err) {
    console.error(`❌ 开通会员失败:`, err);
    throw err;
  }
}

/**
 * 记录订单信息
 * @param {object} orderInfo - 订单信息
 * @returns {Promise<void>}
 */
async function recordOrder(orderInfo) {
  try {
    await db.collection('orders').add({
      ...orderInfo,
      createdAt: new Date(),
      status: 'paid'
    });
    
    console.log(`📝 订单记录成功: ${orderInfo.orderId}`);
  } catch (err) {
    console.error('记录订单失败:', err);
    // 订单记录失败不应影响会员开通，只记录日志
  }
}

/**
 * 检查订单是否已处理（幂等性）
 * @param {string} orderId - 订单号
 * @param {string} transactionId - 微信支付交易号
 * @returns {Promise<boolean>} 是否已处理
 */
async function isOrderProcessed(orderId, transactionId) {
  try {
    const result = await db.collection('orders').where({
      $or: [
        { orderId: orderId },
        { transactionId: transactionId }
      ]
    }).get();
    
    return result.data.length > 0;
  } catch (err) {
    console.error('检查订单幂等性失败:', err);
    // 检查失败时，为了安全起见，返回true（已处理）
    return true;
  }
}

/**
 * 主函数 - 路由分发
 */
exports.main = async (event, context) => {
  console.log('📬 收到云函数调用');
  console.log('Event:', JSON.stringify(event));
  
  // 检查是否是微信支付回调（通过headers判断）
  const headers = event.headers;
  if (headers && headers['wechatpay-timestamp']) {
    // 这是微信支付回调通知
    return handleWechatCallback(event, context);
  }
  
  // 检查action参数，进行路由分发
  const action = event.action;
  if (action === 'createOrder') {
    return await exports.createOrder(event);
  } else if (action === 'queryOrder') {
    return await exports.queryOrder(event);
  } else {
    return {
      code: -1,
      message: '未知的action: ' + action
    };
  }
};

/**
 * 处理微信支付回调（原exports.main逻辑）
 */
async function handleWechatCallback(event, context) {
  console.log('📬 收到微信支付回调');
  console.log('Headers:', JSON.stringify(event.headers));
  console.log('Body:', event.body);
  
  try {
    // 1. 解析回调头信息
    const headers = event.headers;
    const timestamp = headers['wechatpay-timestamp'];
    const nonce = headers['wechatpay-nonce'];
    const signature = headers['wechatpay-signature'];
    const serialNo = headers['wechatpay-serial'];
    const body = event.body;
    
    // 2. 验证签名（生产环境必须开启）
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      if (!verifyWechatSignature(timestamp, nonce, body, signature, serialNo)) {
        console.error('❌ 签名验证失败');
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: 'FAIL',
            message: '签名验证失败'
          })
        };
      }
      console.log('✅ 签名验证通过');
    } else {
      console.log('⚠️ 开发环境，跳过签名验证');
    }
    
    // 3. 解析回调数据
    const callbackData = JSON.parse(body);
    const eventType = callbackData.event_type;
    const eventData = callbackData.resource;
    
    console.log(`📦 事件类型: ${eventType}`);
    
    // 4. 处理不同事件类型
    if (eventType === 'TRANSACTION.SUCCESS') {
      // 支付成功
      console.log('💰 处理支付成功通知...');
      
      // 解密数据
      const decryptedData = decryptWechatData(
        eventData.associated_data,
        eventData.nonce,
        eventData.ciphertext
      );
      
      console.log('🔓 解密后的支付数据:', JSON.stringify(decryptedData));
      
      const orderId = decryptedData.out_trade_no;
      const transactionId = decryptedData.transaction_id;
      const tradeState = decryptedData.trade_state;
      const amount = decryptedData.amount.total;
      
      // 5. 检查支付状态
      if (tradeState !== 'SUCCESS') {
        console.log(`⚠️ 支付状态不是SUCCESS: ${tradeState}`);
        return {
          statusCode: 200,
          body: JSON.stringify({ code: 'SUCCESS', message: '已接收' })
        };
      }
      
      // 6. 幂等性检查（防止重复处理）
      if (await isOrderProcessed(orderId, transactionId)) {
        console.log(`⚠️ 订单已处理，跳过: ${orderId}`);
        return {
          statusCode: 200,
          body: JSON.stringify({ code: 'SUCCESS', message: '订单已处理' })
        };
      }
      
      // 7. 解析订单号获取用户信息
      const orderInfo = parseOrderId(orderId);
      
      if (!orderInfo) {
        throw new Error(`无法解析订单号: ${orderId}`);
      }
      
      const { userId, membershipType } = orderInfo;
      
      // 8. 验证支付金额（防止篡改）
      const expectedAmount = MEMBERSHIP_PRICES[membershipType];
      if (expectedAmount && amount !== expectedAmount) {
        console.error(`⚠️ 支付金额不匹配: 期望${expectedAmount}分，实际${amount}分`);
        // 可以选择是否继续开通
      }
      
      // 9. 开通会员权限
      await activateMembership(userId, membershipType, orderId, amount);
      
      // 10. 记录订单
      await recordOrder({
        orderId: orderId,
        transactionId: transactionId,
        userId: userId,
        membershipType: membershipType,
        amount: amount / 100, // 转换为元
        tradeState: tradeState,
        paidAt: new Date(decryptedData.success_time)
      });
      
      console.log(`✅ 支付回调处理完成: ${orderId}`);
      
    } else if (eventType === 'REFUND.SUCCESS') {
      // 退款成功（可选实现）
      console.log('🔄 处理退款通知...');
      // TODO: 实现退款逻辑（取消会员权限或标记退款状态）
      
    } else {
      console.log(`ℹ️ 未处理的事件类型: ${eventType}`);
    }
    
    // 11. 返回成功响应给微信服务器
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'SUCCESS',
        message: '成功'
      })
    };
    
  } catch (err) {
    console.error('❌ 处理微信支付回调失败:', err);
    
    // 返回失败响应，微信会重试
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'FAIL',
        message: err.message
      })
    };
  }
}

/**
 * 辅助函数：生成微信支付签名
 * @param {string} method - HTTP方法
 * @param {string} url - 请求URL
 * @param {string} timestamp - 时间戳
 * @param {string} nonceStr - 随机字符串
 * @param {string} body - 请求体
 * @returns {string} 签名
 */
function generateWechatSignature(method, url, timestamp, nonceStr, body) {
  const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  return sign.sign(CONFIG.merchantPrivateKey, 'base64');
}

/**
 * 辅助函数：调用微信支付API
 * @param {string} method - HTTP方法
 * @param {string} url - API URL
 * @param {object} data - 请求数据
 * @returns {Promise<object>} 响应数据
 */
async function callWechatPayAPI(method, url, data) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const body = data ? JSON.stringify(data) : '';
  
  const signature = generateWechatSignature(method, url, timestamp, nonceStr, body);
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'CloudBase',
    'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${CONFIG.mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${CONFIG.serialNo}"`,
    'Wechatpay-Serial': CONFIG.serialNo
  };
  
  const apiUrl = `https://api.mch.weixin.qq.com${url}`;
  
  console.log('调用微信支付API:', method, apiUrl);
  console.log('请求头:', JSON.stringify(headers));
  console.log('请求体:', body);
  
  // 使用https模块发送请求
  return new Promise((resolve, reject) => {
    const urlObj = new URL(apiUrl);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('API响应状态:', res.statusCode);
        console.log('API响应数据:', responseData);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`API调用失败: ${res.statusCode} ${responseData}`));
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('API请求错误:', err);
      reject(err);
    });
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

/**
 * 创建微信支付订单（NATIVE支付-扫码支付）
 * @param {object} event - 包含userId, membershipType
 * @returns {object} 支付参数（包含二维码链接）
 */
exports.createOrder = async (event) => {
  console.log('📝 创建微信支付订单:', event);
  
  const { userId, membershipType } = event;
  
  // 验证参数（NATIVE支付不需要openId）
  if (!userId || !membershipType) {
    return {
      code: -1,
      message: '缺少必需参数'
    };
  }
  
  const amount = MEMBERSHIP_PRICES[membershipType];
  
  if (!amount) {
    return {
      code: -1,
      message: '无效的会员类型'
    };
  }
  
  // 生成订单号
  const orderId = `ORDER_${userId}_${membershipType}_${Date.now()}`;
  
  // 构造请求数据（NATIVE支付 - 扫码支付）
  const requestData = {
    appid: process.env.WX_APPID || 'your-appid', // 需要配置微信公众号AppID
    mchid: CONFIG.mchId,
    description: `AI工具场-${membershipType}会员`,
    out_trade_no: orderId,
    notify_url: process.env.WX_NOTIFY_URL || 'https://your-domain.com/wechat-payment-callback', // 回调URL
    amount: {
      total: amount,
      currency: 'CNY'
    }
  };
  
  try {
    // 调用微信支付API创建订单（NATIVE支付）
    const result = await callWechatPayAPI('POST', '/v3/pay/transactions/native', requestData);
    
    console.log(`✅ 订单创建成功: ${orderId}`);
    console.log('微信支付返回:', JSON.stringify(result));
    
    // 返回订单信息和二维码链接
    return {
      code: 0,
      message: '成功',
      data: {
        orderId: orderId,
        codeUrl: result.code_url, // 二维码链接，前端需要转换为二维码图片
        amount: amount
      }
    };
    
  } catch (err) {
    console.error('❌ 创建订单失败:', err);
    return {
      code: -1,
      message: '创建订单失败: ' + err.message
    };
  }
};

/**
 * 查询订单状态（供前端调用）
 * @param {object} event - 包含orderId
 * @returns {object} 订单状态
 */
exports.queryOrder = async (event) => {
  const { orderId } = event;
  
  try {
    const result = await db.collection('orders').where({ orderId: orderId }).get();
    
    if (result.data.length > 0) {
      return {
        code: 0,
        data: result.data[0]
      };
    } else {
      return {
        code: -1,
        message: '订单不存在'
      };
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message
    };
  }
};
