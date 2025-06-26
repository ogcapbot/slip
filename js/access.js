// access.js
const BASE_URL = "https://script.google.com/macros/s/AKfycbzbNo6fcQsDvPSlsaC9y1U3NsO214vuS-7a6EwhtFXi-sH3fHQaJawg6LDehcf4TCepkA/exec";
let capperInfo = [], capperName = "";

window.onload = async () => {
  try {
    const res = await fetch(BASE_URL + "?action=capperOnly");
    const result = await res.json();
    capperInfo = result.capperInfo;

    document.getElementById("accessCode").disabled = false;
    document.getElementById("accessBtn").disabled = false;
    document.getElementById("accessCode").focus();
  } catch {
    document.getElementById("error").textContent = "Failed to load access codes.";
  }
};

function validateAccess() {
  const code = document.getElementById("accessCode").value.trim();
  const match = capperInfo.find(row => row["Access Code"] == code);
  if (code.length < 4 || code.length > 10 || !match) {
    document.getElementById("error").textContent = "Access Code Invalid. Please Enter a Valid Access Code.";
    return;
  }

  capperName = match["Display Name"];
  document.getElementById("access-screen").classList.add("hidden");
  document.getElementById("sports-screen").classList.remove("hidden");

  Array.from(document.querySelectorAll("#sports-screen > *")).forEach(el => {
    if (el.id !== "loader" && el.id !== "loadingMsg") {
      el.style.display = "none";
    }
  });

  loadAllData();
}

document.addEventListener("DOMContentLoaded", () => {
  const accessBtn = document.getElementById("accessBtn");
  const accessCode = document.getElementById("accessCode");

  accessBtn.addEventListener("click", validateAccess);

  accessCode.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
    if (e.target.value.length > 10) {
      e.target.value = e.target.value.slice(0, 10);
    }
  });

  accessCode.addEventListener("keydown", e => {
    if (e.key === "Enter") validateAccess();
  });
});
