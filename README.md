# 🐟 鱼塘周记馆

一个装在自己电脑上的小工具：**每天把碎碎念和摘抄丢进去，它帮你分成「今日复盘」和「素材库」**。

- 只跑在本地，数据存在你自己的电脑里，不上传任何服务器
- 不用注册、不用登录，打开就能用
- 调用你自己的大模型 API（默认 DeepSeek），费用走你自己的账户
- 不接入 QQ / 微信，没有任何社交功能

---

## 一、安装

### Windows

1. 下载 `鱼塘周记馆-1.0.0-安装包.exe`
2. 双击安装（如果弹出「Windows 已保护你的电脑」，点「更多信息」→「仍要运行」）
3. 安装完桌面会出现「鱼塘周记馆」图标，双击打开

> 首次打开如果杀毒软件提示，选择允许即可 —— 这是自己打包的本地程序，没有联网上传行为。

### macOS

1. 下载 `鱼塘周记馆-1.0.0-arm64.dmg`（M 系列芯片）或 `-x64.dmg`（Intel 芯片）
2. 打开 dmg，把「鱼塘周记馆」拖进「应用程序」
3. **第一次打开**：在「应用程序」里右键点击图标 → 选「打开」→ 再点「打开」
   （直接双击会被系统拦住，因为安装包没有苹果签名，这是正常的）

---

## 二、填入 API Key（只需要做一次）

软件本身不带 AI 能力，要用你自己的大模型账号。

### 以 DeepSeek 为例

1. 打开 <https://platform.deepseek.com/>，注册并登录
2. 左侧点「API keys」→「创建 API key」→ 复制那串 `sk-` 开头的字符
   （**只显示一次**，先粘到记事本里放着）
3. 账户里要有余额，否则调用会失败
4. 打开鱼塘周记馆 → 左下角「鱼塘设置」
5. 把 Key 粘到 **API Key** 里（输入框失焦就自动保存）
6. 点右边的「测试连接」，看到「通了，肥鱼说…」就成功了

默认配置已经填好，不用改：

| 项目 | 默认值 |
| --- | --- |
| 接口地址 | `https://api.deepseek.com/v1` |
| 模型 | `deepseek-chat` |

### 用别的模型

任何**兼容 OpenAI 格式**的接口都能用（通义、Kimi、智谱、硅基流动、本地 Ollama 等）：

- 接口地址填到 `/v1` 这一层，比如 `https://api.moonshot.cn/v1`
- 模型选「自定义模型名…」，填上对方文档里的模型名

---

## 三、开始投喂

1. 打开首页「今日投喂」
2. 在最大的那个框里，把今天的事一股脑写进去 —— **不用分类，不用排版**

   比如：

   > 今天把方案初稿改完了，卡在配图一直选不出来，一下午都耗在这。
   > 上午被会议切碎了，深度工作不到两小时。
   > 看到一句话挺喜欢：慢就是快。

3. 选模式（见下），点「开始整理」（或按 `Ctrl + Enter`）
4. 等几秒，下面会出两块内容：

```
📋【鱼塘今日复盘】
  ✅ 今日收成      —— 今天做完的事
  ⚠️ 鱼塘暗礁      —— 卡点 + 一句建议
  📌 下轮投喂清单   —— 明天要做的事，标了高/中优先级（可以点勾）
  🐟 肥鱼点评      —— 一句吐槽或鼓励

📂【本期饵料收纳库】
  每条素材自动分到：选题 / 金句 / 想法 / 论据
  打 1-5 星，附一句提纯摘要和用法备注
```

素材会自动进「饵料库」，不用手动存。

### 两个模式

| | 🍚 加餐模式 | 🥗 减脂模式 |
| --- | --- | --- |
| 复盘 | 卡点讲透，给更细的建议 | 只保留待办清单 |
| 素材 | 额外补充使用思路 | 只留标签 + 星级 + 一句摘要 |
| 白饭（token） | 多，一次约 2000-3000 | 少，一次约 700-1200 |

日常用减脂，写周记前那几天用加餐，是个不错的节奏。

---

## 四、其他几个页面

| 页面 | 干什么 |
| --- | --- |
| **鱼塘周记** | 按日期看过去每一次投喂的完整内容，可以看原文、删记录 |
| **饵料库** | 关键词搜素材，按标签/星级筛选，点星星能改评分 |
| **鱼塘清仓** | 自动列出所有 1-2 星的低价值素材，勾选后批量删掉 |
| **生成周记** | 选一段日期，把这段时间的复盘和高分素材汇成一份周报 |

---

## 五、数据存在哪

```
Windows: C:\Users\你的用户名\Documents\鱼塘周记馆\fishpond.json
macOS:   /Users/你的用户名/Documents/鱼塘周记馆/fishpond.json
```

一个 JSON 文件，里面就是你的所有内容。设置页有「打开数据文件夹」按钮，可以直接跳过去。

### 备份

- **导出备份**：存成一个 `.json` 文件，可以丢网盘、U 盘
- **导入备份**：会**覆盖**当前所有数据，换电脑时用

> 换电脑 / 重装系统前，一定先导出一份。

---

## 六、常见问题

**提示「肥鱼出去干饭迷路啦，请检查API密钥和网络」**

按顺序排查：

1. 设置页点「测试连接」，看具体报错
2. Key 是不是复制全了，前后有没有多余空格
3. 账户里有没有余额
4. 接口地址是不是填错了（DeepSeek 是 `https://api.deepseek.com/v1`）
5. 公司网络/VPN 可能拦截了请求，换个网络试试

**提示「投喂内容太多，肥鱼嚼不动」**

一次别超过 6000 字（可在设置里改）。拆成两三次投喂，效果也更好。

**白饭（token）是什么？**

就是模型的计费单位。软件在输入框上方实时显示「本次预计 ≈ xxx 白饭」，设置页也有两种模式的对比估算。数字是估值，实际以模型账单为准。

**能不能不要 AI，自己手动分类？**

不行，这个工具的设计前提就是「你只管写，AI 负责分」。

**会上传我的内容吗？**

不会。内容只发给你自己填的那个模型接口，存也只存在本地 JSON 里。软件没有自己的服务器。

---

## 七、给想自己改代码的人

### 环境

Node.js 18+（推荐 20/22）

```bash
npm install
npm run dev        # 开发模式，改代码热更新
```

首次 `npm install` 如果卡在下载 Electron，用国内镜像：

```bash
# macOS / Linux
ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" npm install

# Windows PowerShell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"; npm install
```

### 打包

```bash
npm run dist:win    # 出 Windows 安装包（.exe）
npm run dist:mac    # 出 macOS 安装包（.dmg，需在 Mac 上执行）
npm run dist:all    # 两个都要（分别在对应系统上跑）
```

产物在 `release/` 目录。

> `dist:mac` 只能在 macOS 上跑，这是 electron-builder 的限制，Windows 上打不出 dmg。

**打包时如果卡在下载**（国内网络常见，报 `Bad Gateway` 或 `ETIMEDOUT`）：

```bash
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm run dist:win
```

**如果报 `Cannot create symbolic link ... libcrypto.dylib`**：

这是 Windows 账号没有创建符号链接的权限（electron-builder 解压签名工具包时会失败）。三选一：

1. 打开「设置 → 系统 → 开发者选项」，把「开发人员模式」打开，重新打包（推荐）
2. 用管理员身份打开终端再打包
3. 临时跳过写入 exe 图标这一步：

```bash
npx electron-builder --win --x64 --config.win.signAndEditExecutable=false
```

第 3 种方式装出来的软件功能完全正常，只是 exe 文件属性里的图标和版本号保持 Electron 默认值。

### 分发给别人

把 `release/` 里的安装包直接发给对方就行：

- Windows：`鱼塘周记馆-1.0.0-安装包.exe`
- macOS：`鱼塘周记馆-1.0.0-arm64.dmg` / `-x64.dmg`

对方装好后，**需要自己填一个 API Key** 才能用。如果想让别人开箱即用，得由你来提供 Key —— 但那样费用就算你的了，一般不建议。

### 目录结构

```
fishpond/
├── electron/              # 主进程
│   ├── main.js            # 窗口、IPC、大模型请求（流式）
│   ├── preload.js         # 安全桥，渲染进程只能通过它读写数据
│   ├── store.js           # 本地 JSON 存储（lowdb + 原子写兜底）
│   └── prompts.js         # 内置提示词（改这里就能调 AI 行为）
├── src/
│   ├── views/             # 6 个页面
│   ├── components/        # 侧栏、输出面板、模式切换等
│   ├── stores/fish.js     # Pinia 状态与业务流
│   └── utils/parse.js     # 解析 AI 输出（含正则兜底）
├── build/icon.png         # 应用图标（由 scripts/gen-icon.js 生成）
└── scripts/gen-icon.js    # 纯代码画图标，npm run icon 可重新生成
```

### 想改 AI 的说话方式？

改 `electron/prompts.js` 里的 `SYSTEM_PROMPT`。改完记得保持 `<data>` 那段的 JSON 结构不变，前端靠它入库。

---

## 技术栈

Electron 33 + Vue 3 + Vite 5 + TailwindCSS 3 + Pinia 2 + lowdb 7

没有数据库、没有向量库、没有云服务，就一个 JSON 文件。
