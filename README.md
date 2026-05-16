# Pi Armory / 派武库

🐱 Cat-Pi 核心插件 · Core extensions for Cat-Pi

四个扩展 / Four extensions:

1. **会话树预览 / Session Tree Preview** — 选中条目时显示内容 / Shows selected entry content
2. **计划模式 / Plan Mode** — 只读探索 + 进度追踪 / Read-only exploration + progress tracking
3. **回收站 / Trash** — 写操作前自动备份 / Auto-backup before write/edit
4. **启动横幅 / Startup Banner** — 简洁功能概览 / Compact feature overview

---

## 安装 / Install

```bash
pi install git:github.com/HZZSCIENCE/pi-armory
```

或一键 / or one-command:

```bash
npm install -g @tropical_meow/cat-pi
cat-pi
```

---

## 功能 / Features

### 会话树预览 / Session Tree Preview (`/armory`)

| 命令 / Command | 说明 / Description |
|---------|-------------|
| `/armory` | 切换开关 / Toggle on/off |
| `/armory on` | 强制开启 / Force enable |
| `/armory off` | 强制关闭 / Force disable |

Esc×2 或 `/tree` 打开树,选条目按 Enter,预览选中内容 / Press Enter on tree entry to preview.

```
─────────────────────────────────
 Summarize branch?

 user: 帮我看下这个bug

 → No summary
   Summarize
   Summarize with custom prompt
─────────────────────────────────
```

### 计划模式 / Plan Mode (`/plan`)

| 命令 / Command | 说明 / Description |
|---------|-------------|
| `/plan` | 切换计划模式 / Toggle plan mode |
| `/todos` | 查看进度 / Show progress |
| `Ctrl+Alt+P` | 快捷键 / Shortcut |

流程 / Flow: `/plan` → 只读分析 → AI 生成 Plan → 选择执行 → `[DONE:n]` 标记 → PLAN.md 自动同步

### 回收站 / Trash (`/trash`)

| 命令 / Command | 说明 / Description |
|---------|-------------|
| `/trash` | 查看回收站 / List files |
| `/trash restore` | 恢复文件 / Restore file |
| `/trash clear` | 清空 / Empty |
| `/trash on/off` | 开关 / Toggle |

`write`/`edit` 操作前自动备份到 `.pi/trash/`, `bash rm` 默认拦截 / Auto-backup before write/edit, rm blocked.

### 启动横幅 / Startup Banner

| 命令 / Command | 说明 / Description |
|---------|-------------|
| `/armory-header` | 切换横幅 / Toggle banner |
| `/cat-update` | 升级 Cat-Pi / Update Cat-Pi |

---

## 卸载 / Uninstall

```bash
/armory off
pi remove git:github.com/HZZSCIENCE/pi-armory
```
