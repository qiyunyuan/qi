import { Storage } from '../../js/storage.js';

const STORAGE_KEY = 'role-manager-data';

let state = {
    roles: [],
    currentCategory: 'User',
    editingRoleId: null,
    editingDraft: null
};

let listeners = [];

function addManagedEventListener(element, type, listener, options) {
    if (!element) return;
    element.addEventListener(type, listener, options);
    listeners.push({ element, type, listener, options });
}

function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadData() {
    const saved = Storage.get(STORAGE_KEY, { roles: [] });
    state.roles = Array.isArray(saved?.roles) ? saved.roles : [];
}

function saveData() {
    Storage.save(STORAGE_KEY, { roles: state.roles });
}

function showView(viewName) {
    const mainView = document.getElementById('role-main-view');
    const editView = document.getElementById('role-edit-view');
    mainView.classList.toggle('active', viewName === 'main');
    editView.classList.toggle('active', viewName === 'edit');
}

function getDisplayName(role) {
    return role.alias?.trim() || role.name;
}

function getAvatarHTML(avatar, roleName) {
    const value = (avatar || '').trim();
    const safeName = escapeHtml(roleName || '?');
    if (!value) {
        return `<div class="role-avatar">${safeName.slice(0, 1)}</div>`;
    }
if (/^https?:\/\/|^data:image/.test(value)) {
        return `<div class="role-avatar"><img src="${value}" alt="avatar"></div>`;
    }
        return `<div class="role-avatar">${escapeHtml(value)}</div>`;
}

function processImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 设置目标尺寸（200x200 足够清晰且体积小）
            const targetSize = 200;
            canvas.width = targetSize;
            canvas.height = targetSize;
            // 计算居中裁剪
            let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
            if (srcW > srcH) {
                srcX = (srcW - srcH) / 2;
                srcW = srcH;
            } else {
                srcY = (srcH - srcW) / 2;
                srcH = srcW;
            }
            // 绘制并开启高质量平滑
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetSize, targetSize);
            // 导出为 jpeg (质量 0.9)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.9);
            callback(compressedBase64);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function rolesByCategory(category) {
    return state.roles.filter(role => role.category === category);
}

function renderTabs() {
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === state.currentCategory);
    });
}

function renderRoleList() {
    const list = document.getElementById('role-list');
    if (!list) return;

    const roles = rolesByCategory(state.currentCategory);
    if (roles.length === 0) {
        list.innerHTML = `<div class="empty-placeholder">当前分类还没有角色，点击右上角新建吧～</div>`;
        return;
    }

    list.innerHTML = roles.map(role => {
        const summary = role.persona?.trim() || '还没有人设内容';
        return `
            <div class="role-card" data-role-id="${role.id}">
                <div class="role-left">
                    ${getAvatarHTML(role.avatar, role.name)}
                    <div class="role-meta">
                        <div class="role-name">${escapeHtml(role.name)}</div>
                        <div class="role-alias">${escapeHtml(getDisplayName(role))}</div>
                        <div class="role-summary">${escapeHtml(summary)}</div>
                    </div>
                </div>
                <div class="role-tag">${escapeHtml(role.category)}</div>
            </div>
        `;
    }).join('');
}

function makeEmptyDraft() {
    return {
        id: null,
        category: state.currentCategory,
        avatar: '',
        name: '',
        alias: '',
        persona: '',
        relations: []
    };
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function openCreate() {
    state.editingRoleId = null;
    state.editingDraft = makeEmptyDraft();
    renderEditForm();
    showView('edit');
}

function openEdit(roleId) {
    const role = state.roles.find(item => item.id === roleId);
    if (!role) return;
    state.editingRoleId = roleId;
    state.editingDraft = deepClone(role);
    state.editingDraft.relations = Array.isArray(state.editingDraft.relations) ? state.editingDraft.relations : [];
    renderEditForm();
    showView('edit');
}

/**
 * 核心逻辑：维护双向关联的唯一性
 */
function syncRelations(savedRole) {
    const roleId = savedRole.id;

    if (savedRole.category === 'Npc') {
        // 1. 如果是 NPC：它只能有一个主角色
        const rel = savedRole.relations[0];
        const targetId = rel?.targetRoleId;

        // 清除其他 User/Char 对该 NPC 的引用
        state.roles.forEach(r => {
            if (r.category !== 'Npc') {
                r.relations = (r.relations || []).filter(link => link.targetRoleId !== roleId);
                // 如果这个 User/Char 是选中的目标，把 NPC 加进去
                if (targetId && r.id === targetId) {
                    r.relations.push({ targetCategory: 'Npc', targetRoleId: roleId });
                }
            }
        });
    } else {
        // 2. 如果是 User/Char：它可以有多个 NPC
        const selectedNpcIds = (savedRole.relations || []).map(r => r.targetRoleId).filter(Boolean);

        state.roles.forEach(r => {
            if (r.category === 'Npc') {
                if (selectedNpcIds.includes(r.id)) {
                    // 如果 NPC 在我的列表里，强制该 NPC 指向我
                    r.relations = [{ targetCategory: savedRole.category, targetRoleId: roleId }];
                } else {
                    // 如果 NPC 不在我的列表里，但它之前指向我，则清除它的指向
                    if (r.relations[0]?.targetRoleId === roleId) {
                        r.relations = [];
                    }
                }
            }
        });
    }
}

function saveRole() {
    const category = document.getElementById('field-category').value;
    const avatar = document.getElementById('field-avatar').value.trim();
    const name = document.getElementById('field-name').value.trim();
    const alias = document.getElementById('field-alias').value.trim();
    const persona = document.getElementById('field-persona').value.trim();

    if (!name) {
        alert('名字不能为空');
        return;
    }

    // 构建当前角色的关系数组
    let finalRelations = [];
    if (category === 'Npc') {
        const targetCat = document.querySelector('.relation-target-category')?.value;
        const targetId = document.querySelector('.relation-target-role')?.value;
        if (targetId) {
            finalRelations = [{ targetCategory: targetCat, targetRoleId: targetId }];
        }
    } else {
        const selects = document.querySelectorAll('.relation-target-role');
        selects.forEach(sel => {
            if (sel.value) {
                finalRelations.push({ targetCategory: 'Npc', targetRoleId: sel.value });
            }
        });
    }

    const roleRecord = {
        id: state.editingRoleId || uid('role'),
        category,
        avatar,
        name,
        alias,
        persona,
        relations: finalRelations
    };

    if (state.editingRoleId) {
        const idx = state.roles.findIndex(r => r.id === state.editingRoleId);
        state.roles[idx] = roleRecord;
    } else {
        state.roles.push(roleRecord);
    }

    // 同步维护其他角色的关系
    syncRelations(roleRecord);

    saveData();
    state.currentCategory = roleRecord.category;
    renderTabs();
    renderRoleList();
    showView('main');
}

function deleteRole() {
    if (!state.editingRoleId) return;
    if (!confirm(`确认删除吗？`)) return;

    const idToDelete = state.editingRoleId;
    state.roles = state.roles.filter(r => r.id !== idToDelete);

    // 清理其他角色对该角色的引用
    state.roles.forEach(r => {
        r.relations = (r.relations || []).filter(rel => rel.targetRoleId !== idToDelete);
    });

    saveData();
    renderRoleList();
    showView('main');
}

function buildTargetOptions(category, selectedId, currentRoleId) {
    const targets = rolesByCategory(category);
    if (targets.length === 0) return `<option value="">暂无${category}角色</option>`;
    
    return targets.map(target => {
        const isSelected = target.id === selectedId;
        let statusText = '';
        
        // 如果是 NPC，检查是否已被其他人占用
        if (category === 'Npc' && !isSelected) {
            const owner = state.roles.find(r => 
                r.category !== 'Npc' && 
                r.id !== currentRoleId && 
                (r.relations || []).some(rel => rel.targetRoleId === target.id)
            );
            if (owner) statusText = ` (已被 ${getDisplayName(owner)} 占用)`;
        }

        return `<option value="${target.id}" ${isSelected ? 'selected' : ''}>${escapeHtml(getDisplayName(target))}${statusText}</option>`;
    }).join('');
}

function renderRelations() {
    const list = document.getElementById('relations-list');
    const title = document.getElementById('npc-panel-title');
    const addBtn = document.getElementById('btn-add-relation');
    const category = document.getElementById('field-category').value;
    
    const relations = state.editingDraft.relations || [];

    if (category === 'Npc') {
        title.textContent = '关联主角色 (User/Char)';
        addBtn.style.display = 'none';
        const rel = relations[0] || { targetCategory: 'User', targetRoleId: '' };
        list.innerHTML = `
            <div class="relation-grid">
                <select class="cute-input relation-target-category">
                    <option value="User" ${rel.targetCategory === 'User' ? 'selected' : ''}>User</option>
                    <option value="Char" ${rel.targetCategory === 'Char' ? 'selected' : ''}>Char</option>
                </select>
                <select class="cute-input relation-target-role">
                    <option value="">请选择角色...</option>
                    ${buildTargetOptions(rel.targetCategory || 'User', rel.targetRoleId, state.editingRoleId)}
                </select>
            </div>`;
        
        // 监听分类切换刷新角色列表
        const catSelect = list.querySelector('.relation-target-category');
        const roleSelect = list.querySelector('.relation-target-role');
        catSelect.onchange = () => {
            roleSelect.innerHTML = '<option value="">请选择角色...</option>' + buildTargetOptions(catSelect.value, '', state.editingRoleId);
        };
    } else {
        title.textContent = '关联 NPC (可多选)';
        addBtn.style.display = 'block';
        if (relations.length === 0) {
            list.innerHTML = `<div class="empty-placeholder">暂无关联 NPC</div>`;
        } else {
            list.innerHTML = relations.map((rel, index) => `
                <div class="relation-card" style="display: flex; gap: 8px; align-items: center; margin-bottom:8px;">
                    <select class="cute-input relation-target-role" data-idx="${index}" style="flex: 1;">
                        <option value="">选择 NPC...</option>
                        ${buildTargetOptions('Npc', rel.targetRoleId, state.editingRoleId)}
                    </select>
                    <button type="button" class="btn-relation-delete" data-idx="${index}" style="width: auto; margin: 0; padding: 8px 12px; background:#fff0f4; border:none; border-radius:10px; color:#d96b7c; cursor:pointer;">✕</button>
                </div>
            `).join('');
        }
    }
}

function renderEditForm() {
    const draft = state.editingDraft;
    document.getElementById('edit-view-title').textContent = state.editingRoleId ? '编辑角色' : '新建角色';
    document.getElementById('btn-delete-role').style.display = state.editingRoleId ? 'block' : 'none';
    document.getElementById('field-category').value = draft.category;
    document.getElementById('field-name').value = draft.name || '';
    document.getElementById('field-alias').value = draft.alias || '';
    document.getElementById('field-persona').value = draft.persona || '';
    
    const avatarInput = document.getElementById('field-avatar');
    avatarInput.value = draft.avatar || '';
    const preview = document.getElementById('avatar-preview');
    if (draft.avatar) {
        preview.innerHTML = `<img src="${escapeHtml(draft.avatar)}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        preview.innerHTML = `<span class="avatar-placeholder" style="color: #ff8da1; font-size: 0.8rem;">预览</span>`;
    }

    renderRelations();
}

function bindMainEvents() {
        addManagedEventListener(document.getElementById('btn-main-back'), 'click', () => {
        if (window.System && typeof window.System.closeApp === 'function') {
            window.System.closeApp();
        }
    });

    addManagedEventListener(document.getElementById('btn-main-add'), 'click', openCreate);
    addManagedEventListener(document.getElementById('category-tabs'), 'click', (e) => {
        const tab = e.target.closest('.category-tab');
        if (tab) {
            state.currentCategory = tab.dataset.category;
            renderTabs();
            renderRoleList();
        }
    });
    addManagedEventListener(document.getElementById('role-list'), 'click', (e) => {
        const card = e.target.closest('.role-card');
        if (card) openEdit(card.dataset.roleId);
    });

    addManagedEventListener(document.getElementById('btn-edit-back'), 'click', () => showView('main'));
    addManagedEventListener(document.getElementById('btn-edit-save'), 'click', saveRole);
    addManagedEventListener(document.getElementById('btn-delete-role'), 'click', deleteRole);

    addManagedEventListener(document.getElementById('field-category'), 'change', (e) => {
        state.editingDraft.category = e.target.value;
        state.editingDraft.relations = []; // 切换分类时清空关系防止冲突
        renderRelations();
    });

    addManagedEventListener(document.getElementById('btn-add-relation'), 'click', () => {
        state.editingDraft.relations.push({ targetCategory: 'Npc', targetRoleId: '' });
        renderRelations();
    });

    addManagedEventListener(document.getElementById('relations-list'), 'click', (e) => {
        if (e.target.classList.contains('btn-relation-delete')) {
            const idx = e.target.dataset.idx;
            state.editingDraft.relations.splice(idx, 1);
            renderRelations();
        }
    });

    // 头像上传逻辑
    const fieldAvatar = document.getElementById('field-avatar');
    const preview = document.getElementById('avatar-preview');
    addManagedEventListener(document.getElementById('btn-url-upload'), 'click', () => {
        const url = prompt("请输入图片URL:", fieldAvatar.value);
        if (url !== null) {
            fieldAvatar.value = url;
            preview.innerHTML = url ? `<img src="${escapeHtml(url)}" style="width:100%;height:100%;object-fit:cover;">` : '<span class="avatar-placeholder">预览</span>';
        }
    });

    addManagedEventListener(document.getElementById('field-avatar-file'), 'change', (e) => {
        const file = e.target.files[0];
        if (file) {
            processImage(file, (base64Data) => {
                fieldAvatar.value = base64Data;
                preview.innerHTML = `<img src="${base64Data}" style="width:100%;height:100%;object-fit:cover;">`;
            });
        }
    });
}

export function init() {
    loadData();
    bindMainEvents();
    renderTabs();
    renderRoleList();
}

export function destroy() {
    listeners.forEach(({ element, type, listener, options }) => {
        if (element) element.removeEventListener(type, listener, options);
    });
    listeners = [];
}
