# AI工具场 - Gitee Pages 部署教程

## 快速开始

### 你的备用站地址
```
https://anchen.gitee.io/ai工具场/
```

---

## 第一步：创建仓库

1. 登录 **gitee.com**
2. 点击右上角 **+** → **新建仓库**
3. 填写信息：
   - **仓库名称**：`ai-gongju-chang`（或随便取）
   - **仓库路径**：`ai-gongju-chang`
   - **初始化仓库**：❌ 不勾选
   - **开源**：❌ 不勾选（私有更安全）
4. 点击 **创建**

---

## 第二步：上传文件

### 方法1：网页上传（最简单）

1. 进入刚创建的仓库
2. 点击 **上传** 按钮
3. 把以下4个文件拖进去：
   - `index.html`
   - `admin.html`
   - `user.html`
   - `courses.json`
4. 填写提交信息（随便写）
5. 点击 **提交**

### 方法2：Git命令行上传

如果你会Git，用这个更方便：
```bash
git init
git remote add origin https://gitee.com/anchen/ai-gongju-chang.git
git add .
git commit -m "AI工具场 v1.0"
git push -u origin master
```

---

## 第三步：开启 Gitee Pages

1. 进入仓库页面
2. 点击左侧菜单 **服务** → **Gitee Pages**
3. 点击 **启动**
4. 选择分支：`master`
5. 点击 **部署**
6. 等待几秒，得到地址：
   ```
   https://anchen.gitee.io/ai-gongju-chang/
   ```

---

## 第四步：访问测试

打开浏览器访问：
```
https://anchen.gugee.gitee.io/ai-gongju-chang/
```

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `index.html` | 主站页面 |
| `admin.html` | 管理后台（上传收款码等） |
| `user.html` | 用户页面 |
| `courses.json` | 课程数据 |

---

## 注意事项

1. **修改网站内容后**，需要重新上传文件
2. **收款码设置**保存在浏览器本地，换设备需要重新设置
3. 建议定期 **git push** 备份代码

---

## 备份方案总结

| 站 | 地址 | 状态 |
|---|------|------|
| 主站 | aigoo888.cn | 需域名备案 |
| 备用站 | anchen.gitee.io/ai-gongju-chang/ | ✅ 永久免费 |

---

## 遇到问题？

Q: 部署失败怎么办？
A: 检查仓库是否设为 **公开(Public)**，Gitee Pages需要公开仓库。

Q: 页面显示空白？
A: 确保 `index.html` 在仓库根目录，不是子文件夹。
