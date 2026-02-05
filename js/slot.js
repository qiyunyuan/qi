export default function initDecision() {
    /* =================================
       数据与初始化
       ================================= */
    
    let data = {
        "默认": ["亲亲", "抱抱", "举高高", "喝奶茶"],
        "周末去哪": ["看电影", "逛公园", "宅家里", "去游乐园"],
        "吃什么": ["火锅", "烤肉", "日料", "随便"]
    };

    let currentCategory = "默认";

    if (localStorage.getItem('luckyBoxData')) {
        try {
            const savedData = JSON.parse(localStorage.getItem('luckyBoxData'));
            if (savedData && Object.keys(savedData).length > 0) {
                data = savedData;
                const keys = Object.keys(data);
                if (!keys.includes(currentCategory)) {
                    currentCategory = keys[0];
                }
            }
        } catch (e) {
            console.error("读取存档失败，重置为默认", e);
        }
    }

    function saveData() {
        localStorage.setItem('luckyBoxData', JSON.stringify(data));
    }

    /* =================================
       DOM 元素获取
       ================================= */
    const luckyBox = document.getElementById('luckyBox');
    const cardOverlay = document.getElementById('cardOverlay');
    const resultText = document.getElementById('resultText');
    const closeCardBtn = document.getElementById('closeCardBtn');
    const backBtn = document.getElementById('backBtn');

    const catTrigger = document.getElementById('catTrigger');
    const currentCatName = document.getElementById('currentCatName');
    const catSelectModal = document.getElementById('catSelectModal');
    const closeCatSelect = document.getElementById('closeCatSelect');
    const selectList = document.getElementById('selectList');

    const settingBtn = document.getElementById('settingBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const catList = document.getElementById('catList');
    const itemList = document.getElementById('itemList');
    const newCatInput = document.getElementById('newCatInput');
    const addCatBtn = document.getElementById('addCatBtn');
    const newItemInput = document.getElementById('newItemInput');
    const addItemBtn = document.getElementById('addItemBtn');
    const editCatName = document.getElementById('editCatName');

    /* =================================
       核心逻辑
       ================================= */

    updateCategoryDisplay();

    function updateCategoryDisplay() {
        if(currentCatName) currentCatName.innerText = currentCategory;
    }

    if(luckyBox) {
        luckyBox.addEventListener('click', () => {
            const items = data[currentCategory];
            if (!items || items.length === 0) {
                alert(`“${currentCategory}” 盒子里是空的，快去设置里填满它！`);
                return;
            }
            luckyBox.classList.add('shake');
            setTimeout(() => {
                luckyBox.classList.remove('shake');
                const randomItem = items[Math.floor(Math.random() * items.length)];
                resultText.innerText = randomItem;
                cardOverlay.classList.remove('hidden');
            }, 1000);
        });
    }

    if(closeCardBtn) {
        closeCardBtn.addEventListener('click', () => {
            cardOverlay.classList.add('hidden');
        });
    }

    /* =================================
       逻辑：切换分类
       ================================= */
    if(catTrigger) {
        catTrigger.addEventListener('click', () => {
            renderSelectList();
            catSelectModal.classList.remove('hidden');
        });
    }

    if(closeCatSelect) {
        closeCatSelect.addEventListener('click', () => {
            catSelectModal.classList.add('hidden');
        });
    }

    if(catSelectModal) {
        catSelectModal.addEventListener('click', (e) => {
            if (e.target === catSelectModal) {
                catSelectModal.classList.add('hidden');
            }
        });
    }

    function renderSelectList() {
        selectList.innerHTML = '';
        Object.keys(data).forEach(cat => {
            const div = document.createElement('div');
            div.className = `select-item ${cat === currentCategory ? 'active' : ''}`;
            div.innerText = cat;
            div.onclick = () => {
                currentCategory = cat;
                updateCategoryDisplay();
                catSelectModal.classList.add('hidden');
            };
            selectList.appendChild(div);
        });
    }

    /* =================================
       逻辑：设置页面
       ================================= */
    if(settingBtn) {
        settingBtn.addEventListener('click', () => {
            renderSettings();
            settingsModal.classList.remove('hidden');
        });
    }

    if(closeSettings) {
        closeSettings.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
            updateCategoryDisplay();
        });
    }

    function renderSettings() {
        catList.innerHTML = '';
        Object.keys(data).forEach(cat => {
            const tag = document.createElement('div');
            tag.className = `cat-tag ${cat === currentCategory ? 'active' : ''}`;
            tag.innerText = cat;
            tag.onclick = () => {
                currentCategory = cat;
                renderSettings();
            };
            
            if (Object.keys(data).length > 1) {
                 const delSpan = document.createElement('span');
                 delSpan.innerText = ' ×';
                 delSpan.style.marginLeft = '5px';
                 delSpan.style.fontWeight = 'bold';
                 delSpan.onclick = (e) => {
                     e.stopPropagation();
                     if(confirm(`确定要删除分类“${cat}”吗？`)) {
                         delete data[cat];
                         if (currentCategory === cat) {
                             currentCategory = Object.keys(data)[0];
                         }
                         saveData();
                         renderSettings();
                     }
                 };
                 tag.appendChild(delSpan);
            }
            catList.appendChild(tag);
        });

        editCatName.innerText = currentCategory;
        itemList.innerHTML = '';
        const items = data[currentCategory] || [];
        
        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item}</span>
                <span class="delete-btn" onclick="deleteItem(${index})">✕</span>
            `;
            itemList.appendChild(li);
        });
    }

    if(addCatBtn) {
        addCatBtn.addEventListener('click', () => {
            const val = newCatInput.value.trim();
            if (!val) return;
            if (data[val]) {
                alert('这个分类已经有啦');
                return;
            }
            data[val] = [];
            currentCategory = val;
            newCatInput.value = '';
            saveData();
            renderSettings();
        });
    }

    if(addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            const val = newItemInput.value.trim();
            if (val) {
                data[currentCategory].push(val);
                newItemInput.value = '';
                saveData();
                renderSettings();
            }
        });
    }

    // 挂载到 window 以便 HTML onclick 调用
    window.deleteItem = function(index) {
        data[currentCategory].splice(index, 1);
        saveData();
        renderSettings();
    };

    /* =================================
       修改点：返回键逻辑
       ================================= */
    if(backBtn) {
        backBtn.addEventListener('click', () => {
            // 1. 隐藏决策页，显示主页
            document.getElementById('page-decision').classList.remove('active');
            document.getElementById('page-home').classList.add('active');

            // 2. 强制关闭所有可能打开的弹窗，保证下次进来是干净的盒子界面
            if(settingsModal) settingsModal.classList.add('hidden');
            if(catSelectModal) catSelectModal.classList.add('hidden');
            if(cardOverlay) cardOverlay.classList.add('hidden');
        });
    }
}
