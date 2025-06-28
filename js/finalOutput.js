function generateFinalOutput(notes = "N/A", newTitle) {
  if (newTitle) window.overrideTitle = newTitle;

  const BASE_URL = "https://script.google.com/macros/s/AKfycbxiXrBh0NrprTJqgYKquFmuUoPyS8fYP05jba1khnX1dOuk1GdhFOpFudScYXioWLAsng/exec";

  // Gather inputs
  const wagerRaw = window.currentWagerWithNum || 
                   (document.getElementById("wagerType")?.value.trim()) || 
                   (document.getElementById("wagerDropdown")?.value.trim()) || "";

  const wager = wagerRaw.toUpperCase();

  const teamSearchInput = window.overrideTeamName || document.getElementById("teamSearch")?.value.trim() || "";
  const unitInput = document.getElementById("unitDropdown")?.value.trim() || "";
  const allInputsRaw = `${teamSearchInput} ${wagerRaw} ${unitInput}`;

  // Determine matched team
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

  // Format game time
  let formattedTime = "Unavailable";
  if (selectedMatch?.["Commence Time (UTC)"]) {
    const date = new Date(selectedMatch["Commence Time (UTC)"]);
    formattedTime = date.toLocaleString("en-US", {
      timeZone: "America/New_York",
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true
    }) + " ET";
  }

  // Generate Pick ID based on time
  const nowNY = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const nyDate = new Date(nowNY);
  const estString = `${nyDate.getFullYear()}-${String(nyDate.getMonth() + 1).padStart(2, '0')}-${String(nyDate.getDate()).padStart(2, '0')} ${String(nyDate.getHours()).padStart(2, '0')}:${String(nyDate.getMinutes()).padStart(2, '0')}:${String(nyDate.getSeconds()).padStart(2, '0')}`;

  const secondsSinceEpoch = Math.floor((new Date() - new Date("1981-07-25T12:00:00Z")) / 1000);
  const mmddyy = `${nyDate.getMonth() + 1}${nyDate.getDate()}${nyDate.getFullYear().toString().slice(2)}`;
  const pickId = `${secondsSinceEpoch}-${mmddyy}`;

  // Pick Description
  let pickDescValue = "Unavailable";
  if (document.getElementById("wagerDropdown") && !window.overrideTeamName) {
    const selectedWager = document.getElementById("wagerDropdown").value;
    const wagerRow = (allData.wagers || []).find(row => row.wager_label_template === selectedWager);
    if (wagerRow?.pick_desc_template) {
      pickDescValue = wagerRow.pick_desc_template
        .replace(/\[\[TEAM\]\]/g, matchedTeam);

      const numberMatch = selectedWager.match(/\d+(\.\d+)?/);
      if (numberMatch) {
        const numericValue = numberMatch[0];
        pickDescValue = pickDescValue
          .replace(/\[\[NUM\]\]/g, numericValue)
          .replace(/\[\[NUMBER\]\]/g, numericValue);
      }
    }
  }

  // Encode payload for image URLs
  const encodedPayload = encodeURIComponent(JSON.stringify({
    "FULL_TEAM_ENTERED": matchedTeam,
    "FULL_BET_TYPE": wager,
    "FULL_WAGER_OUTPUT": `${unitInput} Unit(s)`,
    "PICK_DESC": pickDescValue,
    "NOTES": notes,
    "FULL_LEAGUE_NAME": selectedMatch?.["Sport Name"] || "",
    "FULL_SPORT_NAME": selectedMatch?.["League (Group)"] || "",
    "HOME_TEAM_FULL_NAME": selectedMatch?.["Home Team"] || "",
    "AWAY_TEAM_FULL_NAME": selectedMatch?.["Away Team"] || "",
    "DATE and TIME OF GAME START": formattedTime,
    "TITLE": window.overrideTitle || "[[TITLE]]",
    "PICKID": pickId,
    "CAPPERS NAME": capperName || "",
    "USER_INPUT_VALUE": allInputsRaw,
    "24HR_LONG_DATE_SECONDS": estString
  }));

  // Prepare container
  const container = document.getElementById("confirmOutput");
  container.classList.remove("hidden");
  container.innerHTML = "";

  // Create loader container
  const loaderContainer = document.createElement("div");
  loaderContainer.id = "loaderContainer";
  loaderContainer.style.textAlign = "center";
  loaderContainer.style.margin = "5px 0 15px 0";

  const loaderSpinner = document.createElement("div");
  loaderSpinner.id = "loader"; // your spinner CSS target
  loaderSpinner.style.margin = "0 auto";
  loaderContainer.appendChild(loaderSpinner);

  const loaderText = document.createElement("div");
  loaderText.textContent = "Generating Images...";
  loaderText.style.fontWeight = "bold";
  loaderText.style.color = "#555";
  loaderText.style.marginTop = "8px";
  loaderContainer.appendChild(loaderText);

  container.appendChild(loaderContainer);

  // Helper: creates label + input with click-to-copy
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
      navigator.clipboard.writeText(input.value)
        .then(() => alert(`${labelText} copied to clipboard!`))
        .catch(() => alert(`Failed to copy ${labelText}.`));
    });
  }

  createCopyInput("Post Title", window.selectedHypePostTitle || "No Hype Phrase Selected");
  createCopyInput("Hype Phrase Description", (window.selectedHypeRow && window.selectedHypeRow.Promo) || "No Description Available");

  // Track loaded images to hide loader after both finish
  let loadedCount = 0;

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

    const imageUrl = `${BASE_URL}?json=${encodedPayload}&slideNum=${slideNum}`;

    const img = document.createElement("img");
    img.src = imageUrl;
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "4px";
    img.style.userSelect = "none";

    img.imageUrl = imageUrl;

    let pressTimer = null;

    function copyImageUrl() {
      navigator.clipboard.writeText(img.imageUrl)
        .then(() => alert(`${labelText} URL copied to clipboard!`))
        .catch(() => alert(`Failed to copy ${labelText} URL.`));
    }

    img.addEventListener("touchstart", () => {
      pressTimer = setTimeout(copyImageUrl, 600);
    });

    img.addEventListener("touchend", () => {
      if (pressTimer) clearTimeout(pressTimer);
    });

    img.addEventListener("touchcancel", () => {
      if (pressTimer) clearTimeout(pressTimer);
    });

    img.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      copyImageUrl();
    });

    img.addEventListener("click", copyImageUrl);

    // Hide loader after image loads
    img.onload = () => {
      loadedCount++;
      if (loadedCount === 2) {
        loaderContainer.style.display = "none";
      }
    };

    div.appendChild(label);
    div.appendChild(img);

    return div;
  }

  container.appendChild(createImageContainer("Standard Version Image", 1));
  container.appendChild(createImageContainer("Paid Version Image", 2));

  // Optional Reset Button to clear output and reset UI
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset";
  resetBtn.style.display = "block";
  resetBtn.style.marginTop = "20px";
  resetBtn.style.padding = "8px 16px";
  resetBtn.style.fontSize = "14px";
  resetBtn.style.cursor = "pointer";
  resetBtn.addEventListener("click", () => {
    container.innerHTML = "";
    container.classList.add("hidden");
    loadedCount = 0;
  });

  container.appendChild(resetBtn);
}
