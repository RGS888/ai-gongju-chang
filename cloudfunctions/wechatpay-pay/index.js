'use strict';

const crypto = require('crypto');
const https = require('https');

/**
 * 微信支付云函数 wechatpay-pay
 *
 * 环境变量（在腾讯云开发控制台 -> 云函数 -> 环境变量中配置）：
 *   WECHAT_APPID    - 微信公众号/小程序 AppId
 *   WECHAT_MCH_ID   - 微信商户号
 *   WECHAT_API_KEY  - 微信支付 APIv2 密钥（32位）
 *   WECHAT_CERT_SN  - APIv3 证书序列号（如用 v3）
 *   WECHAT_NOTIFY_URL - 支付回调地址
 *
 * 请求体：
 *   { out_trade_no, total_fee, subject, body, channel }  -> 创建订单，返回 code_url（扫码链接）
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

// ─── 创建 Native 扫码支付 ────────────────────────────────────────
async function createOrder({ out_trade_no, total_fee, subject }) {
    const appid = process.env.WECHAT_APPID;
    const mchId = process.env.WECHAT_MCH_ID;
    const apiKey = process.env.WECHAT_API_KEY;
    const notifyUrl = process.env.WECHAT_NOTIFY_URL || 'https://aitoolchang.cn/pay/notify';

    if (!appid || !mchId || !apiKey) {
        return { code: 1, msg: '微信支付配置缺失，请联系管理员' };
    }

    const nonceStr = crypto.randomBytes(16).toString('hex');
    // 单位：分
    const totalFee = Math.round(parseFloat(total_fee) * 100);

    const params = {
        appid,
        mch_id: mchId,
        nonce_str: nonceStr,
        body: String(subject),
        out_trade_no: String(out_trade_no),
        total_fee: String(totalFee),
        spbill_create_ip: '127.0.0.1',
        notify_url: notifyUrl,
        trade_type: 'NATIVE'
    };

    params.sign = signWechat(params, apiKey);

    const xmlBody = objectToXml(params);

    try {
        const resultXml = await wxPost('/pay/unifiedorder', xmlBody);
        const result = xmlToObject(resultXml);

        if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
            return { code: 0, orderId: out_trade_no, code_url: result.code_url };
        }
        return { code: 1, msg: result.err_code_des || result.return_msg || '下单失败' };
    } catch (err) {
        return { code: 1, msg: err.message };
    }
}

// ─── 查询订单状态 ────────────────────────────────────────────────
async function queryOrder({ out_trade_no }) {
    const appid = process.env.WECHAT_APPID;
    const mchId = process.env.WECHAT_MCH_ID;
    const apiKey = process.env.WECHAT_API_KEY;

    if (!appid || !mchId || !apiKey) {
        return { code: 1, msg: '微信支付配置缺失' };
    }

    const nonceStr = crypto.randomBytes(16).toString('hex');
    const params = {
        appid,
        mch_id: mchId,
        out_trade_no: String(out_trade_no),
        nonce_str: nonceStr
    };
    params.sign = signWechat(params, apiKey);

    try {
        const resultXml = await wxPost('/pay/orderquery', objectToXml(params));
        const result = xmlToObject(resultXml);

        return {
            code: 0,
            trade_state: result.trade_state,
            transaction_id: result.transaction_id,
            cash_fee: result.cash_fee
        };
    } catch (err) {
        return { code: 1, msg: err.message };
    }
}

// ─── 工具函数 ────────────────────────────────────────────────────
function signWechat(params, key) {
    const sortedKeys = Object.keys(params).sort();
    const str = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + `&key=${key}`;
    return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
}

function objectToXml(obj) {
    const items = Object.entries(obj).map(([k, v]) => `<${k}><![CDATA[${v}]]></${k}>`);
    return `<xml>${items.join('')}</xml>`;
}

function xmlToObject(xml) {
    const result = {};
    const re = /<(\w+)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/\1>/g;
    let match;
    while ((match = re.exec(xml)) !== null) {
        result[match[1]] = match[2];
    }
    return result;
}

function wxPost(path, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.mch.weixin.qq.com',
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let raw = '';
            res.on('data', chunk => (raw += chunk));
            res.on('end', () => resolve(raw));
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}
