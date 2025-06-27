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

    // <-- updated styles to avoid scrollbars and fit container height dynamically
    iframe.style.height = "100%";
    iframe.style.minHeight = "400px";

    return iframe;
  };

  // Get parent container of the box to insert button above the image container
  const container = box.parentElement;

  // Remove any existing toggle button if present
  const oldToggleBtn = document.getElementById("toggleImageBtn");
  if (oldToggleBtn) oldToggleBtn.remove();

  // Create the two single-line text boxes container (if not exists)
  let textBoxContainer = document.getElementById("textBoxesContainer");
  if (!textBoxContainer) {
    textBoxContainer = document.createElement("div");
    textBoxContainer.id = "textBoxesContainer";
    textBoxContainer.style.marginBottom = "10px";
    textBoxContainer.style.maxWidth = "400px";
    container.insertBefore(textBoxContainer, box); // Insert above images container

    // Create first single-line text box
    const textBox1 = document.createElement("input");
    textBox1.id = "textBox1";
    textBox1.readOnly = true;
    textBox1.type = "text";
    textBox1.style.width = "100%";
    textBox1.style.height = "30px";
    textBox1.style.marginBottom = "8px";
    textBox1.style.fontSize = "16px";
    textBox1.style.fontFamily = "'Oswald', sans-serif";
    textBox1.style.padding = "6px 8px";
    textBox1.style.borderRadius = "6px";
    textBox1.style.border = "1px solid #ccc";
    textBox1.style.whiteSpace = "nowrap";
    textBox1.style.overflow = "hidden";
    textBox1.style.textOverflow = "ellipsis";
    textBox1.style.cursor = "pointer";
    textBox1.title = "Click to copy text";
    textBoxContainer.appendChild(textBox1);

    // Create second single-line text box
    const textBox2 = document.createElement("input");
    textBox2.id = "textBox2";
    textBox2.readOnly = true;
    textBox2.type = "text";
    textBox2.style.width = "100%";
    textBox2.style.height = "30px";
    textBox2.style.fontSize = "16px";
    textBox2.style.fontFamily = "'Oswald', sans-serif";
    textBox2.style.padding = "6px 8px";
    textBox2.style.borderRadius = "6px";
    textBox2.style.border = "1px solid #ccc";
    textBox2.style.whiteSpace = "nowrap";
    textBox2.style.overflow = "hidden";
    textBox2.style.textOverflow = "ellipsis";
    textBox2.style.cursor = "pointer";
    textBox2.title = "Click to copy text";
    textBoxContainer.appendChild(textBox2);

    // Add click event to copy content to clipboard for both inputs
    [textBox1, textBox2].forEach(textBox => {
      textBox.addEventListener("click", () => {
        navigator.clipboard.writeText(textBox.value).then(() => {
          alert("Copied to clipboard!");
        }).catch(() => {
          alert("Failed to copy.");
        });
      });
    });
  }

  // Update text boxes content based on hype phrase data (or fallback)
  const textBox1 = document.getElementById("textBox1");
  const textBox2 = document.getElementById("textBox2");
  textBox1.value = window.selectedHypePostTitle || "No Hype Phrase Selected";
  textBox2.value = window.selectedHypeNote || "No Note Available";

  // Create toggle button element
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "toggleImageBtn";
  toggleBtn.textContent = "Switch to Paid Image";
  toggleBtn.style.marginTop = "10px";
  toggleBtn.style.width = "100%";
  toggleBtn.style.maxWidth = "400px";
  toggleBtn.style.padding = "12px";
  toggleBtn.style.fontSize = "16px";
  toggleBtn.style.backgroundColor = "#2a9fd6";
  toggleBtn.style.color = "white";
  toggleBtn.style.border = "none";
  toggleBtn.style.borderRadius = "6px";
  toggleBtn.style.cursor = "pointer";

  // Helper function to copy iframe src to clipboard
  const copyIframeSrc = (iframe) => {
    if (!iframe || !iframe.src) return;
    navigator.clipboard.writeText(iframe.src).then(() => {
      alert("Image URL copied to clipboard!");
    }).catch(() => {
      alert("Failed to copy image URL.");
    });
  };

  // Toggle button click handler updated to add copy-on-click to current iframe
  toggleBtn.onclick = () => {
    const frames = box.querySelectorAll(".slipFrame");
    let visibleIndex = -1;
    frames.forEach((frame, i) => {
      if (frame.style.display !== "none") visibleIndex = i;
      frame.style.display = "none";
      // Remove old click handler to avoid duplicates
      frame.onclick = null;
      frame.style.cursor = "default";
    });
    const nextIndex = (visibleIndex + 1) % frames.length;
    const nextFrame = frames[nextIndex];
    nextFrame.style.display = "block";

    // Add click handler to copy iframe src on click
    nextFrame.style.cursor = "pointer";
    nextFrame.onclick = () => copyIframeSrc(nextFrame);

    toggleBtn.textContent = nextIndex === 0 ? "Switch to Paid Image" : "Switch to Regular Image";
  };

  // Append only slides 1 and 2
  box.appendChild(createIframe(1, true));
  box.appendChild(createIframe(2, false));

  // Add click handler for the initially visible iframe to copy src
  const initialFrame = box.querySelector(".slipFrame");
  if (initialFrame) {
    initialFrame.style.cursor = "pointer";
    initialFrame.onclick = () => copyIframeSrc(initialFrame);
  }

  // Insert toggle button above the image container but below Reset button
  container.insertBefore(toggleBtn, box);

  // Adjust container height to fit content smoothly and avoid scrollbars
  setTimeout(() => {
    box.style.overflow = "visible"; // changed from hidden to visible to avoid clipping
    box.style.height = box.scrollHeight + "px";
  }, 0);
}
