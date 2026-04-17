// =================================================
// API 设置 APP - UI 交互逻辑 (V3 - 数据驱动版)
// =================================================

// 导入系统级 Storage 工具
import { Storage } from '../../js/storage.js';

// ------------------------------------------
// 1. 全局状态管理 (State)
// ------------------------------------------
// 使用一个对象来存储应用的所有数据状态
// editingApiId: null 表示添加新API, 具体值表示正在编辑的API的ID
let appState = {
    apis: [], // 已清空虚拟数据
    editingApiId: null, // 当前正在编辑的API ID
    editingModelId: null, // 当前正在编辑的模型的ID
};

// 存储事件监听器，用于销毁时移除
let eventListeners = [];

// 封装的事件监听添加函数
function addManagedEventListener(element, type, listener, options) {
    if (!element) return;
    element.addEventListener(type, listener, options);
    eventListeners.push({ element, type, listener, options });
}

// ------------------------------------------
// 1.1. 数据持久化 (Persistence)
// ------------------------------------------

/**
 * 将当前的 API 列表保存到 LocalStorage
 */
function saveApisToStorage() {
    Storage.save('api-configs', appState.apis);
    console.log('[Storage] API 配置已保存。');
}

// ------------------------------------------
// 2. 渲染函数 (Render)
// ------------------------------------------

/**
 * 渲染主界面的 API 列表
 * @param {HTMLElement} container - 列表容器元素
 */
function renderApiList(container) {
    if (!container) return;
    container.innerHTML = ''; // 清空现有列表
    if (appState.apis.length === 0) {
        container.innerHTML = '<p class="empty-list-placeholder">没有已保存的 API</p>';
        return;
    }
    appState.apis.forEach(api => {
        const card = document.createElement('div');
        card.className = 'api-card';
        card.dataset.apiId = api.id; // 添加 data-id 以便事件委托
        card.innerHTML = `
            <div class="api-info-left">
                <div class="api-name">${api.name}</div>
                <div class="api-url-box">
                    <span class="api-url">${api.url}</span>
                </div>
            </div>
            <div class="api-action-right">
                <div class="api-status-badge ${api.hasQuota ? 'has-quota' : 'no-quota'}">${api.hasQuota ? '有额度' : '无额度'}</div>
                <label class="cute-switch">
                    <input type="checkbox" ${api.enabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * 渲染编辑视图中的模型列表
 * @param {HTMLElement} container - 列表容器元素
 */
function renderModelList(container) {
    if (!container) return;
    const api = appState.apis.find(a => a.id === appState.editingApiId);
    if (!api || !api.models) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = ''; // 清空现有列表
    if (api.models.length === 0) {
        container.innerHTML = '<p class="empty-list-placeholder">没有已收藏的模型</p>';
        return;
    }

    api.models.forEach(model => {
        const swipeContainer = document.createElement('div');
        swipeContainer.className = 'swipe-container';
        swipeContainer.dataset.modelId = model.id; // 为事件委托添加ID

        swipeContainer.innerHTML = `
            <div class="swipe-actions">
                <button class="action-btn delete-btn">删除</button>
            </div>
            <div class="model-card swipeable" data-name="${model.name}" data-cost="${model.cost}">
                <div class="model-info">
                    <div class="model-name">${model.name}</div>
                    <div class="model-cost">消耗: ${model.cost}</div>
                </div>
                <button class="edit-model-btn" style="background:none; border:none; padding: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="#ff8da1" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
            </div>
        `;
        container.appendChild(swipeContainer);
    });
}

/**
 * 渲染拉取模型弹窗中的模型列表
 * @param {HTMLElement} container - 列表容器
 * @param {Array} availableModels - 从API获取的可用模型
 */
function renderPullModelList(container, availableModels) {
    if (!container) return;
    const currentApi = appState.apis.find(a => a.id === appState.editingApiId);
    const existingModelIds = currentApi ? currentApi.models.map(m => m.id) : [];

    let listHtml = '<div class="pull-model-list">';
    availableModels.forEach(model => {
        const isCollected = existingModelIds.includes(model.id);
        const modelName = model.name || model.id; // 兼容没有 name 字段的模型
        listHtml += `
            <label class="pull-model-item" for="model-${model.id}">
                <input type="checkbox" id="model-${model.id}" value="${model.id}" data-name="${modelName}" ${isCollected ? 'checked disabled' : ''}>
                <span class="model-name">${model.id}</span>
            </label>
        `;
    });
    listHtml += '</div>';
    container.innerHTML = listHtml;
}

// ------------------------------------------
// 3. 核心函数 (App Logic)
// ------------------------------------------

/**
 * App 初始化函数
 */
export function init() {
    console.log('[API-Manager] App Initializing...');

    // >>> 新增：从 Storage 加载数据
    // 如果 Storage 中有数据，则使用它，否则使用空数组
    appState.apis = Storage.get('api-configs', []);

    // --- 获取所有 DOM 元素 ---
    const mainView = document.getElementById('api-main-view');
    const editView = document.getElementById('api-edit-view');
    const apiListContainer = document.querySelector('.api-list');
    const modelListContainer = document.querySelector('.model-list');

    // 主视图按钮
    const btnBack = document.getElementById('btn-back');
    const btnAddApi = document.getElementById('btn-add-api');
    
    // 编辑视图元素
    const btnEditBack = document.getElementById('btn-edit-back');
    const btnEditSave = document.getElementById('btn-edit-save');
    const btnDeleteApi = document.querySelector('.delete-zone .cute-btn-danger');
    const apiViewTitle = document.getElementById('api-view-title');
    const editForm = {
        name: document.querySelector('#tab-config input[placeholder="名称"]'),
        url: document.querySelector('#tab-config input[placeholder="https://xxxx.com"]'),
        key: document.querySelector('#tab-config input[placeholder="sk-xxxxxxxxxxxxxxxx"]'),
        quotaBtns: document.querySelectorAll('.quota-toggle .quota-btn'),
    };
    const navItems = document.querySelectorAll('.nav-item');
    const editTabs = document.querySelectorAll('.edit-tab');
    
    // 模型相关弹窗
    const modelModal = document.getElementById('model-modal');
    const btnCloseModelModal = modelModal.querySelector('.close-btn');
    const btnSaveModelSettings = modelModal.querySelector('.modal-footer button');
    const modalModelId = document.getElementById('modal-model-id');
    const modalModelName = document.getElementById('modal-model-name');
    const modalModelCost = document.getElementById('modal-model-cost');

    // 拉取模型弹窗
    const pullModelModal = document.getElementById('pull-model-modal');
    const btnClearModels = document.getElementById('btn-clear-models');
    const btnPullModels = document.getElementById('btn-pull-models');
    const btnClosePullModal = pullModelModal.querySelector('.close-btn');
    const pullModelListContainer = document.getElementById('pull-model-list-container');
    const btnSelectAll = document.getElementById('btn-select-all');
    const btnDeselectAll = document.getElementById('btn-deselect-all');
    const btnCollectSelected = document.getElementById('btn-collect-selected');

    // 【新增】获取“添加API弹窗”的元素
    const addApiModal = document.getElementById('add-api-modal');
    const btnCloseAddModal = document.getElementById('btn-close-add-modal');
    const btnSaveNewApi = document.getElementById('btn-save-new-api');
    const addApiNameInput = document.getElementById('add-api-name');
    const addApiUrlInput = document.getElementById('add-api-url');
    const addApiKeyInput = document.getElementById('add-api-key');

    // --- 视图切换函数 ---
    const showView = (viewToShow) => {
        mainView.classList.remove('active');
        editView.classList.remove('active');
        viewToShow.classList.add('active');
    };

    const resetEditTabs = () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        editTabs.forEach(tab => tab.classList.remove('active'));
        document.querySelector('[data-target="tab-config"]').classList.add('active');
        document.getElementById('tab-config').classList.add('active');
    };

    // --- 事件处理函数 ---

    // 【新增】专门用于处理“添加新API”的函数
    const handleAddNewApi = () => {
        const name = addApiNameInput.value.trim();
        const url = addApiUrlInput.value.trim();
        const key = addApiKeyInput.value.trim();

        if (!name || !url || !key) {
            alert('API 名称、地址和密钥不能为空！');
            return;
        }

        const newApi = {
            id: `api-${Date.now()}`,
            name,
            url,
            key,
            hasQuota: true, // 默认有额度
            enabled: true,
            models: [],
        };

        appState.apis.push(newApi);
        saveApisToStorage();
        renderApiList(apiListContainer);
        
        // 关闭弹窗
        addApiModal.classList.remove('active');
        alert('API 添加成功！');
    };

    // 保存 API
    const handleSaveApi = () => {
        const name = editForm.name.value.trim();
        const url = editForm.url.value.trim();
        const key = editForm.key.value.trim();
        if (!name || !url || !key) {
            alert('API 名称、地址和密钥不能为空！');
            return;
        }

        const hasQuota = document.querySelector('.quota-toggle .quota-btn.active').textContent === '有额度';

        if (appState.editingApiId) { // 编辑模式
            const api = appState.apis.find(a => a.id === appState.editingApiId);
            if (api) {
                api.name = name;
                api.url = url;
                api.key = key;
                api.hasQuota = hasQuota;
            }
         } else {
            // 这个分支理论上不再会进入，可以删除或保留以防万一
            console.error("handleSaveApi called without editingApiId!");
            return;
        }
        
        saveApisToStorage(); // >>> 新增：保存到 Storage
        alert('API 已保存！');
        renderApiList(apiListContainer);
        showView(mainView);
    };

    // 删除 API
    const handleDeleteApi = () => {
        if (!appState.editingApiId) return;
        if (confirm(`确定要删除 API "${editForm.name.value}" 吗？`)) {
            appState.apis = appState.apis.filter(a => a.id !== appState.editingApiId);
            console.log('API 已删除:', appState.apis);
            saveApisToStorage(); // >>> 新增：保存到 Storage
            alert('API 已删除！');
            renderApiList(apiListContainer);
            showView(mainView);
        }
    };

    // 删除模型
    const handleDeleteModel = (modelId) => {
        const api = appState.apis.find(a => a.id === appState.editingApiId);
        if (api) {
            api.models = api.models.filter(m => m.id !== modelId);
            saveApisToStorage(); // >>> 新增：保存到 Storage
            renderModelList(modelListContainer);
        }
    };
    
    // 收藏选中的模型
    const handleCollectModels = () => {
        const selectedCheckboxes = pullModelListContainer.querySelectorAll('input:checked:not(:disabled)');
        if (selectedCheckboxes.length === 0) {
            alert('您没有选择任何新的模型。');
            return;
        }

        const api = appState.apis.find(a => a.id === appState.editingApiId);
        if (!api) return;

        selectedCheckboxes.forEach(checkbox => {
            api.models.push({
                id: checkbox.value,
                name: checkbox.dataset.name || checkbox.value, // 使用渲染时绑定的真实名称
                cost: 0 // 默认消耗为0
            });
        });

        saveApisToStorage(); // >>> 新增：保存到 Storage
        alert(`成功收藏 ${selectedCheckboxes.length} 个新模型！`);
        renderModelList(modelListContainer);
        pullModelModal.classList.remove('active');
    };

    // --- 事件监听器绑定 ---
    
    // 返回桌面
    addManagedEventListener(btnBack, 'click', () => {
        if (window.System && typeof window.System.closeApp === 'function') {
            window.System.closeApp();
        }
    });

    // 添加 API
    addManagedEventListener(btnAddApi, 'click', () => {
        // 清空输入框
         addApiNameInput.value = '';
        addApiUrlInput.value = '';
        addApiKeyInput.value = '';
        // 打开“添加API”弹窗
        addApiModal.classList.add('active');
    });

     // 【新增】为“添加API弹窗”绑定关闭和保存事件
    addManagedEventListener(btnCloseAddModal, 'click', () => {
        addApiModal.classList.remove('active');
    });
    addManagedEventListener(btnSaveNewApi, 'click', handleAddNewApi);

    // 从编辑页返回主页
    addManagedEventListener(btnEditBack, 'click', () => {
        showView(mainView);
    });
    
    // 保存 API
    addManagedEventListener(btnEditSave, 'click', handleSaveApi);
    
    // 删除 API
    addManagedEventListener(btnDeleteApi, 'click', handleDeleteApi);

    // API 列表事件委托 (处理卡片点击、开关切换)
    addManagedEventListener(apiListContainer, 'click', (e) => {
        const card = e.target.closest('.api-card');
        if (!card) return;

        const apiId = card.dataset.apiId;
        const api = appState.apis.find(a => a.id === apiId);
        if (!api) return;

        // 如果点击的是开关
        if (e.target.closest('.cute-switch')) {
            const checkbox = e.target.closest('.cute-switch').querySelector('input');
            api.enabled = checkbox.checked;
            console.log(`API "${api.name}" 状态更新为: ${api.enabled ? '启用' : '禁用'}`);
            saveApisToStorage(); // >>> 新增：保存到 Storage
            return; 
        }

        // 点击卡片其他区域，进入编辑模式
        appState.editingApiId = apiId;
        apiViewTitle.textContent = '编辑 API';
        btnDeleteApi.style.display = 'block'; 
        
        // 填充表单
        editForm.name.value = api.name;
        editForm.url.value = api.url;
        editForm.key.value = api.key;
        editForm.quotaBtns.forEach(btn => {
            if (btn.textContent === '有额度' && api.hasQuota) btn.classList.add('active');
            else if (btn.textContent === '无额度' && !api.hasQuota) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        btnDeleteApi.style.display = 'block'; // 编辑时显示删除按钮
        
        resetEditTabs();
        renderModelList(modelListContainer); // 渲染该API的模型列表
        showView(editView);
    });
    
    // 编辑视图中的 Tab 切换
    navItems.forEach(item => {
        addManagedEventListener(item, 'click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            editTabs.forEach(tab => tab.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(item.dataset.target).classList.add('active');
        });
    });

    // 编辑视图中的额度按钮切换
    editForm.quotaBtns.forEach(btn => {
        addManagedEventListener(btn, 'click', (e) => {
            editForm.quotaBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // 模型列表事件委托 (处理左滑、点击、删除)
    let startX = 0, currentX = 0, isDragging = false, swipedCard = null;
    let draggedCard = null; // 新增一个变量来追踪被拖动的卡片

    addManagedEventListener(modelListContainer, 'pointerdown', (e) => {
        const card = e.target.closest('.model-card.swipeable');
        const editBtn = e.target.closest('.edit-model-btn');
        if (card && !editBtn && !card.closest('.swipe-actions')) { // 防止在编辑按钮或已滑开的按钮上再次触发
            isDragging = true;
            draggedCard = card; // 追踪这张卡片
            startX = e.clientX;
            // 关闭其他已滑开的卡片
            if (swipedCard && swipedCard !== draggedCard) {
                swipedCard.style.transform = 'translateX(0)';
            }
            draggedCard.style.transition = 'none'; // 拖动时移除动画
        }
    });

    addManagedEventListener(document, 'pointermove', (e) => {
        if (!isDragging || !draggedCard) return;
        currentX = e.clientX;
        const diff = startX - currentX;
        if (diff > 0) { // 只允许向左滑动
            draggedCard.style.transform = `translateX(-${diff}px)`;
        }
    });

    addManagedEventListener(document, 'pointerup', (e) => {
        if (!isDragging || !draggedCard) return;
        isDragging = false;
        
        const diff = startX - currentX;
        draggedCard.style.transition = 'transform 0.3s ease'; // 恢复动画

        if (diff > 80) { // 滑动超过阈值
            draggedCard.style.transform = 'translateX(-80px)'; // 停在删除按钮位置
            swipedCard = draggedCard;
        } else { // 滑动不够或向右滑
            draggedCard.style.transform = 'translateX(0)';
            if (swipedCard === draggedCard) {
                swipedCard = null;
            }
        }
        
        // 重置状态
        draggedCard = null; 
        startX = 0;
        currentX = 0;
    });

    addManagedEventListener(modelListContainer, 'click', (e) => {
        // 关闭已滑开的卡片
        if (swipedCard && !e.target.closest('.swipe-container')) {
            swipedCard.style.transform = 'translateX(0)';
            swipedCard = null;
        }

        const deleteBtn = e.target.closest('.delete-btn');
        const editBtn = e.target.closest('.edit-model-btn');
        const card = e.target.closest('.model-card.swipeable');
        const container = e.target.closest('.swipe-container');

        if (deleteBtn) { // 点击删除按钮
            const modelId = container?.dataset.modelId;
            const cardInner = container.querySelector('.model-card');
            const modelName = cardInner ? cardInner.dataset.name : '未知模型';
            if (modelId && confirm(`确定要删除模型 "${modelName}" 吗？`)) {
                container.style.transition = 'opacity 0.3s, height 0.3s, margin 0.3s';
                container.style.opacity = '0';
                container.style.height = '0px';
                container.style.marginBottom = '0px';
                setTimeout(() => {
                    handleDeleteModel(modelId);
                }, 300);
            }
        } else if (editBtn) { // 点击编辑按钮
            const modelId = container?.dataset.modelId;
            const api = appState.apis.find(a => a.id === appState.editingApiId);
            const model = api?.models.find(m => m.id === modelId);
            if (model) {
                appState.editingModelId = model.id;
                modalModelId.value = model.id;
                modalModelName.value = model.name;
                modalModelCost.value = model.cost;
                modelModal.classList.add('active');
            }
        } else if (card) { // 点击卡片本身
             const transform = window.getComputedStyle(card).transform;
             if(transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)') { // 如果卡片处于滑开状态
                card.style.transform = 'translateX(0)';
                swipedCard = null;
             }
        }
    });

    // 模型编辑弹窗 - 保存
    addManagedEventListener(btnSaveModelSettings, 'click', () => {
        const api = appState.apis.find(a => a.id === appState.editingApiId);
        const model = api?.models.find(m => m.id === appState.editingModelId);
        if (model) {
            model.name = modalModelName.value.trim();
            model.cost = Number(modalModelCost.value) || 0;
            saveApisToStorage(); // >>> 新增：保存到 Storage
            renderModelList(modelListContainer);
        }
        modelModal.classList.remove('active');
    });

    // 模型编辑弹窗 - 关闭
    addManagedEventListener(btnCloseModelModal, 'click', () => {
        modelModal.classList.remove('active');
    });

    // 清空模型
    addManagedEventListener(btnClearModels, 'click', () => {
        const api = appState.apis.find(a => a.id === appState.editingApiId);
        if (!api || api.models.length === 0) {
            alert('没有可清空的模型。');
            return;
        }
        
        if (confirm('确定要删除所有已收藏的模型吗？此操作不可撤销。')) {
            api.models = []; // 清空数据
            saveApisToStorage(); // >>> 新增：保存到 Storage
            renderModelList(modelListContainer); // 重新渲染列表
        }
    });

    // 拉取模型弹窗 - 打开并获取真实数据
    addManagedEventListener(btnPullModels, 'click', async () => {
        if (!appState.editingApiId) return;
        
        pullModelListContainer.innerHTML = '<div class="loading-spinner" style="text-align:center; padding: 20px;">正在拉取可用模型...</div>';
        pullModelModal.classList.add('active');

        try {
            // 1. 获取当前编辑视图中的输入框元素
            const apiUrlInput = document.querySelector('#api-edit-view input[placeholder="https://xxxx.com"]');
            const apiKeyInput = document.querySelector('#api-edit-view input[placeholder="sk-xxxxxxxxxxxxxxxx"]');
            
            const apiUrl = apiUrlInput.value.trim();
            const apiKey = apiKeyInput.value.trim();

            // 2. 校验输入
            if (!apiUrl || !apiKey) {
                throw new Error("请先填写完整的 API 地址和密钥");
            }
            
            // 3. 使用输入框中的值发起网络请求
            const response = await fetch(`${apiUrl}/v1/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // 尝试解析API返回的错误信息
                let errorMsg = `网络请求失败: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg += `, ${errorData.error?.message || response.statusText}`;
                } catch (e) {
                    errorMsg += `, ${response.statusText}`;
                }
                throw new Error(errorMsg);
            }

            const result = await response.json();
            const models = result.data || []; 
            
            // 4. 使用获取到的真实模型数据渲染列表
            renderPullModelList(pullModelListContainer, models);

        } catch (error) {
            console.error('拉取模型失败:', error);
            pullModelListContainer.innerHTML = `<p class="error-message" style="color: #ff4d4f; text-align: center; padding: 20px;">加载失败：${error.message}</p>`;
        }
    });

    // 拉取模型弹窗 - 关闭
    addManagedEventListener(btnClosePullModal, 'click', () => {
        pullModelModal.classList.remove('active');
    });
    
    // 拉取模型弹窗 - 全选/取消全选
    addManagedEventListener(btnSelectAll, 'click', () => {
        pullModelListContainer.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach(cb => cb.checked = true);
    });
    addManagedEventListener(btnDeselectAll, 'click', () => {
        pullModelListContainer.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach(cb => cb.checked = false);
    });
    
    // 拉取模型弹窗 - 收藏选中
    addManagedEventListener(btnCollectSelected, 'click', handleCollectModels);

    // --- 初始渲染 ---
    renderApiList(apiListContainer);
}

/**
 * App 销毁函数
 */
export function destroy() {
    console.log('[API-Manager] App Destroying...');
    eventListeners.forEach(({ element, type, listener, options }) => {
        if (element) element.removeEventListener(type, listener, options);
    });
    eventListeners = []; // 清空数组
}
