// layout.js

const btn     = document.getElementById("hamburgerBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

function toggleMenu() {
    const open = sidebar.classList.toggle("open");
    btn.classList.toggle("open", open);
    overlay.classList.toggle("active", open);
}

if (btn)     btn.addEventListener("click", toggleMenu);
if (overlay) overlay.addEventListener("click", toggleMenu);
