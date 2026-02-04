        // 时钟功能
    function updateClock() {
        const timeDisplay = document.getElementById('clock-display');
        const dateDisplay = document.querySelector('.date-display'); // 获取日期元素
        
        if (!timeDisplay || !dateDisplay) return; // 防止报错

        const now = new Date();
        
        // 1. 更新时间
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;

        // 2. 更新日期
        const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份是从0开始的，要+1
        const date = String(now.getDate()).padStart(2, '0');
        
        // 把数字星期变成中文
        const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const day = weekDays[now.getDay()];

        dateDisplay.textContent = `${month}/${date} ${day}`;
    }
    
    // 启动时钟
    setInterval(updateClock, 1000);
    updateClock(); // 马上刷新一次

