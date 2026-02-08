export default function initCharacter() {
    // --- 0. 核心数据管理 ---
    const STORAGE_KEY = 'love_character_data';
    let appData = {
        char: [],
        user: []
    };
    let currentEditIndex = null;
    let currentAvatarBase64 = null; 

    // 默认数据
    const defaultData = {
        char: [],
        user: []
    };

    // 读取数据
    function loadData() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            appData = JSON.parse(saved);
        } else {
            appData = defaultData;
            saveData();
        }
        renderAll();
    }

    // 保存数据
    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    }

    // --- 页面元素获取 ---
    const tabs = document.querySelectorAll('.tab-item');
    const lists = document.querySelectorAll('.info-list');
    const backBtn = document.getElementById('back-btn');
    const newBtn = document.getElementById('new-btn');
    
    const editorLayer = document.getElementById('editor-layer');
    const editorBack = document.getElementById('editor-back');
    const editorSave = document.getElementById('editor-save');
    const editorTitle = document.getElementById('editor-title');
    const editorContent = document.querySelector('.Character-editor-content');
    
    const inputName = document.getElementById('editor-name');
    const inputId = document.getElementById('editor-id');
    const inputDesc = document.getElementById('editor-desc');

    const avatarPreview = document.getElementById('editor-avatar');
    const avatarInput = document.getElementById('avatar-input');

    // 动态创建删除按钮（避免重复添加）
    let deleteBtn = document.querySelector('.Character-delete-btn');
    if (!deleteBtn) {
        deleteBtn = document.createElement('button');
        deleteBtn.className = 'Character-delete-btn';
        deleteBtn.textContent = '删除这个角色';
        editorContent.appendChild(deleteBtn);
    }

    // --- 🌟 辅助函数：显示头像 ---
    function showAvatarInPreview(base64Url) {
        avatarPreview.innerHTML = '';
        avatarPreview.style.backgroundImage = 'none'; 

        if (base64Url) {
            const img = document.createElement('img');
            img.src = base64Url;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '50%';
            img.style.display = 'block';
            avatarPreview.appendChild(img);
        } else {
            avatarPreview.innerHTML = '<span>＋</span>';
        }
    }

    // --- 🌟 图片上传逻辑 ---
    avatarPreview.onclick = () => {
        avatarInput.click();
    };

    avatarInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                currentAvatarBase64 = event.target.result;
                showAvatarInPreview(currentAvatarBase64);
            };
            reader.readAsDataURL(file);
        }
    };

    // --- 1. 渲染逻辑 ---
    function renderAll() {
        renderList('char');
        renderList('user');
    }

    function renderList(type) {
        const listEl = document.getElementById(type + '-list');
        if (!listEl) return;
        
        listEl.innerHTML = '';

        const dataList = appData[type];
        dataList.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'info-card';
            card.dataset.index = index;
            
            const avatarClass = type === 'char' ? 'char-avatar' : 'user-avatar';
            const prefix = type === 'char' ? 'ID: ' : '备注: ';

            let avatarHtml = '';
            if (item.avatar) {
                avatarHtml = `<img src="${item.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            }

            card.innerHTML = `
                <div class="info-avatar ${avatarClass}" style="background:none; overflow:hidden;">
                    ${avatarHtml}
                </div>
                <div class="info-text">
                    <h3>${item.name}</h3>
                    <p>${prefix}${item.subText}</p>
                </div>
            `;
            listEl.appendChild(card);
        });
    }

    // --- 2. 标签切换 ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            lists.forEach(l => l.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target') + '-list';
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- 3. 打开/关闭 编辑页 ---
    function openEditor(mode, index = null) {
        const activeTabEl = document.querySelector('.tab-item.active');
        const currentType = activeTabEl.getAttribute('data-target');
        const idLabel = inputId.previousElementSibling;

        editorLayer.style.display = 'flex';
        currentEditIndex = index;
        avatarInput.value = ''; 

        if (currentType === 'user') {
            idLabel.textContent = '备注';
            inputId.placeholder = '写个备注吧';
            editorTitle.textContent = mode === 'create' ? '新建用户' : '编辑用户';
        } else {
            idLabel.textContent = 'ID';
            inputId.placeholder = '唯一的ID哦';
            editorTitle.textContent = mode === 'create' ? '新建角色' : '编辑角色';
        }

        if (mode === 'create') {
            inputName.value = '';
            inputId.value = '';
            inputDesc.value = '';
            deleteBtn.style.display = 'none';
            
            currentAvatarBase64 = null;
            showAvatarInPreview(null);
        } else {
            const item = appData[currentType][index];
            inputName.value = item.name;
            inputId.value = item.subText;
            inputDesc.value = item.desc || '';
            deleteBtn.style.display = 'block';

            currentAvatarBase64 = item.avatar || null;
            showAvatarInPreview(currentAvatarBase64);
        }
    }

    function closeEditor() {
        editorLayer.style.display = 'none';
        currentEditIndex = null;
    }

    // --- 4. 按钮事件 ---

    if (newBtn) {
        newBtn.addEventListener('click', () => {
            openEditor('create');
        });
    }

    lists.forEach(list => {
        list.addEventListener('click', (e) => {
            const card = e.target.closest('.info-card');
            if (card) {
                const index = parseInt(card.dataset.index);
                openEditor('edit', index);
            }
        });
    });

    if (editorSave) {
        editorSave.addEventListener('click', () => {
            const activeTabEl = document.querySelector('.tab-item.active');
            const currentType = activeTabEl.getAttribute('data-target');

            const newItem = {
                name: inputName.value || '未命名',
                subText: inputId.value || '无',
                desc: inputDesc.value || '',
                avatar: currentAvatarBase64 
            };

            if (currentEditIndex !== null) {
                appData[currentType][currentEditIndex] = newItem;
            } else {
                appData[currentType].push(newItem);
            }

            saveData();
            renderList(currentType);
            closeEditor();
        });
    }

    if (deleteBtn) {
        deleteBtn.onclick = () => {
            const isConfirmed = confirm('确定要删除这个角色吗？删了就找不回来咯！');
            
            if (isConfirmed) {
                const activeTabEl = document.querySelector('.tab-item.active');
                const currentType = activeTabEl.getAttribute('data-target');

                if (currentEditIndex !== null) {
                    appData[currentType].splice(currentEditIndex, 1);
                    saveData();
                    renderList(currentType);
                    closeEditor();
                }
            }
        };
    }

    if (editorBack) {
        editorBack.addEventListener('click', closeEditor);
    }

    // --- 🌟 关键修改：返回主页逻辑 ---
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // 隐藏角色页
            document.getElementById('page-character').classList.remove('active');
            // 显示主页
            document.getElementById('page-home').classList.add('active');
        });
    }

    // 启动时加载数据
    loadData();
}
