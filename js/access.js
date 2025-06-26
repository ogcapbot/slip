(() => {
  const BASE_URL = "https://script.google.com/macros/s/AKfycbzbNo6fcQsDvPSlsaC9y1U3NsO214vuS-7a6EwhtFXi-sH3fHQaJawg6LDehcf4TCepkA/exec";

  const accessScreen = document.getElementById("access-screen");
  const pickTypeScreen = document.getElementById("pickTypeScreen");
  const accessCodeInput = document.getElementById("accessCode");
  const accessBtn = document.getElementById("accessBtn");
  const errorDiv = document.getElementById("error");

  async function loadCapperInfo() {
    try {
      const res = await fetch(BASE_URL + "?action=capperOnly");
      const result = await res.json();
      window.AppState.capperInfo = result.capperInfo || [];
      accessCodeInput.disabled = false;
      accessBtn.disabled = false;
      accessCodeInput.focus();
    } catch {
      errorDiv.textContent = "Failed to load access codes.";
    }
  }

  function validateAccess() {
    const code = accessCodeInput.value.trim();
    const match = window.AppState.capperInfo.find(row => row["Access Code"] === code);
    if (code.length < 4 || code.length > 10 || !match) {
      errorDiv.textContent = "Access Code Invalid. Please Enter a Valid Access Code.";
      return;
    }
    errorDiv.textContent = "";
    window.AppState.capperName = match["Display Name"];
    accessScreen.classList.add("hidden");
    pickTypeScreen.classList.remove("hidden");
  }

  accessBtn.addEventListener("click", validateAccess);
  accessCodeInput.addEventListener("input", e => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
  });
  accessCodeInput.addEventListener("keydown", e => {
    if (e.key === "Enter") validateAccess();
  });

  loadCapperInfo();
})();
