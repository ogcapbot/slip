// finalOutput.js

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

  const box = document.getElementById("confirmOutput");
  box.classList.remove("hidden");
  box.innerHTML = "";

  const cleanedOutput = output.replace(/[\u2028\u2029]/g, '');
  window._cleanedOutput = cleanedOutput;

  const encodedOutput = encodeURIComponent(cleanedOutput);

  const existingFrame = document.getElementById("slipFrame");
  if (existingFrame) existingFrame.remove();

  const payload = {
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
  };

  const encodedPayload = encodeURIComponent(JSON.stringify(payload));
  box.innerHTML = "";

  const createIframe = (slideNum, visible) => {
    const iframe = document.createElement("iframe");
    iframe.className = "slipFrame";
    iframe.dataset.slide = slideNum;
    iframe.style.display = visible ? "block" : "none";
    iframe.src = `${BASE_URL}?json=${encodedPayload}&slideNum=${slideNum}`;
    iframe.style.width = "100%";
    iframe.style.maxWidth = "400px";
    iframe.style.border = "none";
    iframe.style.height = "600px";
    iframe.style.zIndex = "1";
    return iframe;
  };

  const iframe1 = createIframe("1", true);
  const iframe2 = createIframe("2", false);

  box.appendChild(iframe1);
  box.appendChild(iframe2);

  const postContainer = document.getElementById("postTitleDescContainer");
  postContainer.innerHTML = "";

  const postTitleLabel = document.createElement("div");
  postTitleLabel.textContent = "Tap to Copy - Paste in Patreon Post Title";
  postTitleLabel.className = "copyTextboxLabel";
  postContainer.appendChild(postTitleLabel);

  const postTitleInput = document.createElement("input");
  postTitleInput.type = "text";
  postTitleInput.readOnly = true;
  postTitleInput.className = "copyTextbox";
  postTitleInput.title = "Click to copy Post Title";
  postTitleInput.value = window.overrideTitle || "";
  postTitleInput.style.userSelect = "all";

  postTitleInput.addEventListener("click", () => {
    navigator.clipboard.writeText(postTitleInput.value).then(() => {
      alert("Post Title copied to clipboard!");
    });
  });
  postContainer.appendChild(postTitleInput);

  const postDescLabel = document.createElement("div");
  postDescLabel.textContent = "Tap to Copy - Paste in Patreon Post Description";
  postDescLabel.className = "copyTextboxLabel";
  postContainer.appendChild(postDescLabel);

  const postDescInput = document.createElement("input");
  postDescInput.type = "text";
  postDescInput.readOnly = true;
  postDescInput.className = "copyTextbox";
  postDescInput.title = "Click to copy Post Description";
  postDescInput.value = window.selectedHypeRow ? window.selectedHypeRow.Promo || "" : "";
  postDescInput.style.userSelect = "all";

  postDescInput.addEventListener("click", () => {
    navigator.clipboard.writeText(postDescInput.value).then(() => {
      alert("Post Description copied to clipboard!");
    });
  });

  postContainer.appendChild(postDescInput);

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "Switch to Paid Image";
  toggleBtn.id = "toggleImageBtn";
  toggleBtn.style.marginTop = "10px";
  toggleBtn.style.width = "100%";
  toggleBtn.style.maxWidth = "400px";
  toggleBtn.style.boxSizing = "border-box";
  toggleBtn.style.padding = "12px";
  toggleBtn.style.fontSize = "16px";
  toggleBtn.style.backgroundColor = "#2a9fd6";
  toggleBtn.style.color = "white";
  toggleBtn.style.border = "none";
  toggleBtn.style.borderRadius = "6px";
  toggleBtn.style.cursor = "pointer";

  toggleBtn.onclick = () => {
    const frames = document.querySelectorAll(".slipFrame");
    frames.forEach(frame => {
      const isVisible = frame.style.display !== "none";
      frame.style.display = isVisible ? "none" : "block";
    });

    const showingSlide2 = iframe2.style.display === "block";
    toggleBtn.textContent = showingSlide2 ? "Switch to Regular Image" : "Switch to Paid Image";
  };

  box.parentNode.insertBefore(toggleBtn, box);
  setTimeout(() => {
    box.style.overflow = "hidden";
    box.style.height = box.scrollHeight + "px";
  }, 0);
}

function openImageGenerator() {
  const encodedText = encodeURIComponent(window._cleanedOutput || '');
  window.open(`${BASE_URL}?text=${encodedText}`, '_blank');
}
