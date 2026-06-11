const {app, BrowserWindow, ipcMain, BrowserView, Tray, Menu, nativeImage} = require("electron");

//引入其他 自定义 js 文件
const myShortcutKey = require("./shortcutKeys");
const path = require("path");

let mainWindow;
let menuWindow;
let tray;
let currentView = 'web'; // 当前显示的视图
let webView; // 网页视图
let playerView; // 播放器视图

const is_mac = process.platform==='darwin'
if(is_mac) {
    app.dock.hide()
}

function createMenuWindow() {
    menuWindow = new BrowserWindow({
        width: 280,
        height: 420,
        show: false,
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        visibleOnAllWorkspaces: true,
        acceptFirstMouse: true, // 允许第一次点击就生效
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
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
                background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
                color: #667eea;
            }
            .menu-item:active {
                background: linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
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
                background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent);
                margin: 6px 12px;
            }
            .checkbox-container {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .checkbox {
                width: 18px;
                height: 18px;
                border: 2px solid #cbd5e0;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            .checkbox.checked {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-color: #667eea;
            }
            .checkbox.checked::after {
                content: '✓';
                color: white;
                font-size: 13px;
                font-weight: bold;
            }
            .danger {
                color: #fc8181 !important;
            }
            .danger:hover {
                background: linear-gradient(90deg, rgba(252, 129, 129, 0.1) 0%, rgba(245, 101, 101, 0.1) 100%) !important;
                color: #e53e3e !important;
            }
            .control-buttons {
                display: flex;
                gap: 8px;
            }
            .control-btn {
                width: 28px;
                height: 28px;
                border: none;
                border-radius: 6px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
            }
            .control-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
            }
            .control-btn:active {
                transform: scale(0.95);
            }
            .nav-item {
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
                border: 1px solid rgba(102, 126, 234, 0.2);
                border-radius: 8px;
                margin: 0 8px;
                padding: 10px 14px;
                transition: all 0.2s ease;
            }
            .nav-item:hover {
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
                border-color: rgba(102, 126, 234, 0.4);
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
            }
            .nav-controls {
                display: flex;
                gap: 6px;
                justify-content: center;
                align-items: center;
                padding: 10px 12px;
                margin: 0 8px;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
                border-radius: 8px;
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
                padding: 8px 8px;
                border: none;
                border-radius: 6px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(102, 126, 234, 0.25);
                white-space: nowrap;
                text-align: center;
                line-height: 1.2;
            }
            .nav-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(102, 126, 234, 0.35);
            }
            .nav-btn:active {
                transform: translateY(0);
            }
        </style>
    </head>
    <body>
        <div class="nav-controls">
            <button class="nav-btn" data-action="backward">⬅️ 后退 (⌘←)</button>
            <button class="nav-btn" data-action="forward">➡️ 前进 (⌘→)</button>
        </div>
        <div style="text-align: center; font-size: 10px; color: #999; margin: -8px 0 8px 0;">*仅在网页视图生效</div>

        <div class="menu-separator"></div>

        <div class="menu-item nav-item" data-action="go-to-player">
            <div class="menu-item-left">
                <span class="menu-item-icon">🎬</span>
                <span class="menu-item-label">前往播放器</span>
            </div>
            <span class="menu-item-value">播放视频</span>
        </div>

        <div class="menu-item nav-item" data-action="go-to-home">
            <div class="menu-item-left">
                <span class="menu-item-icon">🌐</span>
                <span class="menu-item-label">网页浏览</span>
            </div>
            <span class="menu-item-value">浏览网页</span>
        </div>

        <div class="menu-separator"></div>

        <div class="menu-item" data-action="toggle-ignore-mouse">
            <div class="checkbox-container">
                <div class="checkbox" id="ignoreMouseCheckbox"></div>
                <span class="menu-item-label">忽略鼠标事件</span>
            </div>
            <span class="menu-item-shortcut">⌘D</span>
        </div>

        <div class="menu-separator"></div>

        <div class="menu-item">
            <div class="menu-item-left">
                <span class="menu-item-icon">🎨</span>
                <span class="menu-item-label">透明度</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="menu-item-value" id="opacityValue">30%</span>
                <div class="control-buttons">
                    <button class="control-btn" data-action="decrease-opacity">−</button>
                    <button class="control-btn" data-action="increase-opacity">+</button>
                </div>
                <span class="menu-item-shortcut">[-] [+]</span>
            </div>
        </div>

        <div class="menu-separator"></div>

        <div class="menu-item" data-action="toggle-pin">
            <div class="checkbox-container">
                <div class="checkbox checked" id="pinCheckbox"></div>
                <span class="menu-item-label">固定窗口</span>
            </div>
            <span class="menu-item-shortcut">⌘F</span>
        </div>

        <div class="menu-separator"></div>

        <div class="menu-item danger" data-action="quit">
            <div class="menu-item-left">
                <span class="menu-item-icon">❌</span>
                <span class="menu-item-label">退出</span>
            </div>
        </div>
        <script>
            const {ipcRenderer} = require('electron');
            let ignoreMouseEvents = false;
            let isPinned = true;
            let currentOpacity = 0.3;

            // 更新透明度显示
            function updateOpacityDisplay(value) {
                const percentage = Math.round(value * 100);
                document.getElementById('opacityValue').textContent = percentage + '%';
            }

            // 监听透明度更新
            ipcRenderer.on('update-opacity', (event, value) => {
                currentOpacity = value;
                updateOpacityDisplay(value);
            });

            // 监听忽略鼠标事件状态更新
            ipcRenderer.on('update-ignore-mouse-state', (event, state) => {
                ignoreMouseEvents = state;
                const checkbox = document.getElementById('ignoreMouseCheckbox');
                if (ignoreMouseEvents) {
                    checkbox.classList.add('checked');
                } else {
                    checkbox.classList.remove('checked');
                }
            });

            // 监听固定窗口状态更新
            ipcRenderer.on('update-pin-state', (event, state) => {
                isPinned = state;
                const pinCheckbox = document.getElementById('pinCheckbox');
                if (isPinned) {
                    pinCheckbox.classList.add('checked');
                } else {
                    pinCheckbox.classList.remove('checked');
                }
            });

            document.querySelectorAll('.menu-item, .control-btn, .nav-btn').forEach(item => {
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
                        case 'toggle-ignore-mouse':
                            ignoreMouseEvents = !ignoreMouseEvents;
                            const checkbox = document.getElementById('ignoreMouseCheckbox');
                            if (ignoreMouseEvents) {
                                checkbox.classList.add('checked');
                            } else {
                                checkbox.classList.remove('checked');
                            }
                            ipcRenderer.send('menu-action', 'toggle-ignore-mouse', ignoreMouseEvents);
                            break;
                        case 'increase-opacity':
                            ipcRenderer.send('menu-action', 'increase-opacity');
                            break;
                        case 'decrease-opacity':
                            ipcRenderer.send('menu-action', 'decrease-opacity');
                            break;
                        case 'toggle-pin':
                            isPinned = !isPinned;
                            const pinCheckbox = document.getElementById('pinCheckbox');
                            if (isPinned) {
                                pinCheckbox.classList.add('checked');
                            } else {
                                pinCheckbox.classList.remove('checked');
                            }
                            ipcRenderer.send('menu-action', 'toggle-pin', isPinned);
                            break;
                        case 'quit':
                            ipcRenderer.send('menu-action', 'quit');
                            break;
                    }
                });
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
            // 确保共享变量是最新的
            const currentOpacity = mainWindow.getOpacity();
            myShortcutKey.setCurrentOpacity(currentOpacity);
            menuWindow.webContents.send('update-opacity', currentOpacity);

            // 同步忽略鼠标事件状态
            const ignoreMouseState = myShortcutKey.getIgnoreMouseEventsState();
            menuWindow.webContents.send('update-ignore-mouse-state', ignoreMouseState);
            // 更新菜单中的初始状态
            menuWindow.webContents.executeJavaScript(`
                if (typeof ignoreMouseEvents !== 'undefined') {
                    ignoreMouseEvents = ${ignoreMouseState};
                    const checkbox = document.getElementById('ignoreMouseCheckbox');
                    if (${ignoreMouseState}) {
                        checkbox.classList.add('checked');
                    } else {
                        checkbox.classList.remove('checked');
                    }
                }
            `);

            // 同步固定窗口状态
            menuWindow.webContents.send('update-pin-state', mainWindow.isAlwaysOnTop());
        }
    });

    // 监听菜单窗口隐藏事件，重新注册全局快捷键
    menuWindow.on('hide', () => {
        myShortcutKey.registerAllShortcuts();
    });

    // 监听关闭菜单的请求
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
}

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

function createTray() {
    // 从文件加载图标，使用64x64的图标
    const iconPath = path.join(__dirname, 'cat-fish.png');
    const trayIcon = nativeImage.createFromPath(iconPath);

    tray = new Tray(trayIcon);
    tray.setToolTip('透明浏览器控制菜单');

    // 点击托盘图标时切换菜单窗口的显示/隐藏
    tray.on('click', (event, bounds) => {
        if (menuWindow.isVisible()) {
            menuWindow.hide();
        } else {
            // 记录 mainWindow 在操作前的可见状态
            const wasMainWindowHidden = mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible();

            // 在托盘图标附近显示菜单窗口
            const x = bounds.x + bounds.width / 2 - 140;
            const y = bounds.y + bounds.height + 5;
            menuWindow.setPosition(Math.round(x), Math.round(y));

            // 确保窗口在所有桌面都可见且在最前面
            menuWindow.setVisibleOnAllWorkspaces(true);
            menuWindow.setAlwaysOnTop(true, 'screen-saver');

            // 显示窗口并获取焦点，让ESC键能工作
            menuWindow.show();
            menuWindow.focus();

            // 如果 mainWindow 之前是隐藏的，macOS 激活应用时可能把它显示了，恢复隐藏状态
            if (wasMainWindowHidden && mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.hide();
            }

            // 发送当前的透明度值（使用共享变量）
            if (mainWindow && menuWindow) {
                // 确保共享变量是最新的
                const currentOpacity = mainWindow.getOpacity();
                myShortcutKey.setCurrentOpacity(currentOpacity);
                menuWindow.webContents.send('update-opacity', currentOpacity);

                // 同步忽略鼠标事件状态
                const ignoreMouseState = myShortcutKey.getIgnoreMouseEventsState();
                menuWindow.webContents.send('update-ignore-mouse-state', ignoreMouseState);
                // 更新菜单中的初始状态
                menuWindow.webContents.executeJavaScript(`
                    if (typeof ignoreMouseEvents !== 'undefined') {
                        ignoreMouseEvents = ${ignoreMouseState};
                    }
                `);

                // 同步固定窗口状态
                menuWindow.webContents.send('update-pin-state', mainWindow.isAlwaysOnTop());
            }
        }
    });

    // 监听来自菜单窗口的操作
    ipcMain.on('menu-action', (event, action, data) => {
        switch(action) {
            case 'forward':
                // 前进 - 只在网页视图生效
                if (currentView === 'web' && webView && !webView.webContents.isDestroyed() && webView.webContents.canGoForward()) {
                    webView.webContents.goForward();
                }
                break;
            case 'backward':
                // 后退 - 只在网页视图生效
                if (currentView === 'web' && webView && !webView.webContents.isDestroyed() && webView.webContents.canGoBack()) {
                    webView.webContents.goBack();
                }
                break;
            case 'go-to-player':
                // 切换到播放器
                if (mainWindow && !mainWindow.isDestroyed() && currentView !== 'player') {
                    // 如果播放器视图还未创建，则创建它
                    if (!playerView) {
                        playerView = new BrowserView({
                            webPreferences: {
                                nodeIntegration: true,
                                contextIsolation: false,
                                enableRemoteModule: true
                            }
                        });
                        playerView.webContents.loadFile(path.join(__dirname, "player.html"));

                        // 监听播放器视图的加载完成
                        playerView.webContents.on('did-finish-load', () => {
                            if (mainWindow.isAlwaysOnTop()) {
                                mainWindow.setVisibleOnAllWorkspaces(true);
                            } else {
                                mainWindow.setVisibleOnAllWorkspaces(false);
                            }
                        });
                    }
                    mainWindow.setBrowserView(playerView);
                    playerView.setBounds({ x: 0, y: 0, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height });
                    currentView = 'player';
                }
                break;
            case 'go-to-home':
                // 切换到网页
                if (mainWindow && !mainWindow.isDestroyed() && currentView !== 'web') {
                    mainWindow.setBrowserView(webView);
                    webView.setBounds({ x: 0, y: 0, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height });
                    currentView = 'web';
                }
                break;
            case 'toggle-ignore-mouse':
                // 更新快捷键模块中的状态
                myShortcutKey.setIgnoreMouseEventsState(data);
                // 根据新状态设置窗口行为
                if (mainWindow && !mainWindow.isDestroyed()) {
                    if (data) {
                        // 忽略整个窗口的鼠标事件，但允许点击穿透到下面的窗口
                        mainWindow.setIgnoreMouseEvents(true, { forward: true });
                    } else {
                        // 不忽略鼠标事件
                        mainWindow.setIgnoreMouseEvents(false);
                    }
                }
                // 发送状态更新到菜单窗口（同步所有显示）
                if (menuWindow && !menuWindow.isDestroyed()) {
                    menuWindow.webContents.send('update-ignore-mouse-state', data);
                }
                // 保持菜单窗口焦点
                if (menuWindow && !menuWindow.isDestroyed()) {
                    menuWindow.focus();
                }
                break;
            case 'increase-opacity': {
                if (!mainWindow || mainWindow.isDestroyed()) break;
                let opacity = mainWindow.getOpacity();
                opacity += 0.025;
                if (opacity > 1) opacity = 1;
                mainWindow.setOpacity(opacity);
                // 更新快捷键模块中的共享变量
                myShortcutKey.setCurrentOpacity(opacity);
                // 向菜单窗口发送更新
                if (menuWindow) {
                    menuWindow.webContents.send('update-opacity', opacity);
                }
                // 保持菜单窗口焦点
                if (menuWindow && !menuWindow.isDestroyed()) {
                    menuWindow.focus();
                }
                break;
            }
            case 'decrease-opacity': {
                if (!mainWindow || mainWindow.isDestroyed()) break;
                let opacity = mainWindow.getOpacity();
                opacity -= 0.025;
                if (opacity < 0.025) opacity = 0.025;
                mainWindow.setOpacity(opacity);
                // 更新快捷键模块中的共享变量
                myShortcutKey.setCurrentOpacity(opacity);
                // 向菜单窗口发送更新
                if (menuWindow) {
                    menuWindow.webContents.send('update-opacity', opacity);
                }
                // 保持菜单窗口焦点
                if (menuWindow && !menuWindow.isDestroyed()) {
                    menuWindow.focus();
                }
                break;
            }
            case 'toggle-pin':
                if (!mainWindow || mainWindow.isDestroyed()) break;
                const isOnTop = mainWindow.isAlwaysOnTop();
                if (isOnTop) {
                    mainWindow.setAlwaysOnTop(false);
                    mainWindow.setVisibleOnAllWorkspaces(false);
                } else {
                    mainWindow.setAlwaysOnTop(true, "screen-saver");
                    mainWindow.setVisibleOnAllWorkspaces(true);
                }
                // 保持菜单窗口焦点
                if (menuWindow && !menuWindow.isDestroyed()) {
                    menuWindow.focus();
                }
                break;
            case 'quit':
                app.quit();
                break;
        }
    });

}


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 500,
        height: 380,
        alwaysOnTop: true,
        backgroundColor: '#000000', // 设置背景颜色为黑色
        icon: path.join(__dirname, 'cat-fish.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    // 创建网页视图
    webView = new BrowserView({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            zoomFactor: 1.0
        }
    });
    webView.webContents.loadFile(path.join(__dirname, "index.html"));

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

    // 监听渲染进程发送的事件，加载指定网址(index.html 中的搜索按钮传来的地址)
    ipcMain.on("load-url", (event, url) => {
        if (webView && !webView.webContents.isDestroyed()) {
            webView.webContents.loadURL(url);
        }
    })

    //阻止网页视图中的链接跳转，直接在本页面展示
    webView.webContents.setWindowOpenHandler(details => {
        webView.webContents.loadURL(details.url);
        return { action: 'deny' };
    });

    // 监听网页视图的加载完成
    webView.webContents.on('did-finish-load', () => {
        if (mainWindow.isAlwaysOnTop()) {
            mainWindow.setVisibleOnAllWorkspaces(true);
        } else {
            mainWindow.setVisibleOnAllWorkspaces(false);
        }
    });
    // 监听窗口大小变化事件
    mainWindow.on("resize", () => {
        try {
            // 获取当前窗口的尺寸
            const {width, height} = mainWindow.getBounds();

            // 调整当前显示的 BrowserView 大小
            if (currentView === 'web' && webView && !webView.webContents.isDestroyed()) {
                webView.setBounds({ x: 0, y: 0, width, height });
                webView.webContents.send("resize", {width, height});
            } else if (currentView === 'player' && playerView && !playerView.webContents.isDestroyed()) {
                playerView.setBounds({ x: 0, y: 0, width, height });
                playerView.webContents.send("resize", {width, height});
            }
        } catch (error) {
            console.error('调整窗口大小时出错:', error);
        }
    });

    // 注册快捷键模块（但不立即注册快捷键，等待窗口获得焦点）
    myShortcutKey.registerShortcut(mainWindow, handleForward, handleBackward);

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
        mainWindow = null;
    });
}

app.on("ready", () => {
    createWindow();
    // 再次确保 dock 图标隐藏（创建窗口后 macOS 可能会重新显示 dock 图标）
    if (is_mac) {
        app.dock.hide();
    }
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
