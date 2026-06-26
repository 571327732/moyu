const {app, BrowserWindow, ipcMain, BrowserView, Tray, Menu, nativeImage, desktopCapturer, screen} = require("electron");

//引入其他 自定义 js 文件
const myShortcutKey = require("./shortcutKeys");
const {startCookieServer} = require("./cookie-server");
const path = require("path");

let mainWindow;
let menuWindow;
let tray;
let currentView = 'web'; // 当前显示的视图
let webView; // 网页视图
let playerView; // 播放器视图
let fakeView; // 伪装代码视图
let fakeWallpaperView; // 假桌面壁纸视图
let viewBeforeBoss = null; // 老板键切换前的视图
let isFakeWallpaper = false; // 假桌面壁纸状态

const is_mac = process.platform==='darwin'
if(is_mac) {
    app.dock.hide()
}

function createMenuWindow() {
    menuWindow = new BrowserWindow({
        width: 280,
        height: 100,  // 初始高度，会自动调整
        show: false,
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        visibleOnAllWorkspaces: false,
        acceptFirstMouse: true,
        useContentSize: true,  // 基于内容大小
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // 创建菜单的 HTML 内容
    const menuHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            html, body {
                height: auto;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
                font-size: 14px;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 248, 248, 0.98) 100%);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.5);
                padding-bottom: 4px;
            }
            .menu-item {
                padding: 12px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: space-between;
                color: #2d3748;
                transition: all 0.2s ease;
                position: relative;
            }
            .menu-item:hover {
                background: rgba(0, 0, 0, 0.05);
                color: #333;
            }
            .menu-item:active {
                background: rgba(0, 0, 0, 0.08);
            }
            .menu-item-left {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .menu-item-icon {
                font-size: 18px;
                width: 24px;
                text-align: center;
                color: #8e8e93;
                transition: color 0.2s ease;
            }
            .menu-item:hover .menu-item-icon {
                color: #667eea;
            }
            .menu-item-icon svg {
                display: block;
                margin: 0 auto;
            }
            .menu-item-label {
                font-weight: 500;
            }
            .menu-item-value {
                font-size: 12px;
                color: #a0aec0;
                font-weight: 600;
                background: rgba(0, 0, 0, 0.05);
                padding: 2px 8px;
                border-radius: 10px;
            }
            .menu-item:hover .menu-item-value {
                background: rgba(102, 126, 234, 0.1);
                color: #667eea;
            }
            .menu-separator {
                height: 1px;
                background: rgba(0, 0, 0, 0.1);
                margin: 4px 16px;
            }
            .toggle-switch {
                position: relative;
                width: 44px;
                height: 24px;
                background: #e5e5ea;
                border-radius: 12px;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            .toggle-switch.active {
                background: #34c759;
            }
            .toggle-switch::after {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                transition: transform 0.2s ease;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            }
            .toggle-switch.active::after {
                transform: translateX(20px);
            }
            .slider-container {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }
            .slider {
                -webkit-appearance: none;
                appearance: none;
                width: 120px;
                height: 6px;
                background: linear-gradient(to right, #007aff 0%, #007aff var(--slider-percent, 30%), #e5e5ea var(--slider-percent, 30%), #e5e5ea 100%);
                border-radius: 3px;
                outline: none;
                transition: background 0.1s ease;
            }
            .slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
                transition: transform 0.1s ease;
            }
            .slider::-webkit-slider-thumb:hover {
                transform: scale(1.1);
            }
            .slider::-webkit-slider-thumb:active {
                transform: scale(0.95);
                box-shadow: 0 1px 6px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.08);
            }
            .slider-value {
                font-size: 12px;
                color: #8e8e93;
                min-width: 35px;
                text-align: right;
                font-variant-numeric: tabular-nums;
            }
            .danger {
                color: #fc8181 !important;
            }
            .danger:hover {
                background: linear-gradient(90deg, rgba(252, 129, 129, 0.1) 0%, rgba(245, 101, 101, 0.1) 100%) !important;
                color: #e53e3e !important;
            }
            .danger .menu-item-icon {
                color: #fc8181 !important;
            }
            .danger:hover .menu-item-icon {
                color: #e53e3e !important;
            }
            .nav-item {
                background: transparent;
                border: none;
                border-radius: 6px;
                margin: 0 8px;
                padding: 8px 12px;
                transition: all 0.15s ease;
            }
            .nav-item:hover {
                background: rgba(0, 0, 0, 0.05);
            }
            .nav-controls {
                display: flex;
                gap: 8px;
                justify-content: center;
                align-items: center;
                padding: 12px 12px;
                margin: 0 8px;
            }
            .menu-item-shortcut {
                font-size: 11px;
                color: #999;
                font-weight: 500;
                background: rgba(0, 0, 0, 0.03);
                padding: 2px 6px;
                border-radius: 4px;
                margin-left: 4px;
            }
            .nav-btn {
                flex: 1;
                min-width: 80px;
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                background: #f5f5f5;
                color: #333;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
                text-align: center;
                line-height: 1.2;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            .nav-btn:hover {
                background: #e8e8e8;
            }
            .nav-btn:active {
                background: #ddd;
            }
            .nav-btn svg {
                flex-shrink: 0;
            }
        </style>
    </head>
    <body>
        <div class="nav-controls">
            <button class="nav-btn" data-action="backward">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                后退
            </button>
            <button class="nav-btn" data-action="forward">
                前进
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        </div>
        <div style="text-align: center; font-size: 10px; color: #999; margin: -8px 0 8px 0;">*仅在网页视图生效</div>

        <div class="menu-separator"></div>

        <div class="menu-item nav-item" data-action="boss-key">
            <div class="menu-item-left">
                <svg class="menu-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <span class="menu-item-label">伪装代码</span>
            </div>
            <div class="toggle-switch" id="bossKeyToggle"></div>
        </div>

        <div class="menu-item nav-item" data-action="quick-hide">
            <div class="menu-item-left">
                <svg class="menu-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                <span class="menu-item-label">快速隐藏</span>
            </div>
            <span class="menu-item-shortcut">⌘⇧H</span>
        </div>

        <div class="menu-item nav-item" data-action="fake-wallpaper">
            <div class="menu-item-left">
                <svg class="menu-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                    <rect x="6" y="7" width="12" height="6" rx="1"></rect>
                </svg>
                <span class="menu-item-label">假桌面壁纸</span>
            </div>
            <div class="toggle-switch" id="fakeWallpaperToggle"></div>
        </div>

        <div class="menu-item nav-item" data-action="toggle-fullscreen">
            <div class="menu-item-left">
                <svg class="menu-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
                <span class="menu-item-label">铺满屏幕</span>
            </div>
            <div class="toggle-switch" id="fullscreenToggle"></div>
        </div>

        <div class="menu-separator"></div>

        <div class="menu-item" data-action="toggle-ignore-mouse">
            <div class="menu-item-left">
                <svg class="menu-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                    <circle cx="12" cy="14" r="4"></circle>
                    <line x1="12" y1="6" x2="12" y2="6.01"></line>
                </svg>
                <span class="menu-item-label">忽略鼠标事件</span>
            </div>
            <div class="toggle-switch" id="ignoreMouseToggle"></div>
        </div>

        <div class="menu-separator"></div>

        <div class="menu-item" data-action="toggle-pin">
            <div class="menu-item-left">
                <svg class="menu-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 17v5"></path>
                    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z"></path>
                </svg>
                <span class="menu-item-label">固定窗口</span>
            </div>
            <div class="toggle-switch active" id="pinToggle"></div>
        </div>

        <div class="menu-separator"></div>

        <div class="menu-item">
            <div class="menu-item-left">
                <svg class="menu-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <span class="menu-item-label">透明度</span>
            </div>
            <div class="slider-container">
                <input type="range" class="slider" id="opacitySlider" min="2.5" max="100" value="30" step="2.5">
                <span class="slider-value" id="opacityValue">30%</span>
            </div>
        </div>



        <div class="menu-separator"></div>

        <div class="menu-item danger" data-action="quit">
            <div class="menu-item-left">
                <svg class="menu-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span class="menu-item-label">退出</span>
            </div>
        </div>
        <script>
            const ipcRenderer = window.electronAPI;
            let ignoreMouseEvents = false;
            let isPinned = true;
            let currentOpacity = 0.3;
            let isBossKeyActive = false;
            let isFakeWallpaperActive = false;
            let isFullscreenActive = false;

            // 更新透明度显示
            function updateOpacityDisplay(value) {
                const percentage = Math.round(value * 100);
                document.getElementById('opacityValue').textContent = percentage + '%';
                document.getElementById('opacitySlider').value = percentage;
                document.getElementById('opacitySlider').style.setProperty('--slider-percent', percentage + '%');
            }

            // 页面加载完成后，通知主进程调整窗口大小
            window.addEventListener('DOMContentLoaded', () => {
                const height = document.body.scrollHeight;
                ipcRenderer.send('resize-menu', { width: 280, height: height });

                // 滑动条事件
                const opacitySlider = document.getElementById('opacitySlider');
                const opacityValue = document.getElementById('opacityValue');
                
                // 初始化滑动条样式
                function updateSliderStyle(value) {
                    opacitySlider.style.setProperty('--slider-percent', value + '%');
                }
                
                // 初始化
                updateSliderStyle(opacitySlider.value);
                
                opacitySlider.addEventListener('input', (e) => {
                    const value = e.target.value / 100;
                    currentOpacity = value;
                    opacityValue.textContent = e.target.value + '%';
                    updateSliderStyle(e.target.value);
                    ipcRenderer.send('menu-action', 'set-opacity', value);
                });

                // 滑动开关点击事件
                document.querySelectorAll('.toggle-switch').forEach(toggle => {
                    toggle.addEventListener('click', () => {
                        const menuItem = toggle.closest('.menu-item');
                        const action = menuItem.dataset.action;
                        if (!action) return;

                        if (action === 'toggle-ignore-mouse') {
                            ignoreMouseEvents = !ignoreMouseEvents;
                            if (ignoreMouseEvents) {
                                toggle.classList.add('active');
                            } else {
                                toggle.classList.remove('active');
                            }
                            ipcRenderer.send('menu-action', 'toggle-ignore-mouse', ignoreMouseEvents);
                        } else if (action === 'toggle-pin') {
                            isPinned = !isPinned;
                            if (isPinned) {
                                toggle.classList.add('active');
                            } else {
                                toggle.classList.remove('active');
                            }
                            ipcRenderer.send('menu-action', 'toggle-pin', isPinned);
                        } else if (action === 'boss-key') {
                            isBossKeyActive = !isBossKeyActive;
                            if (isBossKeyActive) {
                                toggle.classList.add('active');
                            } else {
                                toggle.classList.remove('active');
                            }
                            ipcRenderer.send('menu-action', 'boss-key');
                        } else if (action === 'fake-wallpaper') {
                            isFakeWallpaperActive = !isFakeWallpaperActive;
                            if (isFakeWallpaperActive) {
                                toggle.classList.add('active');
                            } else {
                                toggle.classList.remove('active');
                            }
                            ipcRenderer.send('menu-action', 'fake-wallpaper');
                        } else if (action === 'toggle-fullscreen') {
                            isFullscreenActive = !isFullscreenActive;
                            if (isFullscreenActive) {
                                toggle.classList.add('active');
                            } else {
                                toggle.classList.remove('active');
                            }
                            ipcRenderer.send('menu-action', 'toggle-fullscreen');
                        }
                    });
                });

                document.querySelectorAll('.menu-item:not([data-action="toggle-ignore-mouse"]):not([data-action="toggle-pin"]):not([data-action="boss-key"]):not([data-action="fake-wallpaper"]):not([data-action="toggle-fullscreen"]), .nav-btn').forEach(item => {
                    item.addEventListener('click', () => {
                        const action = item.dataset.action;
                        if (!action) return;

                        switch(action) {
                            case 'forward':
                                ipcRenderer.send('menu-action', 'forward');
                                break;
                            case 'backward':
                                ipcRenderer.send('menu-action', 'backward');
                                break;
                            case 'go-to-player':
                                ipcRenderer.send('menu-action', 'go-to-player');
                                break;
                            case 'go-to-home':
                                ipcRenderer.send('menu-action', 'go-to-home');
                                break;
                            case 'quit':
                                ipcRenderer.send('menu-action', 'quit');
                                break;
                            case 'quick-hide':
                                ipcRenderer.send('menu-action', 'quick-hide');
                                break;
                        }
                    });
                });
            });

            // 监听透明度更新
            ipcRenderer.on('update-opacity', (event, value) => {
                currentOpacity = value;
                updateOpacityDisplay(value);
            });

            // 监听忽略鼠标事件状态更新
            ipcRenderer.on('update-ignore-mouse-state', (event, state) => {
                ignoreMouseEvents = state;
                const toggle = document.getElementById('ignoreMouseToggle');
                if (ignoreMouseEvents) {
                    toggle.classList.add('active');
                } else {
                    toggle.classList.remove('active');
                }
            });

            // 监听固定窗口状态更新
            ipcRenderer.on('update-pin-state', (event, state) => {
                isPinned = state;
                const toggle = document.getElementById('pinToggle');
                if (isPinned) {
                    toggle.classList.add('active');
                } else {
                    toggle.classList.remove('active');
                }
            });

            // 监听全屏状态更新
            ipcRenderer.on('update-fullscreen-state', (event, state) => {
                isFullscreenActive = state;
                const toggle = document.getElementById('fullscreenToggle');
                if (toggle) {
                    if (isFullscreenActive) {
                        toggle.classList.add('active');
                    } else {
                        toggle.classList.remove('active');
                    }
                }
            });

            // 监听伪装代码状态更新
            ipcRenderer.on('update-boss-key-state', (event, state) => {
                isBossKeyActive = state;
                const toggle = document.getElementById('bossKeyToggle');
                if (toggle) {
                    if (isBossKeyActive) {
                        toggle.classList.add('active');
                    } else {
                        toggle.classList.remove('active');
                    }
                }
            });

            // 监听假桌面壁纸状态更新
            ipcRenderer.on('update-fake-wallpaper-state', (event, state) => {
                isFakeWallpaperActive = state;
                const toggle = document.getElementById('fakeWallpaperToggle');
                if (toggle) {
                    if (isFakeWallpaperActive) {
                        toggle.classList.add('active');
                    } else {
                        toggle.classList.remove('active');
                    }
                }
            });

            // ESC 键关闭菜单
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    ipcRenderer.send('close-menu');
                }
            });
        </script>
    </body>
    </html>
    `;

    menuWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(menuHTML));

    // 等待页面加载完成后发送初始透明度（使用共享变量）
    menuWindow.webContents.on('did-finish-load', () => {
        if (mainWindow && menuWindow) {
            const currentOpacity = mainWindow.getOpacity();
            myShortcutKey.setCurrentOpacity(currentOpacity);
            menuWindow.webContents.send('update-opacity', currentOpacity);

            const ignoreMouseState = myShortcutKey.getIgnoreMouseEventsState();
            menuWindow.webContents.send('update-ignore-mouse-state', ignoreMouseState);
            menuWindow.webContents.send('update-pin-state', mainWindow.isAlwaysOnTop());
        }
    });

    // 监听菜单窗口隐藏事件，重新注册全局快捷键
    menuWindow.on('hide', () => {
        myShortcutKey.registerAllShortcuts();
        // 不再强制 focus 主窗口，避免切换桌面
    });
}

// 监听菜单窗口调整大小的请求
ipcMain.on('resize-menu', (event, { width, height }) => {
    if (menuWindow && !menuWindow.isDestroyed()) {
        menuWindow.setSize(width, height);
    }
});

// 监听关闭菜单的请求（模块级注册，避免重复注册）
ipcMain.on('close-menu', () => {
    if (menuWindow && !menuWindow.isDestroyed()) {
        menuWindow.hide();
    }
});

// 监听获取菜单窗口焦点的请求
ipcMain.on('focus-menu-window', () => {
    if (menuWindow && !menuWindow.isDestroyed() && menuWindow.isVisible()) {
        menuWindow.focus();
    }
});

// 清除网页缓存（保留 cookie）
async function clearWebViewCache() {
    if (webView && !webView.webContents.isDestroyed()) {
        const ses = webView.webContents.session;
        await ses.clearCache();
        console.log('缓存已清除');
    }
}

ipcMain.on('clear-cache', clearWebViewCache);

// 监听渲染进程发送的事件，加载指定网址(index.html 中的搜索按钮传来的地址)
ipcMain.on("load-url", (event, url) => {
    if (webView && !webView.webContents.isDestroyed()) {
        try {
            const parsed = new URL(url);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                webView.webContents.loadURL(url);
            }
        } catch (e) {
            try {
                const parsed = new URL('https://' + url);
                webView.webContents.loadURL(parsed.href);
            } catch (e2) {
                console.error('无效的 URL:', url);
            }
        }
    }
});

// 监听来自菜单窗口的操作（模块级注册，避免重复注册）
ipcMain.on('menu-action', (event, action, data) => {
    switch(action) {
        case 'forward':
            if (currentView === 'web' && webView && !webView.webContents.isDestroyed() && webView.webContents.canGoForward()) {
                webView.webContents.goForward();
            }
            break;
        case 'backward':
            if (currentView === 'web' && webView && !webView.webContents.isDestroyed() && webView.webContents.canGoBack()) {
                webView.webContents.goBack();
            }
            break;
        case 'go-to-player':
            if (mainWindow && !mainWindow.isDestroyed() && currentView !== 'player') {
                if (!playerView) {
                    playerView = new BrowserView({
                        webPreferences: {
                            nodeIntegration: false,
                            contextIsolation: true,
                            preload: path.join(__dirname, 'preload.js')
                        }
                    });
                    playerView.webContents.loadFile(path.join(__dirname, "player.html"));
                    playerView.webContents.on('did-finish-load', () => {
                        if (mainWindow.isAlwaysOnTop()) {
                            mainWindow.setVisibleOnAllWorkspaces(true);
                        } else {
                            mainWindow.setVisibleOnAllWorkspaces(false, { skipTransformProcessType: true });
                        }
                    });
                }
                mainWindow.setBrowserView(playerView);
                playerView.setBounds({ x: 0, y: 0, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height });
                currentView = 'player';
                mainWindow.show();
            }
            break;
        case 'go-to-home':
            if (mainWindow && !mainWindow.isDestroyed() && currentView !== 'web') {
                mainWindow.setBrowserView(webView);
                webView.setBounds({ x: 0, y: 0, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height });
                currentView = 'web';
                mainWindow.show();
            }
            break;
        case 'toggle-ignore-mouse':
            myShortcutKey.setIgnoreMouseEventsState(data);
            if (mainWindow && !mainWindow.isDestroyed()) {
                if (data) {
                    mainWindow.setIgnoreMouseEvents(true, { forward: true });
                } else {
                    mainWindow.setIgnoreMouseEvents(false);
                }
            }
            if (menuWindow && !menuWindow.isDestroyed()) {
                menuWindow.webContents.send('update-ignore-mouse-state', data);
            }
            break;
        case 'set-opacity': {
            if (!mainWindow || mainWindow.isDestroyed()) break;
            const opacity = Math.max(0.025, Math.min(1, data));
            mainWindow.setOpacity(opacity);
            myShortcutKey.setCurrentOpacity(opacity);
            break;
        }
        case 'toggle-pin':
            if (!mainWindow || mainWindow.isDestroyed()) break;
            const isOnTop = mainWindow.isAlwaysOnTop();
            if (isOnTop) {
                mainWindow.setAlwaysOnTop(false);
                mainWindow.setVisibleOnAllWorkspaces(false, { skipTransformProcessType: true });
            } else {
                mainWindow.setAlwaysOnTop(true, "screen-saver");
                mainWindow.setVisibleOnAllWorkspaces(true);
            }
            break;
            case 'quit':
                app.quit();
                break;
            case 'boss-key':
                handleBossKey();
                if (menuWindow && !menuWindow.isDestroyed()) {
                    menuWindow.focus();
                }
                break;
            case 'quick-hide':
                handleQuickHide();
                break;
            case 'fake-wallpaper':
                handleFakeWallpaper();
                if (menuWindow && !menuWindow.isDestroyed()) {
                    menuWindow.focus();
                }
                break;
            case 'toggle-fullscreen':
                handleToggleFullscreen();
                break;
    }
});

// 监听快捷键发送的前进/后退消息
// 前进处理函数
function handleForward() {
    // 只在网页视图生效，播放器不受限制
    if (currentView !== 'web') return;
    if (webView && !webView.webContents.isDestroyed() && webView.webContents.canGoForward()) {
        webView.webContents.goForward();
    }
}

// 后退处理函数
function handleBackward() {
    // 只在网页视图生效，播放器不受限制
    if (currentView !== 'web') return;
    if (webView && !webView.webContents.isDestroyed() && webView.webContents.canGoBack()) {
        webView.webContents.goBack();
    }
}

function handleBossKey() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (currentView === 'fake') {
        const prevView = viewBeforeBoss || 'web';
        if (prevView === 'web' && webView) {
            mainWindow.setBrowserView(webView);
            webView.setBounds({ x: 0, y: 0, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height });
        } else if (prevView === 'player' && playerView) {
            mainWindow.setBrowserView(playerView);
            playerView.setBounds({ x: 0, y: 0, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height });
        }
        currentView = prevView;
        mainWindow.show();
        // 更新菜单状态
        if (menuWindow && !menuWindow.isDestroyed()) {
            menuWindow.webContents.send('update-boss-key-state', false);
        }
    } else {
        viewBeforeBoss = currentView;
        if (!fakeView) {
            fakeView = new BrowserView({
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    preload: path.join(__dirname, 'preload.js')
                }
            });
            fakeView.webContents.loadFile(path.join(__dirname, "fakeScreen.html"));
        }
        mainWindow.setBrowserView(fakeView);
        fakeView.setBounds({ x: 0, y: 0, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height });
        currentView = 'fake';
        mainWindow.show();
        // 更新菜单状态
        if (menuWindow && !menuWindow.isDestroyed()) {
            menuWindow.webContents.send('update-boss-key-state', true);
        }
    }
}

function handleQuickHide() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isVisible()) {
        mainWindow.hide();
    } else {
        mainWindow.show();
        mainWindow.focus();
    }
}

async function handleFakeWallpaper() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (currentView !== 'web' || !webView) return;
    if (isFakeWallpaper) {
        isFakeWallpaper = false;
        mainWindow.setBrowserView(webView);
        webView.setBounds({ x: 0, y: 0, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height });
        mainWindow.show();
        // 更新菜单状态
        if (menuWindow && !menuWindow.isDestroyed()) {
            menuWindow.webContents.send('update-fake-wallpaper-state', false);
        }
        return;
    }
    try {
        const bounds = mainWindow.getBounds();
        const display = screen.getDisplayMatching(bounds);
        const scaleFactor = display.scaleFactor;
        mainWindow.hide();
        await new Promise(r => setTimeout(r, 100));
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: display.size.width * scaleFactor, height: display.size.height * scaleFactor }
        });
        if (sources.length === 0) { mainWindow.show(); return; }
        const fullImage = sources[0].thumbnail;
        const relX = bounds.x - display.bounds.x;
        const relY = bounds.y - display.bounds.y;
        const cropped = fullImage.crop({
            x: Math.round(relX * scaleFactor),
            y: Math.round(relY * scaleFactor),
            width: Math.round(bounds.width * scaleFactor),
            height: Math.round(bounds.height * scaleFactor)
        });
        const croppedDataUrl = cropped.toDataURL();
        isFakeWallpaper = true;
        // 更新菜单状态
        if (menuWindow && !menuWindow.isDestroyed()) {
            menuWindow.webContents.send('update-fake-wallpaper-state', true);
        }
        if (!fakeWallpaperView) {
            fakeWallpaperView = new BrowserView({
                webPreferences: { nodeIntegration: false, contextIsolation: true }
            });
        }
        const bgHtml = '<!DOCTYPE html><html><head><style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden}body{background:url(' + croppedDataUrl + ') center/cover no-repeat}</style></head><body></body></html>';
        fakeWallpaperView.webContents.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(bgHtml));
        mainWindow.setBrowserView(fakeWallpaperView);
        fakeWallpaperView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
        mainWindow.show();
    } catch (err) {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
        console.error('截取桌面失败:', err);
    }
}

let isPseudoFullscreen = false;
let preFullscreenBounds = null;

function handleToggleFullscreen() {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    const display = screen.getDisplayMatching(mainWindow.getBounds());
    const workArea = display.workArea;

    if (isPseudoFullscreen) {
        // 当前是全屏，退出全屏
        if (preFullscreenBounds) {
            mainWindow.setBounds(preFullscreenBounds);
        } else {
            mainWindow.setBounds({
                x: workArea.x + 100,
                y: workArea.y + 100,
                width: 500,
                height: 380
            });
        }
        preFullscreenBounds = null;
        isPseudoFullscreen = false;
    } else {
        // 当前不是全屏，进入全屏
        preFullscreenBounds = mainWindow.getBounds();
        mainWindow.setPosition(workArea.x, workArea.y);
        mainWindow.setSize(workArea.width, workArea.height);
        isPseudoFullscreen = true;
    }

    // 同步状态到菜单窗口
    if (menuWindow && !menuWindow.isDestroyed()) {
        menuWindow.webContents.send('update-fullscreen-state', isPseudoFullscreen);
    }
}

function createTray() {
    // 从文件加载图标，使用64x64的图标
    const iconPath = path.join(__dirname, 'tray-icon.png');
    const trayIcon = nativeImage.createFromPath(iconPath);

    tray = new Tray(trayIcon);
    tray.setToolTip('透明浏览器控制菜单');

    // 点击托盘图标时切换菜单窗口的显示/隐藏（不影响主窗口状态）
    tray.on('click', (event, bounds) => {
        if (menuWindow.isVisible()) {
            menuWindow.hide();
        } else {
            const x = bounds.x + bounds.width / 2 - 140;
            const y = bounds.y + bounds.height + 5;
            menuWindow.setPosition(Math.round(x), Math.max(0, Math.round(y - 140)));

            // 先显示窗口，再设置可见性
            menuWindow.showInactive();
            menuWindow.setAlwaysOnTop(true, 'screen-saver');
            menuWindow.setVisibleOnAllWorkspaces(true, { skipTransformProcessType: true });

            if (mainWindow && !mainWindow.isDestroyed()) {
                const currentOpacity = mainWindow.getOpacity();
                myShortcutKey.setCurrentOpacity(currentOpacity);
                menuWindow.webContents.send('update-opacity', currentOpacity);

                const ignoreMouseState = myShortcutKey.getIgnoreMouseEventsState();
                menuWindow.webContents.send('update-ignore-mouse-state', ignoreMouseState);
                menuWindow.webContents.executeJavaScript(`
                    if (typeof ignoreMouseEvents !== 'undefined') {
                        ignoreMouseEvents = ${ignoreMouseState};
                    }
                `);

                menuWindow.webContents.send('update-pin-state', mainWindow.isAlwaysOnTop());
            }
        }
    });

}


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 500,
        height: 380,
        title: '',
        alwaysOnTop: true,
        backgroundColor: '#000000',
        icon: path.join(__dirname, 'icon.icns'),
        fullscreenable: false,  // 禁止系统全屏
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // 阻止进入全屏
    mainWindow.on('enter-html-full-screen', (e) => {
        e.preventDefault();
    });

    webView = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            zoomFactor: 1.0
        }
    });
    webView.webContents.loadFile(path.join(__dirname, "index.html"));

    // 启用触控板捏合缩放
    webView.webContents.setVisualZoomLevelLimits(1, 5);

    // 每次导航完成后重新启用捏合缩放
    webView.webContents.on('did-navigate', () => {
        webView.webContents.setVisualZoomLevelLimits(1, 5);
    });

    webView.webContents.on('did-navigate-in-page', () => {
        webView.webContents.setVisualZoomLevelLimits(1, 5);
    });

    // 阻止 webView 中的视频全屏触发系统全屏
    webView.webContents.on('enter-html-full-screen', (e) => {
        e.preventDefault();
    });

    // 播放器视图在首次使用时才创建，避免启动时弹出提示
    playerView = null;

    // 初始显示网页视图
    mainWindow.setBrowserView(webView);
    // 设置 BrowserView 的大小
    webView.setBounds({ x: 0, y: 0, width: 500, height: 380 });

    //设置页面的初始化透明度
    mainWindow.setOpacity(0.3);

    mainWindow.setAlwaysOnTop(true, "screen-saver");
    // 设置窗口在所有工作区都可见
    mainWindow.setVisibleOnAllWorkspaces(true);

    // 为主窗口添加右键菜单
    mainWindow.webContents.on('context-menu', (event, params) => {
        const contextMenuTemplate = [
            {
                label: '忽略鼠标事件',
                type: 'checkbox',
                checked: myShortcutKey.getIgnoreMouseEventsState(),
                click: () => {
                    // 切换状态
                    const newState = !myShortcutKey.getIgnoreMouseEventsState();
                    myShortcutKey.setIgnoreMouseEventsState(newState);
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        if (newState) {
                            mainWindow.setIgnoreMouseEvents(true, { forward: true });
                        } else {
                            mainWindow.setIgnoreMouseEvents(false);
                        }
                    }
                    // 同步到菜单窗口
                    if (menuWindow && menuWindow.isVisible()) {
                        menuWindow.webContents.send('update-ignore-mouse-state', newState);
                    }
                }
            },
            { type: 'separator' },
            {
                label: '退出',
                click: () => {
                    app.quit();
                }
            }
        ];

        const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
        contextMenu.popup({ window: mainWindow, x: params.x, y: params.y });
    });

    // 创建自定义菜单窗口
    createMenuWindow();

    // 将菜单窗口引用传递给快捷键模块
    myShortcutKey.setMenuWindow(menuWindow);

    // 创建系统托盘菜单
    createTray();

    //阻止网页视图中的链接跳转，直接在本页面展示
    webView.webContents.setWindowOpenHandler(details => {
        webView.webContents.loadURL(details.url);
        return { action: 'deny' };
    });

    // 监听网页视图的加载完成
    webView.webContents.on('did-finish-load', () => {
        webView.webContents.setVisualZoomLevelLimits(1, 5);
        if (mainWindow.isAlwaysOnTop()) {
            mainWindow.setVisibleOnAllWorkspaces(true);
        } else {
            mainWindow.setVisibleOnAllWorkspaces(false, { skipTransformProcessType: true });
        }
    });
    // 监听窗口大小变化事件
    mainWindow.on("resize", () => {
        try {
            // 获取当前窗口的尺寸
            const {width, height} = mainWindow.getBounds();

            // 检测是否处于全屏状态（使用 workArea，排除菜单栏）
            const display = screen.getDisplayMatching(mainWindow.getBounds());
            const workArea = display.workArea;
            const isNowFullscreen = (
                width >= workArea.width - 5 &&
                height >= workArea.height - 5 &&
                Math.abs(mainWindow.getBounds().x - workArea.x) < 10 &&
                Math.abs(mainWindow.getBounds().y - workArea.y) < 10
            );

            // 如果全屏状态发生变化，同步到菜单
            if (isNowFullscreen !== isPseudoFullscreen) {
                // 进入全屏时，保存当前窗口大小（用于退出时恢复）
                if (isNowFullscreen && !preFullscreenBounds) {
                    preFullscreenBounds = { x: workArea.x + 100, y: workArea.y + 100, width: 500, height: 380 };
                }
                isPseudoFullscreen = isNowFullscreen;
                if (menuWindow && !menuWindow.isDestroyed()) {
                    menuWindow.webContents.send('update-fullscreen-state', isPseudoFullscreen);
                }
            }

            // 调整当前显示的 BrowserView 大小
            if (isFakeWallpaper && fakeWallpaperView && !fakeWallpaperView.webContents.isDestroyed()) {
                fakeWallpaperView.setBounds({ x: 0, y: 0, width, height });
            } else if (currentView === 'web' && webView && !webView.webContents.isDestroyed()) {
                webView.setBounds({ x: 0, y: 0, width, height });
                webView.webContents.send("resize", {width, height});
            } else if (currentView === 'player' && playerView && !playerView.webContents.isDestroyed()) {
                playerView.setBounds({ x: 0, y: 0, width, height });
                playerView.webContents.send("resize", {width, height});
            } else if (currentView === 'fake' && fakeView && !fakeView.webContents.isDestroyed()) {
                fakeView.setBounds({ x: 0, y: 0, width, height });
            }
        } catch (error) {
            console.error('调整窗口大小时出错:', error);
        }
    });

    // 监听窗口移动事件（macOS 双击标题栏会触发）
    mainWindow.on("moved", () => {
        try {
            const {width, height} = mainWindow.getBounds();
            const display = screen.getDisplayMatching(mainWindow.getBounds());
            const workArea = display.workArea;
            const isNowFullscreen = (
                width >= workArea.width - 5 &&
                height >= workArea.height - 5 &&
                Math.abs(mainWindow.getBounds().x - workArea.x) < 10 &&
                Math.abs(mainWindow.getBounds().y - workArea.y) < 10
            );

            if (isNowFullscreen !== isPseudoFullscreen) {
                if (isNowFullscreen && !preFullscreenBounds) {
                    preFullscreenBounds = { x: workArea.x + 100, y: workArea.y + 100, width: 500, height: 380 };
                }
                isPseudoFullscreen = isNowFullscreen;
                if (menuWindow && !menuWindow.isDestroyed()) {
                    menuWindow.webContents.send('update-fullscreen-state', isPseudoFullscreen);
                }
            }
        } catch (error) {
            // ignore
        }
    });

    // 注册快捷键模块（但不立即注册快捷键，等待窗口获得焦点）
    myShortcutKey.registerShortcut(mainWindow, handleForward, handleBackward);
    myShortcutKey.setBossKeyHandler(handleBossKey);
    myShortcutKey.setQuickHideHandler(handleQuickHide);

    // 监听窗口获得焦点事件，注册快捷键
    mainWindow.on('focus', () => {
        myShortcutKey.registerAllShortcuts();
    });

    // 监听窗口失去焦点事件，注销快捷键
    mainWindow.on('blur', () => {
        // 窗口不可见时（被 macOS 隐藏）保持快捷键注册，只在窗口可见但失焦时注销
        if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
            myShortcutKey.registerAllShortcuts();
            return;
        }
        myShortcutKey.unregisterAllShortcuts();
    });


    mainWindow.on("closed", () => {
        // 清理BrowserView
        if (webView) {
            if (!webView.webContents.isDestroyed()) {
                webView.webContents.destroy();
            }
            webView = null;
        }
        if (playerView) {
            if (!playerView.webContents.isDestroyed()) {
                playerView.webContents.destroy();
            }
            playerView = null;
        }
        if (fakeView) {
            if (!fakeView.webContents.isDestroyed()) {
                fakeView.webContents.destroy();
            }
            fakeView = null;
        }
        if (fakeWallpaperView) {
            if (!fakeWallpaperView.webContents.isDestroyed()) {
                fakeWallpaperView.webContents.destroy();
            }
            fakeWallpaperView = null;
        }
        mainWindow = null;
        app.quit();
    });
}

app.on("ready", () => {
    createWindow();
    myShortcutKey.registerPermanentShortcuts();
    startCookieServer(9876, () => webView ? webView.webContents.session : null, clearWebViewCache);
})

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
    // macOS 激活应用时重新注册快捷键（确保鼠标隐藏/显示应用后快捷键仍可用）
    myShortcutKey.registerAllShortcuts();
});

app.on("window-all-closed", () => {
    // 解除注册的快捷键
    myShortcutKey.unregisterShortcutAll();
    if (process.platform !== "darwin") {
        app.quit();
    }
});

// 在应用退出时解除注册的快捷键
app.on("will-quit", () => {
    // 解除注册的快捷键
    myShortcutKey.unregisterShortcutAll();
});
