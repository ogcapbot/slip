// js/unit.js
(() => {
  // Handles unit selection dropdown and moves forward on selection

  const unitDropdownSection = document.getElementById("unitDropdownSection");
  const unitDropdown = document.getElementById("unitDropdown");
  const unitDropdownError = document.getElementById("unitDropdownError");

  function buildUnitDropdown() {
    const unitData = window.AppState.allData.units || [];
    unitDropdown.innerHTML = "";

    const defaultOpt = document.createElement("option");
    defaultOpt.textContent = "Select Unit Amount...";
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    unitDropdown.appendChild(defaultOpt);

    unitData.forEach(row => {
      const opt = document.createElement("option");
      opt.textContent = row.display_unit;
      opt.value = row.display_unit;
      unitDropdown.appendChild(opt);
    });

    if(unitDropdownSection.classList.contains("hidden")) {
      unitDropdownSection.classList.remove("hidden");
    }
  }

  unitDropdown.addEventListener("change", () => {
    const val = unitDropdown.value;
    if(!val || val === "Select Unit Amount...") {
      unitDropdownError.textContent = "Please select a valid unit amount.";
      return;
    }
    unitDropdownError.textContent = "";
    // Notify unit selection completed
    document.dispatchEvent(new CustomEvent("unitSelectionCompleted"));
  });

  document.addEventListener("unitSelectionStarted", () => {
    buildUnitDropdown();
  });
})();
