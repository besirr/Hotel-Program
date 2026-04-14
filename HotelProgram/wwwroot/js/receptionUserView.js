// receptionUserView.js
// allRez değişkeni cshtml tarafından bu dosyadan önce tanımlanmış olmalıdır.

// ── FILTER ──────────────────────────────────────
let currentFilter = 'all';
function setFilter(f, btn) {
    currentFilter = f;
    document.querySelectorAll('.rez-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterTable();
}
function filterTable() {
    const q = (document.getElementById('searchInput').value || '').toLowerCase();
    document.querySelectorAll('#rezTable tbody tr[id]').forEach(r => {
        const ok = (currentFilter === 'all' || r.dataset.status === currentFilter)
                && r.textContent.toLowerCase().includes(q);
        r.style.display = ok ? '' : 'none';
    });
}

// ── ADD MODAL ────────────────────────────────────
let personCount = 1;
function openAddModal() {
    ['add-room','add-checkin','add-checkout','add-fee'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('add-deposit').value   = '0';
    document.getElementById('add-remaining').value = '₺0';
    document.getElementById('add-date-error').style.display    = 'none';
    document.getElementById('add-deposit-error').style.display = 'none';
    document.querySelectorAll('.count-btn').forEach((b,i) => b.classList.toggle('active', i===0));
    personCount = 1;
    renderCustomerForms(1);
    document.getElementById('addOverlay').classList.add('open');
}
function closeAddModal()
    {
        document.getElementById('addOverlay').classList.remove('open');
    }
function closeAddOutside(e)
    {
        if (e.target === document.getElementById('addOverlay')) closeAddModal();
    }

function setPersonCount(n, btn) {
    personCount = n;
    document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCustomerForms(n);
}
function renderCustomerForms(n) {
    let html = '';
    for (let i = 0; i < n; i++) {
        html += `<div class="customer-form-block">
            <div class="customer-form-title">Müşteri ${i+1}</div>
            <div class="form-grid">
                <div class="form-group"><label>Ad Soyad <span class="req">*</span></label><input type="text" class="c-name" placeholder="Ad Soyad" /></div>
                <div class="form-group"><label>TC <span class="req">*</span></label><input type="text" class="c-tc" maxlength="11" oninput="this.value=this.value.replace(/\\D/g,'')" placeholder="11 haneli TC" /></div>
                <div class="form-group"><label>Telefon</label><input type="text" class="c-phone" placeholder="05xx xxx xx xx" /></div>
                <div class="form-group"><label>Doğum Tarihi</label><input type="date" class="c-birthday" /></div>
            </div>
        </div>`;
    }
    document.getElementById('customerForms').innerHTML = html;
}
function validateAddDates() {
    const ci=document.getElementById('add-checkin').value, co=document.getElementById('add-checkout').value;
    const err=document.getElementById('add-date-error');
    if (ci&&co&&co<=ci){err.style.display='block';return false;}
    err.style.display='none'; return true;
}
function updateAddDeposit() {
    const fee = parseFloat(document.getElementById('add-fee').value)||0;
    const dep = parseFloat(document.getElementById('add-deposit').value)||0;
    document.getElementById('add-remaining').value = '₺' + Math.max(0, fee-dep).toLocaleString('tr-TR');
}
function validateAddDeposit() {
    const fee = parseFloat(document.getElementById('add-fee').value)||0;
    const dep = parseFloat(document.getElementById('add-deposit').value)||0;
    const err = document.getElementById('add-deposit-error');
    updateAddDeposit();
    if (dep > fee) { err.style.display='block'; return false; }
    err.style.display='none'; return true;
}
async function saveNewReservations() {
    if (!validateAddDates() || !validateAddDeposit()) return;
    const roomSel  = document.getElementById('add-room');
    const roomNum  = parseInt(roomSel.value);
    const blockId  = parseInt(roomSel.selectedOptions[0]?.dataset.blockid||'0');
    const checkIn  = document.getElementById('add-checkin').value;
    const checkOut = document.getElementById('add-checkout').value;
    const fee      = parseFloat(document.getElementById('add-fee').value);
    const deposit  = parseFloat(document.getElementById('add-deposit').value)||0;
    if (!roomNum||!checkIn||!checkOut||isNaN(fee)){alert('Ortak alanları eksiksiz doldurun.');return;}
    const names    = document.querySelectorAll('.c-name');
    const tcs      = document.querySelectorAll('.c-tc');
    const phones   = document.querySelectorAll('.c-phone');
    const birthdays= document.querySelectorAll('.c-birthday');
    const payload  = [];
    for(let i=0;i<personCount;i++){
        const name=names[i].value.trim(), tc=tcs[i].value.trim();
        if(!name||!tc){alert(`Müşteri ${i+1}: Ad ve TC zorunludur.`);return;}
        if(tc.length!==11){alert(`Müşteri ${i+1}: TC 11 haneli olmalıdır.`);return;}
        payload.push({RoomNumber:roomNum,BlockID:blockId,FeePaid:fee,DepositAmount:deposit,
            CustomerTC:tc,NameAndSurname:name,
            Phone:phones[i].value.trim()||null,
            BirthdayDate:birthdays[i].value||null,
            CheckInDate:checkIn,CheckOutDate:checkOut,Status:1});
    }
    try {
        const res=await fetch('/UserPanel/AddReservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        if(res.ok){location.reload();}else{alert('Hata: '+(await res.text()));}
    } catch(e){alert('Bağlantı hatası: '+e.message);}
}

// ── EDIT MODAL ───────────────────────────────────
function openEditModal(id) {
    const r=allRez.find(x=>x.id===id);
    if(!r) return;
    document.getElementById('edit-id').value       = r.id;
    document.getElementById('edit-name').value     = r.name;
    document.getElementById('edit-tc').value       = r.customerTC;
    document.getElementById('edit-phone').value    = r.phone;
    document.getElementById('edit-birthday').value = r.birthday;
    document.getElementById('edit-checkin').value  = r.checkIn;
    document.getElementById('edit-checkout').value = r.checkOut;
    document.getElementById('edit-fee').value      = r.feePaid;
    document.getElementById('edit-status').value   = r.status;
    const rs=document.getElementById('edit-room');
    for(let o of rs.options){
        if(parseInt(o.value)===r.roomNumber&&parseInt(o.dataset.blockid)===r.blockID){o.selected=true;break;}
    }
    document.getElementById('edit-date-error').style.display='none';
    document.getElementById('editOverlay').classList.add('open');
}
function closeEditModal()    {document.getElementById('editOverlay').classList.remove('open');}
function closeEditOutside(e) {if(e.target===document.getElementById('editOverlay'))closeEditModal();}
function validateEditDates() {
    const ci=document.getElementById('edit-checkin').value, co=document.getElementById('edit-checkout').value;
    const err=document.getElementById('edit-date-error');
    if(ci&&co&&co<=ci){err.style.display='block';return false;}
    err.style.display='none';return true;
}
async function saveEdit() {
    if(!validateEditDates()) return;
    const rs=document.getElementById('edit-room');
    const data={
        ID:parseInt(document.getElementById('edit-id').value),
        RoomNumber:parseInt(rs.value),
        BlockID:parseInt(rs.selectedOptions[0]?.dataset.blockid||'0'),
        FeePaid:parseFloat(document.getElementById('edit-fee').value),
        DepositAmount: allRez.find(x=>x.id===parseInt(document.getElementById('edit-id').value))?.depositAmount??0,
        CustomerTC:document.getElementById('edit-tc').value.trim(),
        NameAndSurname:document.getElementById('edit-name').value.trim(),
        Phone:document.getElementById('edit-phone').value.trim()||null,
        BirthdayDate:document.getElementById('edit-birthday').value||null,
        CheckInDate:document.getElementById('edit-checkin').value,
        CheckOutDate:document.getElementById('edit-checkout').value,
        Status:parseInt(document.getElementById('edit-status').value)
    };
    if(!data.CustomerTC||data.CustomerTC.length!==11){alert('TC 11 haneli olmalıdır.');return;}
    if(!data.NameAndSurname){alert('Ad Soyad zorunludur.');return;}
    if(!data.RoomNumber){alert('Oda seçiniz.');return;}
    try{
        const res=await fetch('/UserPanel/UpdateReservation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
        if(res.ok){location.reload();}else{alert('Hata: '+(await res.text()));}
    }catch(e){alert('Bağlantı hatası: '+e.message);}
}

// ── CHECK-IN / CHECK-OUT ─────────────────────────
async function doCheckIn(id) {
    if(!confirm('Check-in işlemi yapılsın mı?')) return;
    const res=await fetch('/UserPanel/CheckIn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(id)});
    if(res.ok){location.reload();}else{alert('Hata: '+(await res.text()));}
}
async function doCheckOut(id) {
    if(!confirm('Check-out işlemi yapılsın mı?')) return;
    const res=await fetch('/UserPanel/CheckOut',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(id)});
    if(res.ok){location.reload();}else{alert('Hata: '+(await res.text()));}
}

// ── TRANSFER MODAL ───────────────────────────────
function openTransferModal(id) {
    document.getElementById('transfer-id').value   = id;
    document.getElementById('transfer-room').value = '';
    document.getElementById('transferOverlay').classList.add('open');
}
function closeTransferModal()    {document.getElementById('transferOverlay').classList.remove('open');}
function closeTransferOutside(e) {if(e.target===document.getElementById('transferOverlay'))closeTransferModal();}
async function saveTransfer() {
    const id     =parseInt(document.getElementById('transfer-id').value);
    const rs     =document.getElementById('transfer-room');
    const roomNum=parseInt(rs.value);
    const blockId=parseInt(rs.selectedOptions[0]?.dataset.blockid||'0');
    if(!roomNum){alert('Yeni oda seçiniz.');return;}
    const data={ID:id, NewRoomNumber:roomNum, NewBlockID:blockId};
    try{
        const res=await fetch('/UserPanel/TransferRoom',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
        if(res.ok){location.reload();}else{alert('Hata: '+(await res.text()));}
    }catch(e){alert('Bağlantı hatası: '+e.message);}
}

// ── PAYMENT MODAL ────────────────────────────────
function openPaymentModal(id) {
    const r=allRez.find(x=>x.id===id);
    if(!r) return;
    document.getElementById('payment-id').value       = r.id;
    document.getElementById('payment-total').value    = '₺'+r.feePaid.toLocaleString('tr-TR');
    document.getElementById('payment-deposit').value  = r.depositAmount;
    document.getElementById('payment-remaining').value= '₺'+(r.feePaid-r.depositAmount).toLocaleString('tr-TR');
    document.getElementById('payment-error').style.display='none';
    document.getElementById('paymentOverlay').classList.add('open');
}
function closePaymentModal()    {document.getElementById('paymentOverlay').classList.remove('open');}
function closePaymentOutside(e) {if(e.target===document.getElementById('paymentOverlay'))closePaymentModal();}
function updatePaymentRemaining() {
    const id=parseInt(document.getElementById('payment-id').value);
    const r=allRez.find(x=>x.id===id);
    if(!r) return;
    const dep=parseFloat(document.getElementById('payment-deposit').value)||0;
    const err=document.getElementById('payment-error');
    if(dep>r.feePaid){err.style.display='block';}else{err.style.display='none';}
    document.getElementById('payment-remaining').value='₺'+Math.max(0,r.feePaid-dep).toLocaleString('tr-TR');
}
async function savePayment() {
    const id =parseInt(document.getElementById('payment-id').value);
    const dep=parseFloat(document.getElementById('payment-deposit').value)||0;
    const r  =allRez.find(x=>x.id===id);
    if(r&&dep>r.feePaid){alert('Ön ödeme toplam ücretten fazla olamaz.');return;}
    try{
        const res=await fetch('/UserPanel/UpdatePayment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ID:id,DepositAmount:dep})});
        if(res.ok){location.reload();}else{alert('Hata: '+(await res.text()));}
    }catch(e){alert('Bağlantı hatası: '+e.message);}
}

// ── DELETE ───────────────────────────────────────
async function deleteRez(id) {
    if(!confirm('Bu rezervasyonu silmek istediğinize emin misiniz?')) return;
    try{
        const res=await fetch('/UserPanel/DeleteReservation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(id)});
        if(res.ok){document.getElementById('row-'+id)?.remove();}else{alert('Silme başarısız.');}
    }catch(e){alert('Bağlantı hatası: '+e.message);}
}

document.addEventListener('DOMContentLoaded', () => renderCustomerForms(1));
