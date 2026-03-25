/**
 * 🌟 全局状态管理器 (Global Store)
 * 负责跨 App 的数据共享和状态通信 (内存级，速度极快)
 */

class GlobalStore {
    constructor() {
        // 我们的“内存小仓库”，所有跨App共享的数据都存在这里
        this.state = {};
        // 我们的“订阅名单”，记录着哪些 App 想监听哪个数据的变化
        this.listeners = {};
    }

    /**
     * 1. 读取数据
     * @param {string} key - 数据的键名
     */
    get(key) {
        return this.state[key];
    }

    /**
     * 2. 写入/更新数据，并【自动通知】所有订阅了该数据的 App！
     * @param {string} key - 数据的键名
     * @param {*} value - 数据内容
     */
    set(key, value) {
        this.state[key] = value;
        console.log(`[Store] 📢 状态更新: ${key} =>`, value);
        
        // 翻开“订阅名单”，如果有人订阅了这个 key，就挨个打电话（执行回调函数）通知他们
        if (this.listeners[key]) {
            this.listeners[key].forEach(callback => callback(value));
        }
    }

    /**
     * 3. 订阅数据变化 (App 初始化 init 时调用)
     * @param {string} key - 想监听的键名 (比如 'partnerName')
     * @param {Function} callback - 数据变化时执行的函数
     * @returns {Function} 返回一个取消订阅的函数
     */
    subscribe(key, callback) {
        // 如果这个 key 还没有订阅名单，就建一个空数组
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        // 把当前 App 的回调函数加进名单
        this.listeners[key].push(callback);

        // 💡 敲黑板（保姆级重点）！
        // 这里返回了一个“取消订阅”的方法。
        // 宝宝一定要记得：在 App 的 destroy() 方法里调用它！
        // 否则 App 关闭后还在死皮赖脸接收消息，会导致内存泄漏报错哦~
        return () => {
            this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
        };
    }
}

// 创建唯一实例（单例模式，保证全手机只有一个数据中心）
const store = new GlobalStore();

// 挂载到我们之前建好的 System 全局对象上，供系统底层使用
window.System = window.System || {};
window.System.store = store;

// 同时也支持 ES6 模块导出，我们在具体的 App 里优先使用 import 引入！规范满满💯
export default store;
