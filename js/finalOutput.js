function generateFinalOutput(notes = "N/A", newTitle) {
  if (newTitle) window.overrideTitle = newTitle;

  const BASE_URL = "https://script.google.com/macros/s/AKfycbxiXrBh0NrprTJqgYKquFmuUoPyS8fYP05jba1khnX1dOuk1GdhFOpFudScYXioWLAsng/exec";

  // Collect your input data (same as your original code)
  const wagerRaw =
    window.currentWagerWithNum ||
    (document.getElementById("wagerType")?.value.trim()) ||
    (document.getElementById("wagerDropdown")?.value.trim()) ||
    "";

  const wager = wagerRaw.toUpperCase();

  const teamSearchInput = window.overrideTeamName || document.getElementById("teamSearch")?.value.trim() || "";
  const unitInput = document.getElementById("unitDropdown")?.value.trim() || "";
  const allInputsRaw = `${teamSearchInput} ${wagerRaw} ${unitInput}`;

  // Your matchedTeam logic (copy exactly as you had it in your original code)
  let matchedTeam = "";
  const teamSearchLower = teamSearchInput.toLowerCase();

  if (window.overrideTeamName) {
    matchedTeam = window.overrideTeamName;
  } else if (
    selectedMatch &&
    selectedMatch["Home Team"] !== "Unavailable" &&
    selectedMatch["Away Team"] !== "Unavailable"
  ) {
    const home = selectedMatch["Home Team"];
    const away = selectedMatch["Away Team"];
    matchedTeam = [home, away].find(team => team.toLowerCase().includes(teamSearchLower)) || teamSearchInput;
  } else {
    matchedTeam = teamSearchInput;
  }

  // Format game time (same as your original code)
  let formattedTime = "Unavailable";
  if (selectedMatch?.["Commence Time (UTC)"]) {
    const date = new Date(selectedMatch["Commence Time (UTC)"]);
    formattedTime = date.toLocaleString("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) + " ET";
  }

  // Pick ID and estString (as in your original code)
  const nowNY = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const nyDate = new Date(nowNY);
  const estString = `${nyDate.getFullYear()}-${String(nyDate.getMonth() + 1).padStart(2, "0")}-${String(nyDate.getDate()).padStart(2, "0")} ${String(nyDate.getHours()).padStart(2, "0")}:${String(nyDate.getMinutes()).padStart(2, "0")}:${String(nyDate.getSeconds()).padStart(2, "0")}`;

  const secondsSinceEpoch = Math.floor((new Date() - new Date("1981-07-25T12:00:00Z")) / 1000);
  const mmddyy = `${nyDate.getMonth() + 1}${nyDate.getDate()}${nyDate.getFullYear().toString().slice(2)}`;
  const pickId = `${secondsSinceEpoch}-${mmddyy}`;

  // Pick description logic (your original code)
  let pickDescValue = "Unavailable";
  if (document.getElementById("wagerDropdown") && !window.overrideTeamName) {
    const selectedWager = document.getElementById("wagerDropdown").value;
    const wagerRow = (allData.wagers || []).find(row => row.wager_label_template === selectedWager);
    if (wagerRow?.pick_desc_template) {
      pickDescValue = wagerRow.pick_desc_template.replace(/\[\[TEAM\]\]/g, matchedTeam);
      const numberMatch = selectedWager.match(/\d+(\.\d+)?/);
      if (numberMatch) {
        const numericValue = numberMatch[0];
        pickDescValue = pickDescValue
          .replace(/\[\[NUM\]\]/g, numericValue)
          .replace(/\[\[NUMBER\]\]/g, numericValue);
      }
    }
  }

  // Compose payload for backend URL
  const payload = {
    FULL_TEAM_ENTERED: matchedTeam,
    FULL_BET_TYPE: wager,
    FULL_WAGER_OUTPUT: `${unitInput} Unit(s)`,
    PICK_DESC: pickDescValue,
    NOTES: notes,
    FULL_LEAGUE_NAME: selectedMatch?.["Sport Name"] || "",
    FULL_SPORT_NAME: selectedMatch?.["League (Group)"] || "",
    HOME_TEAM_FULL_NAME: selectedMatch?.["Home Team"] || "",
    AWAY_TEAM_FULL_NAME: selectedMatch?.["Away Team"] || "",
    "DATE and TIME OF GAME START": formattedTime,
    TITLE: window.overrideTitle || "[[TITLE]]",
    PICKID: pickId,
    "CAPPERS NAME": capperName || "",
    USER_INPUT_VALUE: allInputsRaw,
    "24HR_LONG_DATE_SECONDS": estString,
  };

  const container = document.getElementById("confirmOutput");
  container.classList.remove("hidden");
  container.innerHTML = "";

  // Loader
  const loaderContainer = document.createElement("div");
  loaderContainer.id = "loaderContainer";
  loaderContainer.style.textAlign = "center";
  loaderContainer.style.margin = "5px 0 15px 0";

  const loaderSpinner = document.createElement("div");
  loaderSpinner.id = "loader";
  loaderSpinner.style.margin = "0 auto";
  loaderContainer.appendChild(loaderSpinner);

  const loaderText = document.createElement("div");
  loaderText.textContent = "Generating Images...";
  loaderText.style.fontWeight = "bold";
  loaderText.style.color = "#555";
  loaderText.style.marginTop = "8px";
  loaderContainer.appendChild(loaderText);

  container.appendChild(loaderContainer);

  // Create Post Title and Hype Phrase inputs (same as your original)
  function createCopyInput(labelText, value) {
    const label = document.createElement("label");
    label.textContent = labelText;
    label.style.fontFamily = "'Oswald', sans-serif";
    label.style.fontWeight = "bold";
    label.style.color = "#666666";
    label.style.display = "block";
    label.style.marginBottom = "6px";
    container.appendChild(label);

    const input = document.createElement("input");
    input.type = "text";
    input.readOnly = true;
    input.value = value;
    input.style.width = "100%";
    input.style.height = "28px";
    input.style.marginBottom = "12px";
    input.style.fontFamily = "'Oswald', sans-serif";
    input.style.fontSize = "12px";
    input.style.padding = "6px 8px";
    input.style.border = "1px solid #ccc";
    input.style.borderRadius = "6px";
    input.style.whiteSpace = "nowrap";
    input.style.overflow = "hidden";
    input.style.textOverflow = "ellipsis";
    input.title = "Click to copy text";
    container.appendChild(input);

    input.addEventListener("click", () => {
      navigator.clipboard.writeText(input.value).then(() => alert(`${labelText} copied to clipboard!`)).catch(() => alert(`Failed to copy ${labelText}.`));
    });
  }

  createCopyInput("Post Title", window.selectedHypePostTitle || "No Hype Phrase Selected");
  createCopyInput("Hype Phrase Description", (window.selectedHypeRow && window.selectedHypeRow.Promo) || "No Description Available");

  // Images counter
  let imagesLoaded = 0;

  function checkLoaded() {
    imagesLoaded++;
    if (imagesLoaded === 2) {
      loaderContainer.style.display = "none";
    }
  }

  // Image container creation with overlay for long press copy
  function createImageContainer(labelText, slideNum) {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.borderRadius = "6px";
    div.style.padding = "12px";
    div.style.marginBottom = "20px";
    div.style.maxWidth = "420px";
    div.style.position = "relative";

    const label = document.createElement("div");
    label.textContent = labelText;
    label.style.fontFamily = "'Oswald', sans-serif";
    label.style.fontWeight = "bold";
    label.style.color = "#666666";
    label.style.marginBottom = "10px";

    const iframeSrc = `${BASE_URL}?json=${encodeURIComponent(JSON.stringify(payload))}&slideNum=${slideNum}`;

    const iframe = document.createElement("iframe");
    iframe.src = iframeSrc;
    iframe.style.width = "100%";
    iframe.style.height = "600px";
    iframe.style.border = "none";

    iframe.onload = checkLoaded;

    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = label.offsetHeight + 12 + "px";
    overlay.style.left = "12px";
    overlay.style.right = "12px";
    overlay.style.height = "600px";
    overlay.style.cursor = "pointer";
    overlay.style.background = "transparent";
    overlay.title = `Long press to copy ${labelText} URL`;

    let pressTimer = null;

    function copyUrl() {
      navigator.clipboard.writeText(iframeSrc).then(() => alert(`${labelText} URL copied to clipboard!`)).catch(() => alert(`Failed to copy ${labelText} URL.`));
    }

    overlay.addEventListener("touchstart", () => {
      pressTimer = setTimeout(copyUrl, 600);
    });

    overlay.addEventListener("touchend", () => {
      if (pressTimer) clearTimeout(pressTimer);
    });

    overlay.addEventListener("touchcancel", () => {
      if (pressTimer) clearTimeout(pressTimer);
    });

    div.appendChild(label);
    div.appendChild(iframe);
    div.appendChild(overlay);

    return div;
  }

  container.appendChild(createImageContainer("Standard Version Image", 1));
  container.appendChild(createImageContainer("Paid Version Image", 2));

  // Reset button at top (same as your original)
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.onclick = () => {
      container.innerHTML = "";
      container.classList.add("hidden");
      imagesLoaded = 0;
    };
  }
}

window.generateFinalOutput = generateFinalOutput;
