const {globalShortcut, ipcMain} = require("electron");

let ignoreMouseEvents = false;
let currentOpacity = 0.3; // 共享的透明度变量
let menuWindow = null; // 菜单窗口的引用
let mainWindow = null; // 保存主窗口引用
let forwardHandler = null; // 前进处理器
let backwardHandler = null; // 后退处理器
let bossKeyHandler = null; // 老板键处理器
let quickHideHandler = null; // 快速隐藏处理器

// 设置菜单窗口引用（供 main.js 调用）
function setMenuWindow(win) {
    menuWindow = win;
}

function registerShortcut(mainWin, forwardHandlerFunc, backwardHandlerFunc) {
    mainWindow = mainWin;
    forwardHandler = forwardHandlerFunc;
    backwardHandler = backwardHandlerFunc;
    // 初始不注册快捷键，等待窗口获得焦点时才注册
}

// 注册所有快捷键（内部使用）
function registerAllShortcuts() {
    // 注册前进快捷键
    globalShortcut.register("CommandOrControl+Right", () => {
        if (typeof forwardHandler === 'function') {
            forwardHandler();
        }
    });

    // 注册后退快捷键
    globalShortcut.register("CommandOrControl+Left", () => {
        if (typeof backwardHandler === 'function') {
            backwardHandler();
        }
    });

    //注册 减少透明度快捷键
    globalShortcut.register("CommandOrControl+-", () => {
        decrOpacity()
    });

    //注册 增加透明度快捷键
    globalShortcut.register("CommandOrControl+=", () => {
        incrOpacity()
    });

  /*  //注册 固定窗口快捷键
    globalShortcut.register("CommandOrControl+F", () => {
        toggleAlwaysOnTop(mainWindow)
    });

    // 注册 忽略鼠标事件
    globalShortcut.register("CommandOrControl+D", () => {
        ignore_mouse_events(mainWindow)
    });*/
}

// 注销所有快捷键（内部使用）
function unregisterAllShortcuts() {
    globalShortcut.unregisterAll();
    registerPermanentShortcuts();
}

//减少 透明度（使用模块级 mainWindow）
function decrOpacity() {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }
    currentOpacity = mainWindow.getOpacity();
    currentOpacity -= 0.025;
    if (currentOpacity < 0.025) {
        currentOpacity = 0.025;
    }
    mainWindow.setOpacity(currentOpacity);
    if (menuWindow && menuWindow.isVisible()) {
        menuWindow.webContents.send('update-opacity', currentOpacity);
    }
}

//增加透明度（使用模块级 mainWindow）
function incrOpacity() {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }
    currentOpacity = mainWindow.getOpacity();
    currentOpacity += 0.025;
    if (currentOpacity > 1) {
        currentOpacity = 1;
    }
    mainWindow.setOpacity(currentOpacity);
    if (menuWindow && menuWindow.isVisible()) {
        menuWindow.webContents.send('update-opacity', currentOpacity);
    }
}

//切换 固定窗口
function toggleAlwaysOnTop(mainWindow) {
    // 检查窗口是否存在以及是否被销毁
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }
    const isPinned = !mainWindow.isAlwaysOnTop();
    if (mainWindow.isAlwaysOnTop()) {
        mainWindow.setAlwaysOnTop(false);
        mainWindow.setVisibleOnAllWorkspaces(false, { skipTransformProcessType: true });
    } else {
        mainWindow.setAlwaysOnTop(true, "screen-saver");
        mainWindow.setVisibleOnAllWorkspaces(true);
    }
    // 向菜单发送状态更新
    if (menuWindow && menuWindow.isVisible()) {
        menuWindow.webContents.send('update-pin-state', isPinned);
    }
}

function ignore_mouse_events(mainWindow) {
    // 检查窗口是否存在以及是否被销毁
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }
    // 切换状态
    ignoreMouseEvents = !ignoreMouseEvents;

    // 根据新状态设置窗口行为
    if (ignoreMouseEvents) {
        // 忽略内容窗口的鼠标事件，但允许点击穿透到下面的窗口
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
        // 不忽略鼠标事件
        mainWindow.setIgnoreMouseEvents(false);
    }

    // 向菜单发送状态更新
    if (menuWindow && menuWindow.isVisible()) {
        menuWindow.webContents.send('update-ignore-mouse-state', ignoreMouseEvents);
    }
}

function setBossKeyHandler(handler) {
    bossKeyHandler = handler;
}

function setQuickHideHandler(handler) {
    quickHideHandler = handler;
}

function registerPermanentShortcuts() {
    globalShortcut.register("CommandOrControl+Shift+B", () => {
        if (typeof bossKeyHandler === 'function') {
            bossKeyHandler();
        }
    });
    globalShortcut.register("CommandOrControl+Shift+H", () => {
        if (typeof quickHideHandler === 'function') {
            quickHideHandler();
        }
    });
}

//注销所有快捷键
function unregisterShortcutAll() {
    unregisterAllShortcuts();
}

// 获取当前的透明度值（供 main.js 调用）
function getCurrentOpacity() {
    return currentOpacity;
}

// 设置透明度值（供 main.js 调用）
function setCurrentOpacity(value) {
    currentOpacity = value;
}

// 获取忽略鼠标事件状态（供 main.js 调用）
function getIgnoreMouseEventsState() {
    return ignoreMouseEvents;
}

// 设置忽略鼠标事件状态（供 main.js 调用）
function setIgnoreMouseEventsState(state) {
    ignoreMouseEvents = state;
}

module.exports = {
    registerShortcut,
    unregisterShortcutAll,
    registerAllShortcuts,
    unregisterAllShortcuts,
    setMenuWindow,
    getCurrentOpacity,
    setCurrentOpacity,
    getIgnoreMouseEventsState,
    setIgnoreMouseEventsState,
    incrOpacity,
    decrOpacity,
    setBossKeyHandler,
    setQuickHideHandler,
    registerPermanentShortcuts
};
