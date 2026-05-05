'use strict';

const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

/**
 * 支付宝云函数 alipay-pay
 *
 * 环境变量（在腾讯云开发控制台 -> 云函数 -> 环境变量中配置）：
 *   ALIPAY_APP_ID       - 支付宝 AppId
 *   ALIPAY_PRIVATE_KEY  - 应用私钥（RSA2，PKCS8格式，不含头尾标记）
 *   ALIPAY_PUBLIC_KEY   - 支付宝公钥（不含头尾标记）
 *   ALIPAY_NOTIFY_URL   - 异步回调地址（可选）
 *
 * 请求体：
 *   { out_trade_no, total_fee, subject, body, channel }  -> 创建订单，返回 qr_code
 *   { action:'query', out_trade_no }                     -> 查询订单状态
 */
exports.main_handler = async (event) => {
    let params;
    try {
        params = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    } catch (e) {
        params = event;
    }

    if (params.action === 'query') {
        return await queryOrder(params);
    }
    return await createOrder(params);
};

// ─── 创建当面付预授权二维码 ──────────────────────────────────────
async function createOrder({ out_trade_no, total_fee, subject, body }) {
    const appId = process.env.ALIPAY_APP_ID;
    const privateKey = process.env.ALIPAY_PRIVATE_KEY;

    if (!appId || !privateKey) {
        return { code: 1, msg: '支付宝配置缺失，请联系管理员' };
    }

    const bizContent = {
        out_trade_no: String(out_trade_no),
        total_amount: String(total_fee),
        subject: String(subject),
        body: String(body || subject),
        product_code: 'FACE_TO_FACE_PAYMENT',
        store_id: 'aitoolchang001',
        timeout_express: '30m'
    };

    try {
        const result = await alipayRequest({
            appId,
            method: 'alipay.trade.precreate',
            bizContent,
            privateKey
        });

        if (result.code === '10000') {
            return { code: 0, orderId: out_trade_no, qr_code: result.qr_code };
        }
        return { code: 1, msg: result.sub_msg || result.msg };
    } catch (err) {
        return { code: 1, msg: err.message };
    }
}

// ─── 查询订单状态 ────────────────────────────────────────────────
async function queryOrder({ out_trade_no }) {
    const appId = process.env.ALIPAY_APP_ID;
    const privateKey = process.env.ALIPAY_PRIVATE_KEY;

    if (!appId || !privateKey) {
        return { code: 1, msg: '支付宝配置缺失' };
    }

    try {
        const result = await alipayRequest({
            appId,
            method: 'alipay.trade.query',
            bizContent: { out_trade_no: String(out_trade_no) },
            privateKey
        });

        return {
            code: 0,
            trade_status: result.trade_status,
            trade_no: result.trade_no,
            buyer_logon_id: result.buyer_logon_id
        };
    } catch (err) {
        return { code: 1, msg: err.message };
    }
}

// ─── 支付宝统一请求函数 ─────────────────────────────────────────
function alipayRequest({ appId, method, bizContent, privateKey }) {
    return new Promise((resolve, reject) => {
        const timestamp = new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19);

        const params = {
            app_id: appId,
            method,
            charset: 'utf-8',
            sign_type: 'RSA2',
            timestamp,
            version: '1.0',
            biz_content: JSON.stringify(bizContent)
        };

        // 构造签名字符串
        const sortedKeys = Object.keys(params).sort();
        const signStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&');

        // RSA2 签名
        const sign = crypto
            .createSign('RSA-SHA256')
            .update(signStr, 'utf8')
            .sign(
                `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`,
                'base64'
            );

        params.sign = sign;

        const body = querystring.stringify(params);

        const options = {
            hostname: 'openapi.alipay.com',
            path: '/gateway.do',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let raw = '';
            res.on('data', chunk => (raw += chunk));
            res.on('end', () => {
                try {
                    const json = JSON.parse(raw);
                    // 取响应体（key 因接口不同而异）
                    const responseKey = method.replace(/\./g, '_') + '_response';
                    resolve(json[responseKey] || json);
                } catch (e) {
                    reject(new Error('支付宝响应解析失败: ' + raw));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}
