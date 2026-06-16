# moyu（摸鱼）

基于 Electron 的 macOS 透明悬浮应用。窗口置顶、半透明、跨桌面显示，可在任何应用之上浏览网页或播放视频，配合系统托盘菜单快捷控制。适合"摸鱼"。

## 功能

- **透明悬浮窗**：默认 30% 透明度，可调（0.025 ~ 1），始终置顶于所有窗口之上（`screen-saver` 层级），跨所有桌面/Space 跟随显示
- **双视图切换**：
  - 网页浏览（`index.html` + BrowserView）：内置搜索框，支持前进/后退
  - 视频播放器（`player.html`）：HTML5 视频播放
- **系统托盘菜单**：点击托盘图标弹出自定义菜单窗口，包含：
  - 前进 / 后退导航
  - 切换到播放器 / 网页浏览
  - 忽略鼠标事件（点击穿透）
  - 调整透明度
  - 固定窗口开关
  - 退出
- **全局快捷键**（窗口聚焦时生效）：

  | 快捷键 | 功能 |
  | --- | --- |
  | `⌘ ←` / `⌘ →` | 后退 / 前进（仅网页视图） |
  | `⌘ -` / `⌘ =` | 减小 / 增加透明度 |
  | `⌘ D` | 切换忽略鼠标事件 |
  | `⌘ F` | 切换固定窗口 |

- **macOS 集成**：隐藏 Dock 图标（纯托盘应用），支持 macOS 原生「隐藏 / 显示应用」（⌘H）

## 目录结构

```
yu-app/
├── main.js              # 主进程：窗口/托盘/菜单/快捷键注册
├── shortcutKeys.js      # 全局快捷键与窗口操作逻辑
├── index.html           # 网页浏览视图
├── player.html          # 视频播放器视图
├── forge.config.js      # electron-forge 打包配置
├── cat-fish.png         # 托盘图标
└── package.json
```

## 开发与运行

```bash
# 安装依赖
npm install

# 开发模式启动（electron-forge）
npm start

# 打包
npm run package    # 打包当前平台
npm run make       # 生成安装包
```

> 依赖：Electron 25.x、electron-forge 6.x

## 技术说明

- 使用 `BrowserView` 实现网页视图与播放器视图的切换
- 主窗口使用 `screen-saver` 层级 + `visibleOnAllWorkspaces` 实现真正的全局置顶
- `setVisibleOnAllWorkspaces(true)` 会使进程从 accessory 转为 foreground，这是 macOS 原生 Hide/Show 能生效的前提；设为 `false` 时通过 `skipTransformProcessType: true` 避免被打回 accessory
- 托盘菜单窗口不设置 `visibleOnAllWorkspaces`，菜单关闭后焦点交还主窗口，保证原生 Hide/Show 不受影响