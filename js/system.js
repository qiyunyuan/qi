// ==========================================
// 系统级功能：时间、电量、状态栏等
// ==========================================

export function initSystemClock() {
    const timeEl = document.querySelector('.time');
    const dateEl = document.querySelector('.date');

    function updateTime() {
        const now = new Date();
        
        // 1. 更新时间 (HH:MM:SS)
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        if (timeEl) timeEl.textContent = `${hours}:${minutes}:${seconds}`;

        // 2. 更新日期 (MM/DD 星期X)
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        const weekDay = days[now.getDay()];
        if (dateEl) dateEl.textContent = `${month}/${day} 星期${weekDay}`;
    }

    // 初始化执行一次，然后每秒更新
    updateTime();
    setInterval(updateTime, 1000);
    console.log('[System] 系统时钟已启动 ⏰');
}
