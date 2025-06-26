function submitWagerType() {
  const wager = document.getElementById("wagerType").value.trim();
  const errorBox = document.getElementById("wagerError");

  const valid = /^[A-Za-z0-9 .]+$/.test(wager) && wager.length > 0;
  if (!valid) {
    errorBox.textContent = "The information entered does not conform to the standard or was left blank. Please check your entry, and try again.";
    return;
  }

  errorBox.textContent = "";

  document.getElementById("customInputSection").classList.add("hidden");
  document.getElementById("unitDropdownSection").classList.remove("hidden");

  buildUnitDropdown();

  document.getElementById("unitDropdownSection").classList.remove("hidden");
  document.getElementById("unitDropdown").focus();
}

document.addEventListener("DOMContentLoaded", () => {
  const wagerType = document.getElementById("wagerType");
  if (wagerType) {
    wagerType.addEventListener("keydown", e => {
      if (e.key === "Enter") submitWagerType();
    });
  }
});
