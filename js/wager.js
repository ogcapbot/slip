// wager.js

function buildWagerDropdown() {
  const wagerData = (allData.wagers || []).filter(row => row.active_status === 'active');
  const inputDiv = document.getElementById("customInputSection");

  inputDiv.innerHTML = `
    <label for="wagerDropdown" style="color:#666;font-size:14px;margin-bottom:5px;display:block;">
      Select Wager Type Below:
    </label>
    <select id="wagerDropdown"></select>
    <div class="error" id="wagerError"></div>
  `;

  const dropdown = document.getElementById("wagerDropdown");

  const defaultOpt = document.createElement("option");
  defaultOpt.textContent = "Select Item Below";
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  dropdown.appendChild(defaultOpt);

  const isOverride = !!window.overrideTeamName;

  let filteredWagerData = wagerData;

  if (!isOverride) {
    const detectedSport = selectedMatch?.["League (Group)"]?.trim() || "";
    filteredWagerData = wagerData.filter(row => {
      const rowSport = (row.Sport || "").trim();
      return !rowSport || rowSport.toLowerCase() === detectedSport.toLowerCase();
    });
  }

  filteredWagerData.forEach(row => {
    const opt = document.createElement("option");
    opt.textContent = row.wager_label_template;
    opt.value = row.wager_label_template;
    opt.dataset.requiresNumber = row.pick_desc_template.includes("[[NUM]]") ? "yes" : "no";
    dropdown.appendChild(opt);
  });

  const otherOpt = document.createElement("option");
  otherOpt.textContent = "Other (Manual Entry Override)";
  otherOpt.value = "__other";
  dropdown.appendChild(otherOpt);

  dropdown.addEventListener("change", () => {
    const selected = dropdown.value;
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const requiresNumber = selectedOption.dataset.requiresNumber === "yes";

    if (selected === "__other") {
      inputDiv.innerHTML = `
        <label for="wagerType" style="color:#666;font-size:14px;margin-bottom:5px;display:block;">
          Enter Wager Type (e.g. 'ML' or 'F5')
        </label>
        <input type="text" id="wagerType" />
        <button onclick="submitWagerType()">Submit</button>
        <div class="error" id="wagerError"></div>
      `;
      document.getElementById("unitDropdownSection").classList.add("hidden");
    } else {
      if (requiresNumber && selected.includes("[[NUM]]")) {
        showNumInputScreen(selected);
      } else {
        document.getElementById("customInputSection").classList.add("hidden");
        if (!requiresNumber) {
          buildUnitDropdown();
          document.getElementById("unitDropdownSection").classList.remove("hidden");
        }
      }
    }
  });
}

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

function showNumInputScreen(wagerTemplate) {
  const inputDiv = document.getElementById("customInputSection");
  inputDiv.innerHTML = `
    <label for="numInput" style="color:#666;font-size:14px;margin-bottom:5px;display:block;" id="numInputLabel"></label>
    <input type="number" id="numInput" step="0.5" min="0.5" max="300" inputmode="decimal" pattern="^(0\\.5|[1-9][0-9]*([.]5)?)$" />
    <div class="error" id="numInputError"></div>
    <button id="numSubmitBtn">Submit</button>
  `;

  const label = document.getElementById("numInputLabel");
  const previousVal = wagerTemplate;
  label.textContent = `Enter the amount for [[NUM]] (${previousVal})`;

  const numInput = document.getElementById("numInput");

  setTimeout(() => {
    numInput.focus();
  }, 100);
  numInput.click();

  numInput.addEventListener("input", () => {
    let val = numInput.value;
    const errorDiv = document.getElementById("numInputError");
    errorDiv.textContent = "";

    if (val === "") return;

    const num = parseFloat(val);
    if (isNaN(num) || num < 0.5 || num > 300 || (num * 2) % 1 !== 0) {
      errorDiv.textContent = "Please enter a positive number up to 300 in 0.5 increments (e.g. 0.5, 1, 1.5).";
    }
  });

  document.getElementById("numSubmitBtn").onclick = () => {
    const val = numInput.value.trim();
    const errorDiv = document.getElementById("numInputError");

    if (!val) {
      errorDiv.textContent = "Please enter a value.";
      numInput.focus();
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num < 0.5 || num > 300 || (num * 2) % 1 !== 0) {
      errorDiv.textContent = "Please enter a positive number up to 300 in 0.5 increments (e.g. 0.5, 1, 1.5).";
      numInput.focus();
      return;
    }

    window.currentWagerWithNum = wagerTemplate.replace(/\[\[NUM\]\]/g, val);

    errorDiv.textContent = "";
    document.getElementById("customInputSection").classList.add("hidden");
    buildUnitDropdown();
    document.getElementById("unitDropdownSection").classList.remove("hidden");
    document.getElementById("unitDropdown").focus();
  };
}

document.getElementById("wagerType")?.addEventListener("keydown", e => {
  if (e.key === "Enter") submitWagerType();
});
