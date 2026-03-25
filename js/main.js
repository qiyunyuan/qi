import { initSystemClock } from './system.js';


// ==========================================
// 系统核心：APP 动态加载器 (App Loader)
// ==========================================

const desktop = document.getElementById('desktop');
const appContainer = document.getElementById('app-container');
let currentAppInstance = null; // 用于记录当前运行的APP实例

/**
 * 核心：打开 APP
 * @param {string} appName - APP的文件夹名称
 */
export async function openApp(appName) {
    try {
        console.log(`[System] 正在启动应用: ${appName}...`);
        
        // 1. 动态拉取并注入 HTML
        const htmlResponse = await fetch(`./apps/${appName}/index.html`, { cache: 'no-store' });
        if (!htmlResponse.ok) throw new Error(`找不到应用 ${appName} 的 HTML 文件`);
        const htmlText = await htmlResponse.text();
        appContainer.innerHTML = htmlText;

        // 2. 动态插入专属 CSS
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.id = 'current-app-css';
        styleLink.href = `./apps/${appName}/style.css?t=${Date.now()}`;
        document.head.appendChild(styleLink);

        // 3. 切换视图：隐藏桌面，显示 APP 容器
        desktop.style.display = 'none';
        appContainer.classList.remove('hidden');

        // 4. 动态加载并执行专属 JS
        try {
            // import() 的路径是相对当前文件 main.js 的
            const appModule = await import(`../apps/${appName}/script.js`);
            if (appModule && typeof appModule.init === 'function') {
                appModule.init(); // 触发 APP 的初始化逻辑
                currentAppInstance = appModule; // 记录实例，方便以后调用 destroy
            }
        } catch (jsError) {
            // 允许没有 JS 的纯静态 APP 存在，所以只是 warn 而不抛出异常
            console.warn(`[System] 应用 ${appName} 没有独立 script.js 或加载失败 (如仅静态展示则无需理会)。`, jsError);
        }

    } catch (error) {
        console.error(`[System] 启动应用 ${appName} 失败:`, error);
        alert(`应用 ${appName} 加载失败`);
        closeApp(); // 出错了就退回桌面
    }
}

/**
 * 核心：关闭当前 APP
 */
export function closeApp() {
    console.log('[System] 正在关闭当前应用，返回桌面...');

    // 1. 清空 APP 的 DOM 结构
    appContainer.innerHTML = '';

    // 2. 拔掉当前 APP 的专属 CSS 样式
    const currentCss = document.getElementById('current-app-css');
    if (currentCss) currentCss.remove();

    // 3. 销毁 APP 实例（调用它内部暴露的 destroy 方法清理定时器等）
    if (currentAppInstance && typeof currentAppInstance.destroy === 'function') {
        currentAppInstance.destroy();
    }
    currentAppInstance = null;

    // 4. 切换视图：隐藏 APP 容器，恢复桌面
    appContainer.classList.add('hidden');
    desktop.style.display = '';
}

// ==========================================
// 系统初始化事件绑定
// ==========================================
function initSystem() {
    // 自动为桌面上带有 data-app 属性的图标绑定点击事件
    const appIcons = document.querySelectorAll('.app-icon');
    appIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const appName = icon.getAttribute('data-app');
            if (appName) {
                openApp(appName);
            }
        });
    });

    // 挂载一个全局关闭方法，方便后面的应用调用
    window.System = { closeApp };

    // 启动系统时钟
    initSystemClock();

    console.log('[System] 桌面启动完成！🚀');
}

// 启动系统
initSystem();
