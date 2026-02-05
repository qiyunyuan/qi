// 引入决策喵模块
import initDecision from './slot.js';

// 启动时钟
function updateClock() {
    const timeDisplay = document.getElementById('clock-display');
    const dateDisplay = document.querySelector('.date-display');
    
    if (!timeDisplay || !dateDisplay) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;

    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const day = weekDays[now.getDay()];

    dateDisplay.textContent = `${month}/${date} ${day}`;
}

setInterval(updateClock, 1000);
updateClock();

// 初始化决策喵功能
initDecision();

// 绑定APP图标点击事件
const appDecision = document.getElementById('app-decision');
if (appDecision) {
    appDecision.addEventListener('click', () => {
        // 隐藏主页，显示决策页
        document.getElementById('page-home').classList.remove('active');
        document.getElementById('page-decision').classList.add('active');
    });
}
