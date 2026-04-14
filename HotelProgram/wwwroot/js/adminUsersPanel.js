// adminUsersPanel.js

function filterTable() {
    const q = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll("#userTable tbody tr:not(#addRow):not(#emptyRow)");
    let visible = 0;
    rows.foreach(r => {
        const show = r.textContent.toLowerCase().includes(q);
        r.style.display = show ? "" : "none";
        if (show) visible++;
    });
    document.getElementById("userCount").textContent = visible + " kullanıcı";
}

function openAddRow() {
   
    document.getElementById("addRow").style.display = "table-row";
    ["new-TC","new-Username","new-UsernameLastname","new-Password"].forEach(id => {
        document.getElementById(id).value = "";
    });
    document.getElementById("new-Authority").value = "0";
    document.getElementById("new-IsActive").value = "0";
    document.getElementById("new-RoleID").value = "2";
    document.getElementById("new-TC").focus();
}

function closeAddRow() {
    document.getElementById("addRow").style.display = "none";
}

async function saveNewUser() {
    const tc       = document.getElementById("new-TC").value.trim();
    const username = document.getElementById("new-Username").value.trim();
    const fullname = document.getElementById("new-UsernameLastname").value.trim();
    const password = document.getElementById("new-Password").value.trim();

    if (!tc || !username || !fullname || !password) {
        alert("Lütfen tüm alanları doldurunuz.");
        return;
    }
    if (tc.length !== 11) {
        alert("TC Kimlik No 11 haneli olmalıdır.");
        return;
    }

    const data = {
        TC: tc,
        Username: username,
        UsernameLastname: fullname,
        Authority: parseInt(document.getElementById("new-Authority").value),
        IsActive: parseInt(document.getElementById("new-IsActive").value),
        RoleID: parseInt(document.getElementById("new-RoleID").value),
        Password: password
    };

    try {
        const res = await fetch("/AdminPanel/AddUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            location.reload();
        } else {
            alert("Kaydetme başarısız. Kullanıcı adı ya da TC zaten mevcut olabilir.");
        }
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
    const row      = document.getElementById("row-" + id);
    const tc       = row.querySelector("input[name='TC']").value.trim();
    const password = row.querySelector("input[name='Password']").value.trim();
    const username = row.querySelector("input[name='Username']").value.trim();
    const fullname = row.querySelector("input[name='UsernameLastname']").value.trim();
    const authority = parseInt(row.querySelector("select[name='Authority']").value);
    const isActive  = parseInt(row.querySelector("select[name='IsActive']").value);
    const roleID    = parseInt(row.querySelector("select[name='RoleID']").value);

    if (!tc || !username || !fullname || !password) {
        alert("Lütfen tüm alanları doldurunuz.");
        return;
    }
    if (tc.length !== 11) {
        alert("TC 11 haneli olmalıdır.");
        return;
    }
    if (password.length < 6) {
        alert("Şifre en az 6 karakter olmalıdır.");
        return;
    }

    const data = {
        ID: id,
        TC: tc,
        Username: username,
        UsernameLastname: fullname,
        Authority: authority,
        IsActive: isActive,
        RoleID: roleID,
        Password: password
    };

    try {
        const res = await fetch("/AdminPanel/UpdateUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            row.querySelector("span.td-tc").textContent       = tc;
            row.querySelector("span.td-username").textContent = username;
            row.querySelector("span.td-fullname").textContent = fullname;
            row.querySelector("span.td-password").textContent = password;

            row.querySelector("td:nth-child(4) .view-mode").innerHTML = authority === 1
                ? '<span class="badge badge-admin">&#11088; Admin</span>'
                : '<span class="badge badge-user">&#128100; Kullanıcı</span>';

            row.querySelector("td:nth-child(5) .view-mode").innerHTML = isActive === 1
                ? '<span class="badge badge-active">&#9679; Aktif</span>'
                : '<span class="badge badge-passive">&#9679; Pasif</span>';

            row.querySelector("td:nth-child(6) .view-mode").innerHTML = roleID === 1
                ? '<span class="badge badge-manager">&#127970; Müdür</span>'
                : roleID === 2
                ? '<span class="badge badge-cleaner">&#129529; Oda Temizlik Görevlisi</span>'
                : '<span class="badge badge-reception">&#128188; Resepsiyon Görevlisi</span>';

            cancelEdit(id);
        } else {
            alert("Bu TC veya kullanıcı adı zaten başka bir kullanıcıda var.");
        }
    } catch (e) {
        alert("Bağlantı hatası: " + e.message);
    }
}
