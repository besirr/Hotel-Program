// adminRoomAssignment.js
// Veri değişkenleri (USERS, ROOMS, ACTIVE_TASKS, OCCUPIED_ROOMS) cshtml tarafından
// bu dosyadan önce tanımlanmış olmalıdır.

let selectedUserId = null;
let selectedRooms  = new Set();
let activeBlock    = 'all';
let allUsers       = [...USERS];
let allRooms       = [...ROOMS];

document.addEventListener('DOMContentLoaded', () => {
    renderUsers(allUsers);
    renderRooms(allRooms);
    document.getElementById('userCount').textContent = allUsers.length + ' kişi';
    updateRoomStats(allRooms);
});

// Bir oda için müşteri bilgisi döner
function getCustomerStatus(room) {
    const occ = OCCUPIED_ROOMS.find(o =>
        o.roomNumber === room.number && o.blockId === room.blockId
    );
    if (!occ) return null;
    if (occ.status === 2) return { type: 'customer', label: '👤 Müşteri İçeride', name: occ.guestName };
    if (occ.status === 1) return { type: 'reserved', label: '📅 Rezerve', name: occ.guestName };
    return null;
}

// Bir oda için temizlik görev durumu döner
function getRoomStatus(room) {
    const task = ACTIVE_TASKS.find(t =>
        t.roomNumber === room.number && t.blockId === room.blockId
    );
    if (!task) return { type: 'free', label: '✓ Müsait' };
    if (task.userId === selectedUserId) return { type: 'self', label: '↺ Temizleniyor' };
    const assignedUser = allUsers.find(u => u.id === task.userId);
    const assignedName = assignedUser ? assignedUser.name.split(' ')[0] : 'Başkası';
    return { type: 'assigned', label: '⚠ ' + assignedName + ' üzerinde' };
}

// Oda istatistiklerini güncelle
function updateRoomStats(list) {
    const total = list.length;
    let occupied = 0, reserved = 0;
    list.forEach(r => {
        const occ = OCCUPIED_ROOMS.find(o => o.roomNumber === r.number && o.blockId === r.blockId);
        if (occ) {
            if (occ.status === 2) occupied++;
            else if (occ.status === 1) reserved++;
        }
    });
    const free = total - occupied - reserved;
    document.getElementById('statTotal').textContent    = total;
    document.getElementById('statOccupied').textContent = occupied;
    document.getElementById('statReserved').textContent = reserved;
    document.getElementById('statFree').textContent     = Math.max(0, free);
}

function renderUsers(list) {
    const ul = document.getElementById('userList');
    if (list.length === 0) {
        ul.innerHTML = '<div class="empty-state">Kullanıcı bulunamadı</div>';
        return;
    }
    ul.innerHTML = list.map(u => `
        <div class="user-item ${selectedUserId === u.id ? 'selected' : ''}"
             onclick="selectUser(${u.id})" data-id="${u.id}">
            <div class="user-avatar">${u.name.charAt(0)}</div>
            <div class="user-info">
                <div class="user-name">${u.name}</div>
                <div class="user-meta">Rol: ${u.role} &bull; TC: ${u.tc}</div>
            </div>
            <div class="user-check ${selectedUserId === u.id ? 'visible' : ''}">&#10003;</div>
        </div>
    `).join('');
}

function filterUsers() {
    const q = document.getElementById('userSearch').value.toLowerCase();
    renderUsers(allUsers.filter(u =>
        u.name.toLowerCase().includes(q) || u.tc.includes(q) || u.role.toLowerCase().includes(q)
    ));
}

function selectUser(id) {
    selectedUserId = id;
    const u = allUsers.find(x => x.id === id);
    document.getElementById('selectedUserCard').style.display = 'block';
    document.getElementById('selectedUserName').textContent = u.name;
    document.getElementById('selectedUserMeta').textContent =
        'Rol: ' + u.role + ' — TC: ' + u.tc.substring(0, 3) + '****' + u.tc.slice(-2);
    const q = document.getElementById('userSearch').value.toLowerCase();
    renderUsers(allUsers.filter(x => x.name.toLowerCase().includes(q) || x.tc.includes(q)));
    applyRoomFilters();
    updateActionBar();
}

function renderRooms(list) {
    const grid = document.getElementById('roomGrid');
    if (list.length === 0) {
        grid.innerHTML = '<div class="empty-state">Oda bulunamadı</div>';
        return;
    }
    grid.innerHTML = list.map(r => {
        const taskStatus = getRoomStatus(r);
        const custStatus = getCustomerStatus(r);

        const taskBadgeClass =
            taskStatus.type === 'free'     ? 'badge-free'     :
            taskStatus.type === 'self'     ? 'badge-cleaning'  :
            taskStatus.type === 'assigned' ? 'badge-assigned'  : 'badge-free';

        const custBadgeClass =
            custStatus && custStatus.type === 'customer'  ? 'badge-customer'  :
            custStatus && custStatus.type === 'reserved'  ? 'badge-reserved'  : '';

        const extraCardClass =
            custStatus && custStatus.type === 'customer' ? 'has-customer' :
            custStatus && custStatus.type === 'reserved' ? 'has-reserved' : '';

        const custBadgeHtml = custStatus
            ? `<span class="room-status-badge ${custBadgeClass}" title="${custStatus.name}">${custStatus.label}</span>`
            : '';

        const taskBadgeHtml = `<span class="room-status-badge ${taskBadgeClass}">${taskStatus.label}</span>`;

        return `
            <div class="room-card ${selectedRooms.has(r.id) ? 'selected' : ''} ${r.isActive ? 'status-active' : 'status-inactive'} ${extraCardClass}"
                 onclick="toggleRoom(${r.id})" data-id="${r.id}" data-block="${r.blockId}">
                <div class="room-number">${r.number}</div>
                <div class="room-type">${r.blockName}</div>
                ${custBadgeHtml}
                ${taskBadgeHtml}
                <div class="room-sel-check">&#10003;</div>
            </div>
        `;
    }).join('');
}

function toggleRoom(roomId) {
    if (selectedRooms.has(roomId)) selectedRooms.delete(roomId);
    else selectedRooms.add(roomId);
    refreshRoomGrid();
    updateSelectedRoomTags();
    updateActionBar();
}

function refreshRoomGrid() {
    document.querySelectorAll('.room-card').forEach(card => {
        const id = parseInt(card.dataset.id);
        card.classList.toggle('selected', selectedRooms.has(id));
    });
    document.getElementById('selectedRoomCount').textContent = selectedRooms.size + ' seçili';
}

function filterRooms() { applyRoomFilters(); }

function filterBlock(blockId, btn) {
    activeBlock = blockId;
    document.querySelectorAll('.floor-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    applyRoomFilters();
}

function applyRoomFilters() {
    const q = document.getElementById('roomSearch').value;
    let filtered = allRooms;
    if (activeBlock !== 'all') filtered = filtered.filter(r => r.blockId === parseInt(activeBlock));
    if (q) filtered = filtered.filter(r => r.number.toString().includes(q));
    renderRooms(filtered);
    refreshRoomGrid();
    updateRoomStats(filtered);
}

function updateSelectedRoomTags() {
    const wrap = document.getElementById('selectedRoomsWrap');
    const tags = document.getElementById('selectedRoomsTags');
    if (selectedRooms.size === 0) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    tags.innerHTML = [...selectedRooms].map(id => {
        const r = allRooms.find(x => x.id === id);
        const taskSt = getRoomStatus(r);
        const custSt = getCustomerStatus(r);
        let warn = '';
        if (custSt && custSt.type === 'customer')
            warn += ` <span style="color:#c2410c;font-size:0.73rem;">👤 ${custSt.name || 'Müşteri İçeride'}</span>`;
        else if (custSt && custSt.type === 'reserved')
            warn += ` <span style="color:#6b21a8;font-size:0.73rem;">📅 Rezerve</span>`;
        if (taskSt.type === 'assigned')
            warn += ` <span style="color:#f59e0b;font-size:0.73rem;">(${taskSt.label})</span>`;
        return `
            <span class="room-tag">
                ${r.blockName} - ${r.number}${warn}
                <button onclick="event.stopPropagation(); toggleRoom(${id})">&#215;</button>
            </span>
        `;
    }).join('');
}

function updateActionBar() {
    const btn  = document.getElementById('btnAssign');
    const info = document.getElementById('actionSummary');
    if (selectedUserId && selectedRooms.size > 0) {
        const u = allUsers.find(x => x.id === selectedUserId);

        const conflictRooms = [...selectedRooms].filter(id => {
            const r = allRooms.find(x => x.id === id);
            return getRoomStatus(r).type === 'assigned';
        });
        const customerRooms = [...selectedRooms].filter(id => {
            const r = allRooms.find(x => x.id === id);
            const cs = getCustomerStatus(r);
            return cs && cs.type === 'customer';
        });

        let warnings = [];
        if (conflictRooms.length > 0)
            warnings.push(`⚠ ${conflictRooms.length} odada başka personel mevcut`);
        if (customerRooms.length > 0)
            warnings.push(`👤 ${customerRooms.length} odada müşteri var`);

        if (warnings.length > 0) {
            info.innerHTML = `<span style="color:#f59e0b;">${warnings.join(' &bull; ')} — yine de atanacak</span>`;
        } else {
            info.textContent = `${u.name} → ${selectedRooms.size} oda atanacak`;
        }
        btn.disabled = false;
    } else if (selectedUserId) {
        info.textContent = 'Oda seçiniz'; btn.disabled = true;
    } else if (selectedRooms.size > 0) {
        info.textContent = 'Personel seçiniz'; btn.disabled = true;
    } else {
        info.textContent = 'Lütfen personel ve oda seçiniz'; btn.disabled = true;
    }
}

async function assignRooms() {
    if (!selectedUserId || selectedRooms.size === 0) return;
    const btn = document.getElementById('btnAssign');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-sm"></span> Atanıyor...';
    document.getElementById('topbar-status').textContent = 'Kaydediliyor...';

    const payload = [...selectedRooms].map(roomId => {
        const r = allRooms.find(x => x.id === roomId);
        return {
            UserID:     selectedUserId,
            RoomId:     r.id,
            RoomNumber: r.number,
            BlockId:    r.blockId
        };
    });

    try {
        const res = await fetch('/AdminPanel/Assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) showToast('✓ ' + payload.length + ' oda başarıyla atandı!', 'success');
        else throw new Error('Sunucu hatası');
    } catch (e) {
        showToast('✗ Atanmış odalar başka kullanıcıda mevcut!', 'warning');
    }

    selectedRooms.clear();
    updateSelectedRoomTags();
    refreshRoomGrid();
    updateActionBar();
    document.getElementById('topbar-status').textContent = 'Hazır';
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">&#10003;</span> Oda Ata';
}

let toastTimer;
function showToast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + type + ' show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}
