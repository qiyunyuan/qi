    // 时钟功能
    function updateClock() {
        const display = document.getElementById('clock-display');
        if (!display) return; // 防止报错

        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        display.textContent = `${hours}:${minutes}:${seconds}`;
    }
    
    // 启动时钟
    setInterval(updateClock, 1000);
    updateClock(); // 马上刷新一次，别让我等
