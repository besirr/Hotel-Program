// userRoomsTasks.js

document.getElementById('searchInput').addEventListener('input', function () {
    filterRows();
});

document.querySelectorAll('.urt-filter').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.urt-filter').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        filterRows();
    });
});

function filterRows() {
    const query  = document.getElementById('searchInput').value.toLowerCase();
    const filter = document.querySelector('.urt-filter.active')?.dataset.filter ?? 'all';
    const rows   = document.querySelectorAll('#taskTable tbody tr[data-id]');
    let visible  = 0;

    rows.forEach(row => {
        const text   = row.textContent.toLowerCase();
        const status = row.dataset.status;

        const matchSearch = text.includes(query);
        const matchFilter = filter === 'all' ||
                            (filter === 'active' && status === 'active') ||
                            (filter === 'done'   && status === 'done');

        if (matchSearch && matchFilter) {
            row.style.display = '';
            visible++;
        } else {
            row.style.display = 'none';
        }
    });

    document.getElementById('rowCount').textContent    = visible + ' görev';
    document.getElementById('tableFooter').textContent = visible + ' kayıt gösteriliyor';
}

function startEdit(btn) {
    const row = btn.closest('tr');
    row.classList.add('editing');

    row.querySelector('.view-mode').style.display  = 'none';
    row.querySelector('.edit-mode').style.display  = 'flex';
    row.querySelector('.btn-view').style.display   = 'none';
    row.querySelector('.btn-edit').style.display   = 'flex';
    row.querySelector('.td-status .urt-status').className   = 'urt-status urt-status--editing';
    row.querySelector('.td-status .urt-status').textContent = 'Düzenleniyor';
}

function cancelEdit(btn) {
    const row    = btn.closest('tr');
    const status = row.dataset.status;
    row.classList.remove('editing');

    row.querySelector('.view-mode').style.display = '';
    row.querySelector('.edit-mode').style.display = 'none';
    row.querySelector('.btn-view').style.display  = '';
    row.querySelector('.btn-edit').style.display  = 'none';

    const statusEl = row.querySelector('.td-status .urt-status');
    if (status === 'done') {
        statusEl.className   = 'urt-status urt-status--done';
        statusEl.textContent = 'Tamamlandı';
    } else {
        statusEl.className   = 'urt-status urt-status--active';
        statusEl.textContent = 'Aktif';
    }
}

function saveEdit(btn) {
    const row    = btn.closest('tr');
    const id     = parseInt(row.dataset.id);
    const atanma = row.dataset.atanma;
    const input  = row.querySelector('.bitme-input');
    const value  = input.value;

    if (value && value <= atanma) {
        input.classList.add('urt-input-error');
        alert('Bitiş tarihi atanma tarihinden önce olamaz!');
        return;
    }
    input.classList.remove('urt-input-error');

    const payload = {
        ID: id,
        BitmeTarihi: value ? value : null
    };

    fetch('/UserPanel/UpdateBitmeTarihi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(r => {
        if (!r.ok) throw new Error('Sunucu hatası');
        return r;
    })
    .then(() => {
        const viewSpan = row.querySelector('.view-mode span');
        if (value) {
            const d = new Date(value);
            viewSpan.textContent = d.toLocaleDateString('tr-TR') + ' ' +
                                   d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            row.dataset.status = 'done';
        } else {
            viewSpan.textContent = '—';
            row.dataset.status = 'active';
        }
        cancelEdit(btn);
    })
    .catch(err => {
        alert('Kayıt sırasında hata oluştu: ' + err.message);
    });
}
