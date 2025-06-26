// unit.js

function buildUnitDropdown() {
  const unitData = allData.units || [];

  const dropdown = document.getElementById("unitDropdown");
  const section = document.getElementById("unitDropdownSection");

  dropdown.innerHTML = "";

  const defaultOpt = document.createElement("option");
  defaultOpt.textContent = "Select Unit Amount...";
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  dropdown.appendChild(defaultOpt);

  unitData.forEach(row => {
    const opt = document.createElement("option");
    opt.textContent = row.display_unit;
    opt.value = row.display_unit;
    dropdown.appendChild(opt);
  });

  if (section.classList.contains("hidden")) {
    section.classList.remove("hidden");
  }
}

function submitUnitAmount(bypass = false) {
  const dropdown = document.getElementById("unitDropdown");
  const input = dropdown ? dropdown.value : "";
  const errorDiv = document.getElementById("unitDropdownError");

  if (!input || input === "Select Unit(s)") {
    errorDiv.textContent = "Please select a valid unit amount.";
    return;
  }

  errorDiv.textContent = "";
  document.getElementById("unitDropdownSection").classList.remove("hidden");

  document.getElementById("unitDropdownSection").classList.add("hidden");
  document.getElementById("notesChoiceSection").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  const unitDropdown = document.getElementById("unitDropdown");
  if (unitDropdown) {
    unitDropdown.addEventListener("change", () => {
      submitUnitAmount();
    });
  }
});
