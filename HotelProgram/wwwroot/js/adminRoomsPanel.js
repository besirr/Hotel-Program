// adminRoomsPanel.js

let activeBlock = "all";
let activeFloor = "all";

function setBlockFilter(blockId, el) {
    activeBlock = blockId;
    document.querySelectorAll("#filterChips .chip").forEach(c => c.classList.remove("active"));
    el.classList.add("active");
    applyFilters();
}

function setFloorFilter(floor, el) {
    activeFloor = floor;
    document.querySelectorAll("#floorChips .chip").forEach(c => c.classList.remove("active"));
    el.classList.add("active");
    applyFilters();
}

function applyFilters() {
    const q = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll("#roomTable tbody tr:not(#addRow)");
    let visible = 0;
    rows.forEach(r => {
        if (r.id === "emptyRow") return;
        const blockMatch = activeBlock === "all" || r.dataset.block === activeBlock;
        const floorMatch = activeFloor === "all" || r.dataset.floor === activeFloor;
        const textMatch  = r.textContent.toLowerCase().includes(q);
        const show = blockMatch && floorMatch && textMatch;
        r.style.display = show ? "" : "none";
        if (show) visible++;
    });
    document.getElementById("roomCount").textContent = visible + " oda";
}

function openAddRow() {
    const row = document.getElementById("addRow");
    row.style.display = "table-row";
    document.getElementById("new-RoomNumber").value = "";
    document.getElementById("new-BlockId").selectedIndex = 0;
    document.getElementById("new-IsActive").selectedIndex = 0;
    document.getElementById("new-RoomNumber").focus();
}

function closeAddRow() {
    document.getElementById("addRow").style.display = "none";
}

async function saveNewRoom() {
    const data = {
        RoomNumber: parseInt(document.getElementById("new-RoomNumber").value),
        BlockId: parseInt(document.getElementById("new-BlockId").value),
        IsActive: parseInt(document.getElementById("new-IsActive").value)
    };
    if (!data.RoomNumber || data.RoomNumber < 1) {
        alert("Lütfen geçerli bir oda numarası giriniz.");
        return;
    }
    try {
        const res = await fetch("/AdminPanel/AddRoom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (res.ok) location.reload();
        else alert("Oda Zaten Mevcut. Lütfen Oda Numarası ya da Bloğu değiştiriniz.");
    } catch (e) {
        alert("Bağlantı hatası: " + e.message);
    }
}

function startEdit(id) {
    const row = document.getElementById("row-" + id);
    row.classList.add("editing");
    row.querySelectorAll(".view-mode").forEach(el => el.style.display = "none");
    row.querySelectorAll(".edit-mode").forEach(el => el.style.display = "");
}

function cancelEdit(id) {
    const row = document.getElementById("row-" + id);
    row.classList.remove("editing");
    row.querySelectorAll(".view-mode").forEach(el => el.style.display = "");
    row.querySelectorAll(".edit-mode").forEach(el => el.style.display = "none");
}

async function saveEdit(id) {
    const row = document.getElementById("row-" + id);
    const data = {
        Id: id,
        RoomNumber: parseInt(row.querySelector("input[name='RoomNumber']").value),
        BlockId: parseInt(row.querySelector("select[name='BlockId']").value),
        IsActive: parseInt(row.querySelector("select[name='IsActive']").value)
    };
    try {
        const res = await fetch("/AdminPanel/UpdateRoom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (res.ok) location.reload();
        else alert("Oda Zaten Mevcut. Lütfen Oda Numarası ya da Bloğu değiştiriniz.");
    } catch (e) {
        alert("Bağlantı hatası: " + e.message);
    }
}
