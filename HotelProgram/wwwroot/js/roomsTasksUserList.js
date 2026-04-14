// roomsTasksUserList.js
// userList ve roomList değişkenleri cshtml tarafından bu dosyadan önce tanımlanmış olmalıdır.

let currentFilter = "all";

function setFilter(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filterTable();
}

function filterTable() {
    const q = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll("#mainTable tbody tr:not(#emptyRow)");
    let visible = 0;
    rows.forEach(r => {
        const matchSearch = r.textContent.toLowerCase().includes(q);
        const status = r.dataset.status;
        const matchFilter =
            currentFilter === "all" ||
            (currentFilter === "active" && status === "active") ||
            (currentFilter === "done"   && status === "done");

        const show = matchSearch && matchFilter;
        r.style.display = show ? "" : "none";
        if (show) visible++;
    });
    document.getElementById("rowCount").textContent     = visible + " kayıt";
    document.getElementById("footerCount").textContent  = visible + " kayıt gösteriliyor";
}

function startEdit(id) {
    const row = document.getElementById("row-" + id);
    row.classList.add("editing");
    row.querySelectorAll(".view-mode").forEach(el => el.style.display = "none");
    row.querySelectorAll(".edit-mode").forEach(el => el.style.display = "");

    // Kullanıcı dropdown
    const userSelect    = row.querySelector("select[name='UserSelect']");
    const currentUserID = parseInt(row.querySelector("input[name='UserID']").value);
    userSelect.innerHTML = "";
    userList.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.ID;
        opt.textContent = u.Username;
        opt.dataset.fullname = u.UsernameLastname;
        if (u.ID === currentUserID) opt.selected = true;
        userSelect.appendChild(opt);
    });
    const selectedUser = userList.find(u => u.ID === currentUserID);
    if (selectedUser) {
        row.querySelector(".td-fullname-edit").textContent         = selectedUser.UsernameLastname;
        row.querySelector("input[name='UsernameLastname']").value  = selectedUser.UsernameLastname;
    }

    // Oda dropdown
    const roomSelect       = row.querySelector("select[name='RoomSelect']");
    const currentRoomNumber = parseInt(row.dataset.room);
    const currentBlockId    = parseInt(row.dataset.block);
    roomSelect.innerHTML = "";
    roomList.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.Id;
        opt.textContent = r.BlockName + " - " + r.RoomNumber;
        opt.dataset.roomNumber = r.RoomNumber;
        opt.dataset.blockId    = r.BlockId;
        opt.dataset.blockName  = r.BlockName;
        if (r.RoomNumber === currentRoomNumber && r.BlockId === currentBlockId) opt.selected = true;
        roomSelect.appendChild(opt);
    });
    const currentRoom = roomList.find(r => r.RoomNumber === currentRoomNumber && r.BlockId === currentBlockId);
    if (currentRoom) {
        row.querySelector(".td-blockname-edit").textContent = currentRoom.BlockName;
    }
}

function cancelEdit(id) {
    const row = document.getElementById("row-" + id);
    row.classList.remove("editing");
    row.querySelectorAll(".view-mode").forEach(el => el.style.display = "");
    row.querySelectorAll(".edit-mode").forEach(el => el.style.display = "none");
}

function onUserChange(select, rowId) {
    const row = document.getElementById("row-" + rowId);
    const selectedOpt = select.options[select.selectedIndex];
    row.querySelector(".td-fullname-edit").textContent        = selectedOpt.dataset.fullname;
    row.querySelector("input[name='UsernameLastname']").value = selectedOpt.dataset.fullname;
    row.querySelector("input[name='UserID']").value           = parseInt(select.value);
    row.querySelector(".td-userid-edit").textContent          = select.value;
}

function onRoomChange(select, rowId) {
    const row = document.getElementById("row-" + rowId);
    const selectedOpt = select.options[select.selectedIndex];
    row.querySelector("input[name='RoomNumber']").value  = selectedOpt.dataset.roomNumber;
    row.querySelector("input[name='BlockId']").value     = selectedOpt.dataset.blockId;
    row.querySelector(".td-blockname-edit").textContent  = selectedOpt.dataset.blockName;
}

async function saveEdit(id) {
    const row        = document.getElementById("row-" + id);
    const userSelect = row.querySelector("select[name='UserSelect']");
    const username   = userSelect.options[userSelect.selectedIndex].textContent;
    const fullname   = row.querySelector("input[name='UsernameLastname']").value;
    const userID     = parseInt(row.querySelector("input[name='UserID']").value);
    const roomNumber = parseInt(row.querySelector("input[name='RoomNumber']").value);
    const blockId    = parseInt(row.querySelector("input[name='BlockId']").value);
    const atanma     = row.querySelector("input[name='AtanmaTarihi']").value;
    const bitme      = row.querySelector("input[name='BitmeTarihi']").value;

    if (!username || !roomNumber || !atanma) {
        alert("Lütfen zorunlu alanları doldurunuz.");
        return;
    }

    const data = {
        ID: id,
        Username: username,
        UsernameLastname: fullname,
        UserID: userID,
        RoomNumber: roomNumber,
        BlockId: blockId,
        AtanmaTarihi: atanma,
        BitmeTarihi: bitme || null,
        IsActive: bitme ? 0 : 1
    };

    try {
        const res = await fetch("/AdminPanel/UpdateRoomsAndUserTask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            const roomOpt   = roomList.find(r => r.RoomNumber === roomNumber && r.BlockId === blockId);
            const blockName = roomOpt ? roomOpt.BlockName : "";

            row.dataset.room   = roomNumber;
            row.dataset.block  = blockId;
            row.dataset.status = bitme ? "done" : "active";

            row.querySelector("span.td-username").textContent = username;
            row.querySelector("span.td-fullname").textContent = fullname;
            row.querySelector("span.td-userid").textContent   = userID;
            row.querySelector(".td-blockname .badge-room").textContent = blockName;
            row.querySelector("td:nth-child(6) .view-mode").innerHTML =
                `<span class="badge badge-room">${roomNumber}</span>`;

            if (atanma) {
                const d = new Date(atanma);
                row.querySelector("td:nth-child(7) .view-mode").innerHTML =
                    `<div class="date-cell">${formatDate(d)}<div class="time">${formatTime(d)}</div></div>`;
            }
            if (bitme) {
                const d = new Date(bitme);
                row.querySelector("td:nth-child(8) .view-mode").innerHTML =
                    `<div class="date-cell">${formatDate(d)}<div class="time">${formatTime(d)}</div></div>`;
                row.querySelector("td:nth-child(9) .view-mode").innerHTML =
                    `<span class="badge badge-passive">&#9679; Tamamlandı</span>`;
            } else {
                row.querySelector("td:nth-child(8) .view-mode").innerHTML =
                    `<span style="color:var(--text-light);">—</span>`;
                row.querySelector("td:nth-child(9) .view-mode").innerHTML =
                    `<span class="badge badge-active">&#9679; Aktif</span>`;
            }

            cancelEdit(id);
        } else {
            alert("Kaydetme başarısız. Lütfen bilgileri kontrol ediniz.");
        }
    } catch (e) {
        alert("Bağlantı hatası: " + e.message);
    }
}

function formatDate(d) {
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatTime(d) {
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}
