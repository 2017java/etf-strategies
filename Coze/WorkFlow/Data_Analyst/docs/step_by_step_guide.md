# 📚 超详细部署操作指南

## 前提条件

- 你已经有火山引擎云服务器：`118.145.228.33`
- 你已经创建了飞书应用（有App ID和Secret）
- 你知道服务器的登录密码或已配置SSH密钥

---

## 第一步：上传项目到服务器

### 方法1：使用 SCP 命令（推荐，最简单）

#### 步骤1.1: 在 Coze 平台下载项目

**在 Coze 平台操作：**

1. 在 Coze 平台找到你的项目
2. 点击右上角的 **"下载"** 或 **"导出"** 按钮
3. 选择下载为 ZIP 压缩包
4. 保存到你的电脑，比如 `Downloads/feishu-bot.zip`

#### 步骤1.2: 解压项目

**在你的本地电脑执行（打开终端）：**

```bash
# 进入下载目录
cd ~/Downloads

# 解压项目（如果下载的是 zip）
unzip feishu-bot.zip

# 或者如果是其他格式
tar -xzvf feishu-bot.tar.gz

# 查看解压后的目录
ls -la feishu-bot
```

你会看到类似这样的文件结构：
```
feishu-bot/
├── src/
│   ├── bot/
│   ├── graphs/
│   └── ...
├── config/
├── scripts/
└── AGENTS.md
```

#### 步骤1.3: 上传到服务器

**在你的本地电脑执行（打开终端）：**

```bash
# 进入项目目录
cd ~/Downloads/feishu-bot

# 上传整个项目到服务器
scp -r . root@118.145.228.33:/opt/feishu-bot
```

**执行后会提示：**
```
root@118.145.228.33's password: 
```

**输入你的服务器密码**（输入时不会显示，直接输入后按回车）

**等待上传完成**，你会看到很多文件传输进度：
```
file1.py                    100%  1234    10.2KB/s   00:00
file2.py                    100%  5678    15.3KB/s   00:00
...
```

---

### 方法2：使用 Git（如果项目在 GitHub/GitLab）

#### 步骤1.1: 先登录服务器

**在你的本地电脑执行：**

```bash
ssh root@118.145.228.33
```

输入密码登录成功后，你会看到服务器的命令行提示符，类似：
```
[root@i-yeh7lgrt34uo7bub8q90 ~]#
```

#### 步骤1.2: 在服务器上克隆项目

**在服务器上执行：**

```bash
# 安装 git（如果没有）
yum install -y git   # CentOS 系统
# 或
apt install -y git   # Ubuntu 系统

# 克隆项目（替换为你的 Git 地址）
cd /opt
git clone https://github.com/your-username/feishu-bot.git

# 进入项目目录
cd feishu-bot
```

---

### 方法3：使用 FileZilla 等图形化工具（适合 Windows 用户）

#### 步骤1.1: 下载 FileZilla

访问：https://filezilla-project.org/download.php
下载并安装 FileZilla Client

#### 步骤1.2: 连接服务器

1. 打开 FileZilla
2. 点击左上角的 **"站点管理器"**
3. 点击 **"新站点"**
4. 填写连接信息：
   - **主机**: `118.145.228.33`
   - **协议**: SFTP
   - **登录类型**: 正常
   - **用户**: `root`
   - **密码**: 你的服务器密码
5. 点击 **"连接"**

#### 步骤1.3: 上传文件

1. 左侧是本地文件，右侧是服务器文件
2. 在右侧导航到 `/opt` 目录
3. 在左侧选择项目文件夹
4. 右键点击 → **上传**

---

## 第二步：执行部署脚本

### 步骤2.1: 登录服务器

**在你的本地电脑执行（如果还没登录）：**

```bash
ssh root@118.145.228.33
```

输入密码后，你会看到服务器的命令提示符：
```
[root@i-yeh7lgrt34uo7bub8q90 ~]#
```

### 步骤2.2: 进入项目目录

**在服务器上执行：**

```bash
cd /opt/feishu-bot
```

验证项目文件：
```bash
ls -la
```

你应该看到：
```
drwxr-xr-x  5 root root 4096 Mar  8 14:00 .
drwxr-xr-x  3 root root 4096 Mar  8 13:55 ..
-rw-r--r--  1 root root  123 Mar  8 14:00 AGENTS.md
drwxr-xr-x  2 root root 4096 Mar  8 14:00 config
drwxr-xr-x  2 root root 4096 Mar  8 14:00 docs
drwxr-xr-x  2 root root 4096 Mar  8 14:00 scripts
drwxr-xr-x  4 root root 4096 Mar  8 14:00 src
```

### 步骤2.3: 给脚本执行权限

**在服务器上执行：**

```bash
chmod +x scripts/deploy_volcano.sh
```

### 步骤2.4: 执行部署脚本

**在服务器上执行：**

```bash
./scripts/deploy_volcano.sh
```

**脚本会自动执行以下操作：**

1. ✅ 检测操作系统类型
2. ✅ 更新系统软件包
3. ✅ 安装 Python3 和依赖
4. ✅ 安装 Flask 等库
5. ✅ 配置防火墙（开放5000端口）
6. ✅ 配置环境变量
7. ✅ 创建 systemd 服务
8. ✅ 启动服务
9. ✅ 测试服务

**执行过程会显示：**

```
==========================================================================
🚀 飞书机器人 - 火山引擎一键部署脚本
==========================================================================

【步骤1】检查系统环境
--------------------------------------------------------------------------
检测到系统: CentOS / RHEL

【步骤2】安装系统依赖
--------------------------------------------------------------------------
更新系统...
安装 Python3 和 pip...
...

【步骤3】安装 Python 依赖
--------------------------------------------------------------------------
安装 Flask 和相关包...
...

【步骤4】配置防火墙
--------------------------------------------------------------------------
开放 5000 端口 (firewalld)...
✅ 防火墙配置完成

...

【步骤8】启动服务
--------------------------------------------------------------------------
重新加载 systemd 配置...
启用开机自启...
启动服务...
✅ 服务启动成功

==========================================================================
🎉 部署完成！
==========================================================================

服务器信息:
  - 公网IP: 118.145.228.33
  - Webhook地址: http://118.145.228.33:5000/webhook
  - 健康检查: http://118.145.228.33:5000/health
```

### 步骤2.5: 验证部署

**在服务器上执行：**

```bash
# 查看服务状态
sudo systemctl status feishu-bot
```

**正常输出：**
```
● feishu-bot.service - Feishu Bot Service
   Loaded: loaded (/etc/systemd/system/feishu-bot.service; enabled; vendor preset: disabled)
   Active: active (running) since Sat 2024-03-08 14:30:00 CST; 1min ago
 Main PID: 12345 (python3)
   CGroup: /system.slice/feishu-bot.service
           └─12345 /usr/bin/python3 feishu_bot_server.py

Mar 08 14:30:00 i-yeh7lgrt34uo7bub8q90 systemd[1]: Started Feishu Bot Service.
```

**在服务器上测试：**

```bash
# 测试本地访问
curl http://localhost:5000/health
```

**预期返回：**
```json
{
  "status": "ok",
  "service": "feishu-bot",
  "timestamp": 1709883000
}
```

**在你的本地电脑测试：**

打开新的终端窗口（不登录服务器），执行：

```bash
curl http://118.145.228.33:5000/health
```

**如果返回相同结果，说明服务正常！** ✅

---

## 第三步：配置飞书 Webhook

### 步骤3.1: 登录飞书开放平台

**在浏览器中操作：**

1. 打开：https://open.feishu.cn
2. 使用飞书账号登录
3. 进入 **"开发者后台"**
4. 找到你的应用（如果没有，点击"创建企业自建应用"）

### 步骤3.2: 配置权限

**在飞书开放平台操作：**

1. 点击应用名称进入应用详情
2. 左侧菜单找到 **"权限管理"**
3. 搜索并申请以下权限：
   - `im:message` - 获取与发送消息
   - `im:message:send_as_bot` - 以应用身份发消息
   - `im:message:receive_as_bot` - 接收群聊消息
   - `bitable:record:read` - 读取多维表格

4. 每个权限点击 **"申请权限"**
5. 等待管理员审批（如果是企业应用，需要管理员批准）

### 步骤3.3: 配置事件订阅

**在飞书开放平台操作：**

1. 左侧菜单找到 **"事件订阅"**
2. 点击 **"添加事件订阅"**
3. 填写配置：

   **请求网址**:
   ```
   http://118.145.228.33:5000/webhook
   ```

4. 点击 **"添加事件"**，选择：
   - `im.message.receive_v1` - 接收消息

5. 点击 **"保存"**

**如果配置正确，你会看到：**
```
✅ 请求网址验证成功
```

**如果验证失败：**
- ❌ 检查服务器是否启动：`sudo systemctl status feishu-bot`
- ❌ 检查防火墙：`sudo firewall-cmd --list-ports`
- ❌ 查看服务器日志：`sudo journalctl -u feishu-bot -f`

### 步骤3.4: 启用机器人功能

**在飞书开放平台操作：**

1. 左侧菜单找到 **"应用功能"** → **"机器人"**
2. 开启 **"启用机器人"**
3. 配置机器人信息：
   - **机器人名称**: 数据分析助手
   - **机器人描述**: 帮助查询和分析线索数据
   - **机器人头像**: 上传一个图标
4. 点击 **"保存"**

### 步骤3.5: 发布应用

**在飞书开放平台操作：**

1. 点击右上角 **"创建版本"**
2. 填写版本说明：
   ```
   版本号: 1.0.0
   更新说明: 初始版本，支持线索数据查询分析
   ```
3. 点击 **"保存"**
4. 点击 **"申请发布"**
5. 等待审核通过（通常几分钟到几小时）

### 步骤3.6: 将机器人添加到飞书群

**在飞书客户端操作：**

1. 打开飞书群聊
2. 点击右上角 **"..."**
3. 选择 **"设置"**
4. 点击 **"群机器人"**
5. 点击 **"添加机器人"**
6. 选择 **"数据分析助手"**
7. 点击 **"添加"**

---

## 第四步：测试验证

### 测试1: 在飞书群中测试

**在飞书群中发送：**

```
@数据分析助手 查询铂智3X的目标线索数据
```

**机器人会自动回复：**
```
收到查询请求，正在处理中...
查询内容：查询铂智3X的目标线索数据

📊 数据分析结果

分析结论：
铂智3X的线索目标为330150条

数据概览：
本次分析共涉及1条有效数据记录，核心指标为铂智3X的线索目标

详细信息：
该线索目标数据对应的周期为第10周，3月份
```

### 测试2: 查看服务器日志

**在服务器上执行：**

```bash
sudo journalctl -u feishu-bot -f
```

**你会看到实时日志：**
```
Mar 08 14:35:00 i-yeh7lgrt34uo7bub8q90 python3[12345]: 收到飞书事件: {...}
Mar 08 14:35:00 i-yeh7lgrt34uo7bub8q90 python3[12345]: 解析后的消息: {...}
Mar 08 14:35:01 i-yeh7lgrt34uo7bub8q90 python3[12345]: 触发工作流处理查询...
Mar 08 14:35:05 i-yeh7lgrt34uo7bub8q90 python3[12345]: 工作流执行完成
```

---

## 🔧 常见问题排查

### 问题1: SCP 上传失败

**错误信息：**
```
Permission denied (publickey,password)
```

**解决方法：**
```bash
# 确认服务器密码正确
# 或使用 SSH 密钥登录
ssh-copy-id root@118.145.228.33
```

### 问题2: 部署脚本执行失败

**检查方法：**
```bash
# 查看详细错误
bash -x ./scripts/deploy_volcano.sh

# 查看系统日志
tail -f /var/log/messages
```

### 问题3: 服务无法访问

**排查步骤：**
```bash
# 1. 检查服务状态
sudo systemctl status feishu-bot

# 2. 检查端口监听
netstat -nltp | grep 5000

# 3. 检查防火墙
sudo firewall-cmd --list-ports

# 4. 查看服务日志
sudo journalctl -u feishu-bot -n 50
```

### 问题4: 飞书 Webhook 验证失败

**解决方法：**
```bash
# 1. 确认服务运行
sudo systemctl status feishu-bot

# 2. 确认端口开放
sudo firewall-cmd --add-port=5000/tcp --permanent
sudo firewall-cmd --reload

# 3. 测试 webhook 地址
curl -X POST http://118.145.228.33:5000/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test"}'
```

---

## 📝 操作总结

### 在本地电脑执行：

```bash
# 1. 解压项目
cd ~/Downloads
unzip feishu-bot.zip
cd feishu-bot

# 2. 上传到服务器
scp -r . root@118.145.228.33:/opt/feishu-bot

# 3. 测试外网访问（部署后）
curl http://118.145.228.33:5000/health
```

### 在服务器上执行：

```bash
# 1. 登录服务器
ssh root@118.145.228.33

# 2. 进入项目目录
cd /opt/feishu-bot

# 3. 执行部署脚本
chmod +x scripts/deploy_volcano.sh
./scripts/deploy_volcano.sh

# 4. 查看服务状态
sudo systemctl status feishu-bot

# 5. 查看日志
sudo journalctl -u feishu-bot -f
```

### 在飞书开放平台操作：

1. 配置权限（4个必需权限）
2. 配置事件订阅（Webhook: `http://118.145.228.33:5000/webhook`）
3. 启用机器人功能
4. 发布应用
5. 添加机器人到飞书群

---

## ✅ 最终检查清单

完成以下所有步骤即部署成功：

- [ ] 项目已上传到服务器 `/opt/feishu-bot`
- [ ] 部署脚本执行成功
- [ ] 服务状态显示 `active (running)`
- [ ] 本地测试：`curl http://localhost:5000/health` 返回正常
- [ ] 外网测试：`curl http://118.145.228.33:5000/health` 返回正常
- [ ] 飞书权限已申请并通过
- [ ] 飞书事件订阅已配置并验证成功
- [ ] 机器人已启用并发布
- [ ] 机器人已添加到飞书群
- [ ] 在飞书群中测试成功
