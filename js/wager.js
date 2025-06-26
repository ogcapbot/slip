// js/wager.js
(() => {
  // Listens for 'proceedToWager' event and shows wager input UI
  const sportsScreen = document.getElementById("sports-screen");

  document.addEventListener("proceedToWager", () => {
    buildWagerDropdown();
    showWagerSection();
  });

  function showWagerSection() {
    const customInputSection = document.getElementById("customInputSection");
    customInputSection.classList.remove("hidden");
  }

  function buildWagerDropdown() {
    const wagerData = (window.AppState.allData.wagers || []).filter(row => row.active_status === 'active');
    const customInputSection = document.getElementById("customInputSection");

    customInputSection.innerHTML = `
      <label for="wagerDropdown" style="color:#666;font-size:14px;margin-bottom:5px;display:block;">
        Select Wager Type Below:
      </label>
      <select id="wagerDropdown" style="width: 100%; max-width: 400px; box-sizing: border-box; padding: 12px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;"></select>
      <div class="error" id="wagerError" style="color:red; font-size:14px; margin-top: 5px;"></div>
    `;

    const dropdown = document.getElementById("wagerDropdown");
    const defaultOpt = document.createElement("option");
    defaultOpt.textContent = "Select Item Below";
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    dropdown.appendChild(defaultOpt);

    const isOverride = !!window.AppState.overrideTeamName;
    let filteredWagerData = wagerData;

    if (!isOverride) {
      const detectedSport = window.AppState.selectedMatch?.["League (Group)"]?.trim() || "";
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
        showManualWagerInput();
      } else if (requiresNumber && selected.includes("[[NUM]]")) {
        showNumInputScreen(selected);
      } else {
        hideManualWagerInput();
        document.getElementById("unitDropdownSection").classList.remove("hidden");
        document.dispatchEvent(new CustomEvent("unitSelectionStarted"));
      }
    });
  }

  function showManualWagerInput() {
    const customInputSection = document.getElementById("customInputSection");
    customInputSection.innerHTML = `
      <label for="wagerType" style="color:#666;font-size:14px;margin-bottom:5px;display:block;">
        Enter Wager Type (e.g. 'ML' or 'F5')
      </label>
      <input type="text" id="wagerType" style="width: 100%; max-width: 400px; box-sizing: border-box; padding: 12px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;" />
      <button id="wagerTypeSubmitBtn">Submit</button>
      <div class="error" id="wagerError" style="color:red; font-size:14px; margin-top: 5px;"></div>
    `;

    document.getElementById("wagerTypeSubmitBtn").addEventListener("click", submitWagerType);
  }

  function hideManualWagerInput() {
    // restore wager dropdown for next usage
    buildWagerDropdown();
  }

  function submitWagerType() {
    const wagerTypeInput = document.getElementById("wagerType");
    const errorBox = document.getElementById("wagerError");

    const wager = wagerTypeInput.value.trim();
    const valid = /^[A-Za-z0-9 .]+$/.test(wager) && wager.length > 0;
    if (!valid) {
      errorBox.textContent = "The information entered does not conform to the standard or was left blank. Please check your entry, and try again.";
      return;
    }

    errorBox.textContent = "";
    document.getElementById("customInputSection").classList.add("hidden");
    document.getElementById("unitDropdownSection").classList.remove("hidden");
    document.dispatchEvent(new CustomEvent("unitSelectionStarted"));
  }

  function showNumInputScreen(wagerTemplate) {
    const customInputSection = document.getElementById("customInputSection");
    customInputSection.innerHTML = `
      <label for="numInput" style="color:#666;font-size:14px;margin-bottom:5px;display:block;" id="numInputLabel"></label>
      <input type="number" id="numInput" step="0.5" min="0.5" max="300" inputmode="decimal" pattern="^(0\\.5|[1-9][0-9]*([.]5)?)$" style="width: 100%; max-width: 400px; box-sizing: border-box; padding: 12px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;" />
      <div class="error" id="numInputError" style="color:red; font-size:14px; margin-top: 5px;"></div>
      <button id="numSubmitBtn">Submit</button>
    `;

    const label = document.getElementById("numInputLabel");
    label.textContent = `Enter the amount for [[NUM]] (${wagerTemplate})`;

    const numInput = document.getElementById("numInput");
    numInput.focus();

    numInput.addEventListener("input", () => {
      const val = numInput.value;
      const errorDiv = document.getElementById("numInputError");
      errorDiv.textContent = "";

      if (val === "") return;

      const num = parseFloat(val);
      if (isNaN(num) || num < 0.5 || num > 300 || (num * 2) % 1 !== 0) {
        errorDiv.textContent = "Please enter a positive number up to 300 in 0.5 increments (e.g. 0.5, 1, 1.5).";
      }
    });

    document.getElementById("numSubmitBtn").addEventListener("click", () => {
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

      window.AppState.currentWagerWithNum = wagerTemplate.replace(/\[\[NUM\]\]/g, val);
      document.getElementById("customInputSection").classList.add("hidden");
      document.getElementById("unitDropdownSection").classList.remove("hidden");
      document.dispatchEvent(new CustomEvent("unitSelectionStarted"));
    });
  }
})();
