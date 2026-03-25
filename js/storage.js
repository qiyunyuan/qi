// ==========================================
// 系统级功能：本地数据管理工具 (LocalStorage)
// ==========================================

export const Storage = {
    /**
     * 保存数据
     * @param {string} key - 数据的键名 (例如 'notes')
     * @param {any} data - 要保存的数据 (对象、数组等都可以)
     */
    save: (key, data) => {
        try {
            localStorage.setItem(`phone_${key}`, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error(`[Storage] 保存 ${key} 失败:`, e);
            return false;
        }
    },

    /**
     * 读取数据
     * @param {string} key - 数据的键名
     * @param {any} defaultValue - 如果没有读到数据，默认返回什么 (如 [], {})
     */
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(`phone_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error(`[Storage] 读取 ${key} 失败:`, e);
            return defaultValue;
        }
    }
};
