// profile.js

function showAlert(msg, type) {
    const box = document.getElementById("alertBox");
    box.textContent = msg;
    box.className = "alert " + type + " show";
    setTimeout(() => box.className = "alert", 10000);
}

function clearForm() {
    document.getElementById("CurrentPassword").value = "";
    document.getElementById("newPassword").value     = "";
    document.getElementById("confirmPassword").value = "";
}

async function changePassword(userId) {/////////////////////////
    const current = document.getElementById("CurrentPassword").value.trim();
    const newPw   = document.getElementById("newPassword").value.trim();
    const confirm = document.getElementById("confirmPassword").value.trim();

    if (!current || !newPw || !confirm) { showAlert("Lutfen tum alanlari doldurun.", "error"); return; }
    if (current === newPw || newPw !== confirm) {
        showAlert("Yeni şifre eski şifreyle aynı olamaz veya şifreler uyuşmuyor.", "error");
        return;
    }
    if (newPw.length < 12) {
        showAlert("Sifre en az 12 karakter olmalidir.", "error"); return;
    }

    try {
        const res = await fetch("/LoginHave/ChangePassword", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: userId, CurrentPassword: current, newPassword: newPw })
        });

        if (res.ok)                  { showAlert("Sifreniz basariyla guncellendi.", "success"); clearForm(); }
        else if (res.status === 400) { showAlert("Mevcut sifre yanlis.", "error"); }
        else                         { showAlert("Bir hata olustu. Tekrar deneyin.", "error"); }
    } catch (e) {
        showAlert("Baglanti hatasi: " + e.message, "error");
    }
}
