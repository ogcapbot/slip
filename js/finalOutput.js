// finalOutput.js — fetch & display images as base64 <img>, enable native long tap copy

async function fetchAndDisplayImage(labelText, slideNum, container, payload) {
  const BASE_URL = "https://script.google.com/macros/s/AKfycbxiXrBh0NrprTJqgYKquFmuUoPyS8fYP05jba1khnX1dOuk1GdhFOpFudScYXioWLAsng/exec";

  const url = `${BASE_URL}?json=${encodeURIComponent(JSON.stringify(payload))}&slideNum=${slideNum}`;

  const div = document.createElement("div");
  div.style.border = "1px solid #ccc";
  div.style.borderRadius = "6px";
  div.style.padding = "12px";
  div.style.marginBottom = "20px";
  div.style.maxWidth = "420px";

  const label = document.createElement("div");
  label.textContent = labelText;
  label.style.fontFamily = "'Oswald', sans-serif";
  label.style.fontWeight = "bold";
  label.style.color = "#666666";
  label.style.marginBottom = "10px";
  div.appendChild(label);

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const htmlText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const img = doc.querySelector("img");

    if (img && img.src.startsWith("data:image/png;base64,")) {
      const image = document.createElement("img");
      image.src = img.src;
      image.style.width = "100%";
      image.style.height = "auto";
      image.style.borderRadius = "4px";
      div.appendChild(image);
    } else {
      div.appendChild(document.createTextNode("Image not found in response."));
    }
  } catch (error) {
    div.appendChild(document.createTextNode("Error loading image: " + error.message));
  }

  container.appendChild(div);
}

async function generateFinalOutput(notes = "N/A", newTitle) {
  if (newTitle) window.overrideTitle = newTitle;

  const wagerRaw = window.currentWagerWithNum ||
                   (document.getElementById("wagerType")?.value.trim()) ||
                   (document.getElementById("wagerDropdown")?.value.trim()) || "";

  const wager = wagerRaw.toUpperCase();

  const teamSearchInput = window.overrideTeamName || document.getElementById("teamSearch")?.value.trim() || "";
  const unitInput = document.getElementById("unitDropdown")?.value.trim() || "";
  const allInputsRaw = `${teamSearchInput} ${wagerRaw} ${unitInput}`;

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

  let formattedTime = "Unavailable";
  if (selectedMatch?.["Commence Time (UTC)"]) {
    const date = new Date(selectedMatch["Commence Time (UTC)"]);
    formattedTime = date.toLocaleString("en-US", {
      timeZone: "America/New_York",
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true
    }) + " ET";
  }

  const nowNY = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const nyDate = new Date(nowNY);
  const estString = `${nyDate.getFullYear()}-${String(nyDate.getMonth() + 1).padStart(2, '0')}-${String(nyDate.getDate()).padStart(2, '0')} ${String(nyDate.getHours()).padStart(2, '0')}:${String(nyDate.getMinutes()).padStart(2, '0')}:${String(nyDate.getSeconds()).padStart(2, '0')}`;

  const secondsSinceEpoch = Math.floor((new Date() - new Date("1981-07-25T12:00:00Z")) / 1000);
  const mmddyy = `${nyDate.getMonth() + 1}${nyDate.getDate()}${nyDate.getFullYear().toString().slice(2)}`;
  const pickId = `${secondsSinceEpoch}-${mmddyy}`;

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

  const payload = {
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
  };

  const container = document.getElementById("confirmOutput");
  container.classList.remove("hidden");
  container.innerHTML = "";

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

  let imagesLoaded = 0;
  function checkLoaded() {
    imagesLoaded++;
    if (imagesLoaded === 2) {
      loaderContainer.style.display = "none";
    }
  }

  await fetchAndDisplayImage("Standard Version Image", 1, container, payload).then(checkLoaded);
  await fetchAndDisplayImage("Paid Version Image", 2, container, payload).then(checkLoaded);

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
