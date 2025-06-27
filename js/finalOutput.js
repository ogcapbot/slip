function generateFinalOutput(notes, newTitle) {
  notes = notes || "N/A";
  if (newTitle) window.overrideTitle = newTitle;

  let wagerRaw = "";
  const wagerInput = document.getElementById("wagerType");
  const wagerDropdown = document.getElementById("wagerDropdown");

  if (window.currentWagerWithNum) {
    wagerRaw = window.currentWagerWithNum;
  } else if (wagerInput) {
    wagerRaw = wagerInput.value.trim();
  } else if (wagerDropdown) {
    wagerRaw = wagerDropdown.value.trim();
  }
  const wager = wagerRaw.toUpperCase();

  const teamSearchEl = document.getElementById("teamSearch");
  const teamSearchInput = window.overrideTeamName || (teamSearchEl ? teamSearchEl.value.trim() : "");
  const dropdown = document.getElementById("unitDropdown");
  const unitInput = dropdown ? dropdown.value.trim() : "";
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
  if (selectedMatch["Commence Time (UTC)"]) {
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
  const today = new Date();
  const mmddyy = `${today.getMonth() + 1}${today.getDate()}${today.getFullYear().toString().slice(2)}`;
  const pickId = `${secondsSinceEpoch}-${mmddyy}`;

  let pickDescValue = "Unavailable";

  if (document.getElementById("wagerDropdown") && !window.overrideTeamName) {
    const selectedWager = document.getElementById("wagerDropdown").value;
    const wagerRow = (allData.wagers || []).find(row =>
      row.wager_label_template === selectedWager
    );

    if (wagerRow && wagerRow.pick_desc_template) {
      pickDescValue = wagerRow.pick_desc_template;

      pickDescValue = pickDescValue.replace(/\[\[TEAM\]\]/g, matchedTeam);

      const numberMatch = selectedWager.match(/\d+(\.\d+)?/);
      if (numberMatch) {
        const numericValue = numberMatch[0];
        pickDescValue = pickDescValue
          .replace(/\[\[NUM\]\]/g, numericValue)
          .replace(/\[\[NUMBER\]\]/g, numericValue);
      }
    }
  }

  const output = [
    "═══════════════════════",
    "######## OFFICIAL PICK",
    "═══════════════════════",
    `Wager Type: STRAIGHT WAGER`,
    `Official Pick: ${matchedTeam}`,
    `Official Type: ${wager}`,
    `Official Wager: ${unitInput} Unit(s)`,
    `To Win: ${pickDescValue}`,
    "",
    "═══════════════════════",
    "######## GAME DETAILS",
    "═══════════════════════",
    `Sport: ${selectedMatch["League (Group)"].toUpperCase()}`,
    `League: ${selectedMatch["Sport Name"]}`,
    `Home Team: ${selectedMatch["Home Team"]}`,
    `Away Team: ${selectedMatch["Away Team"]}`,
    `Game Time: ${formattedTime}`,
    "",
    "═══════════════════════",
    "######## THANK YOU FOR TRUSTING OGCB",
    "═══════════════════════",
    "",
    `Title: ${window.overrideTitle || "[[TITLE]]"}`,
    `Pick ID: ${pickId}`,
    `Pick by: ${capperName}`,
    `Input Value: ${allInputsRaw}`,
    `Notes: ${notes}`,
    "",
    "═══════════════════════",
    "######## STRICT CONFIDENTIALITY NOTICE",
    "═══════════════════════",
    "All OG Capper Bets Content is PRIVATE. Leaking, Stealing or Sharing ANY Content is STRICTLY PROHIBITED.",
    "Violation = Termination. No Refund. No Appeal. Lifetime Ban.",
    "",
    `Created: ${estString}`
  ].join("\n");

  window._cleanedOutput = output.replace(/[\u2028\u2029]/g, '');

  const encodedPayload = encodeURIComponent(JSON.stringify({
    "FULL_TEAM_ENTERED": matchedTeam,
    "FULL_BET_TYPE": wager,
    "FULL_WAGER_OUTPUT": `${unitInput} Unit(s)`,
    "PICK_DESC": pickDescValue,
    "NOTES": notes,
    "FULL_LEAGUE_NAME": selectedMatch["Sport Name"],
    "FULL_SPORT_NAME": selectedMatch["League (Group)"],
    "HOME_TEAM_FULL_NAME": selectedMatch["Home Team"],
    "AWAY_TEAM_FULL_NAME": selectedMatch["Away Team"],
    "DATE and TIME OF GAME START": formattedTime,
    "TITLE": window.overrideTitle || "[[TITLE]]",
    "PICKID": pickId,
    "CAPPERS NAME": capperName,
    "USER_INPUT_VALUE": allInputsRaw,
    "24HR_LONG_DATE_SECONDS": estString
  }));

  const box = document.getElementById("confirmOutput");
  box.classList.remove("hidden");
  box.innerHTML = "";

  // === Add Post Title label + input ===
  const labelPostTitle = document.createElement("label");
  labelPostTitle.textContent = "Post Title";
  labelPostTitle.style.fontFamily = "'Oswald', sans-serif";
  labelPostTitle.style.fontWeight = "bold";
  labelPostTitle.style.color = "#666666";
  labelPostTitle.style.display = "block";
  labelPostTitle.style.marginBottom = "6px";
  box.appendChild(labelPostTitle);

  const inputPostTitle = document.createElement("input");
  inputPostTitle.type = "text";
  inputPostTitle.readOnly = true;
  inputPostTitle.value = window.selectedHypePostTitle || "No Hype Phrase Selected";
  inputPostTitle.style.width = "100%";
  inputPostTitle.style.height = "28px";
  inputPostTitle.style.marginBottom = "12px";
  inputPostTitle.style.fontFamily = "'Oswald', sans-serif";
  inputPostTitle.style.fontSize = "12px";
  inputPostTitle.style.padding = "6px 8px";
  inputPostTitle.style.border = "1px solid #ccc";
  inputPostTitle.style.borderRadius = "6px";
  inputPostTitle.style.whiteSpace = "nowrap";
  inputPostTitle.style.overflow = "hidden";
  inputPostTitle.style.textOverflow = "ellipsis";
  inputPostTitle.title = "Click to copy text";
  box.appendChild(inputPostTitle);

  // === Add Hype Phrase Description label + input ===
  const labelHypeDesc = document.createElement("label");
  labelHypeDesc.textContent = "Hype Phrase Description";
  labelHypeDesc.style.fontFamily = "'Oswald', sans-serif";
  labelHypeDesc.style.fontWeight = "bold";
  labelHypeDesc.style.color = "#666666";
  labelHypeDesc.style.display = "block";
  labelHypeDesc.style.marginBottom = "6px";
  box.appendChild(labelHypeDesc);

  const inputHypeDesc = document.createElement("input");
  inputHypeDesc.type = "text";
  inputHypeDesc.readOnly = true;
  inputHypeDesc.value = (window.selectedHypeRow && window.selectedHypeRow.Promo) || "No Description Available";
  inputHypeDesc.style.width = "100%";
  inputHypeDesc.style.height = "28px";
  inputHypeDesc.style.marginBottom = "20px";
  inputHypeDesc.style.fontFamily = "'Oswald', sans-serif";
  inputHypeDesc.style.fontSize = "12px";
  inputHypeDesc.style.padding = "6px 8px";
  inputHypeDesc.style.border = "1px solid #ccc";
  inputHypeDesc.style.borderRadius = "6px";
  inputHypeDesc.style.whiteSpace = "nowrap";
  inputHypeDesc.style.overflow = "hidden";
  inputHypeDesc.style.textOverflow = "ellipsis";
  inputHypeDesc.title = "Click to copy text";
  box.appendChild(inputHypeDesc);

  // Helper function to create a container with label and iframe
  function createImageContainer(labelText, slideNum) {
    const container = document.createElement("div");
    container.style.border = "1px solid #ccc";
    container.style.borderRadius = "6px";
    container.style.padding = "12px";
    container.style.marginBottom = "20px";
    container.style.maxWidth = "420px";

    const label = document.createElement("div");
    label.textContent = labelText;
    label.style.fontFamily = "'Oswald', sans-serif";
    label.style.fontWeight = "bold";
    label.style.color = "#666666";
    label.style.marginBottom = "10px";

    const iframe = document.createElement("iframe");
    iframe.src = `${BASE_URL}?json=${encodedPayload}&slideNum=${slideNum}`;
    iframe.style.width = "100%";
    iframe.style.height = "600px";
    iframe.style.border = "none";

    container.appendChild(label);
    container.appendChild(iframe);

    return container;
  }

  // Append Standard Image container
  box.appendChild(createImageContainer("Standard Version Image", 1));

  // Append Paid Image container
  box.appendChild(createImageContainer("Paid Version Image", 2));
}
