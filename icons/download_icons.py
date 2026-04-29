#!/usr/bin/env python3
"""
AI工具场 - 官方图标批量下载工具
从各官网自动获取官方Logo图标
"""

import os
import urllib.request
import urllib.error
import ssl
import time

# 创建SSL上下文（忽略证书验证问题）
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# 工具名称和官网域名映射
TOOLS = {
    # AI写作
    "笔灵AI写作": ("ailingbi.com", "ailingbi"),
    "讯飞绘文": ("xfyun.cn", "xfyun"),
    "小鱼AI写作": ("ai.duckstudy.com", "xiaoyu"),
    "千笔AI论文": ("paperbird.cn", "qianbi"),

    # AI图像
    "Midjourney": ("midjourney.com", "midjourney"),
    "Stable Diffusion": ("stability.ai", "stability"),
    "LiblibAI": ("liblib.art", "liblib"),
    "可灵AI": ("klingai.com", "kling"),
    "通义万相": ("tongyi.aliyun.com", "tongyi"),
    "秒画": ("miaohua.senge.com", "miaohua"),
    "WHEE": ("whee.360.cn", "whee"),
    "Civitai": ("civitai.com", "civitai"),
    "吐司AI": ("toobigtoignore.com", "tusitu"),  # 备用

    # AI视频
    "Sora": ("openai.com/sora", "openai"),
    "即梦AI": ("jimeng.jianying.com", "jimeng"),
    "白日梦AI": ("aibrm.com", "bairimeng"),
    "HeyGen": ("heygen.com", "heygen"),
    "Vidu": ("vidu.studio", "vidu"),
    "腾讯混元AI视频": ("hunyuan.tencent.com", "hunyuan"),

    # AI办公
    "AiPPT": ("aippt.cn", "aippt"),
    "讯飞智文": ("zs.baidu.com", "xinghuo"),
    "Kimi PPT助手": ("kimi.moonshot.cn", "kimi"),
    "夸克PPT": ("quark.cn", "quark"),
    "ChartGen": ("chartgen.ai", "chartgen"),

    # AI对话
    "ChatGPT": ("openai.com", "openai"),
    "Claude": ("anthropic.com", "claude"),
    "豆包": ("doubao.com", "doubao"),
    "Kimi智能助手": ("kimi.moonshot.cn", "kimi"),
    "DeepSeek": ("deepseek.com", "deepseek"),
    "讯飞星火": ("xinghuo.xfyun.cn", "xinghuo"),
    "华为小艺": ("huawei.com", "xiaoyi"),

    # AI智能体
    "扣子": ("coze.cn", "coze"),
    "Manus": ("manus.im", "manus"),
    "OpenClaw": ("openclaw.com", "openclaw"),
    "WorkBuddy": ("codebuddy.cn", "workbuddy"),

    # AI编程
    "Cursor": ("cursor.com", "cursor"),
    "GitHub Copilot": ("github.com", "github"),
    "Claude Code": ("anthropic.com", "claude"),
    "TRAE": ("trae.ai", "trae"),
    "秒哒": ("miaoda.alibaba.com", "miaoda"),

    # AI音频
    "Suno": ("suno.ai", "suno"),
    "魔音工坊": ("moyin.com", "moyin"),
    "讯飞听见": ("iflyrec.com", "iflyrec"),
    "Udio": ("udio.com", "udio"),
    "海绵音乐": ("haimian.com", "haimian"),
    "MemoAI": ("memo.ac", "memo"),

    # AI搜索
    "秘塔AI搜索": ("metaso.cn", "metaso"),
    "Perplexity": ("perplexity.ai", "perplexity"),
    "夸克AI": ("quark.cn", "quark"),
    "天工AI搜索": ("tiangong.cn", "tiangong"),
}

# 图标来源API
LOGO_APIS = [
    # Clearbit Logo API
    "https://logo.clearbit.com/{domain}",
    # IconHorse (带fallback)
    "https://www.iconhorse.com/api/v1/ico?url={domain}&step=1",
]

def download_icon(name, domain, save_path, timeout=10):
    """下载单个图标"""
    try:
        url = f"https://logo.clearbit.com/{domain}"
        filename = f"{save_path}/{name}.png"

        print(f"下载 {name}: {url}")

        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

        with urllib.request.urlopen(req, timeout=timeout, context=ssl_context) as response:
            data = response.read()
            with open(filename, 'wb') as f:
                f.write(data)

            print(f"  ✓ 成功: {filename} ({len(data)} bytes)")
            return True

    except Exception as e:
        print(f"  ✗ 失败: {str(e)}")
        return False

def main():
    save_path = os.path.dirname(os.path.abspath(__file__))

    print(f"图标保存目录: {save_path}")
    print("=" * 50)

    success_count = 0
    fail_count = 0

    for name, (domain, _) in TOOLS.items():
        if download_icon(name, domain, save_path):
            success_count += 1
        else:
            fail_count += 1
        time.sleep(0.5)  # 避免请求过快

    print("=" * 50)
    print(f"完成! 成功: {success_count}, 失败: {fail_count}")

if __name__ == "__main__":
    main()
