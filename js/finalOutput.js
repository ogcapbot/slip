async function generateFinalOutput(notes, newTitle) {
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

  // Remove previous images and buttons if present
  const oldImageContainer = document.getElementById("imageContainer");
  if (oldImageContainer) oldImageContainer.remove();

  const oldToggleBtn = document.getElementById("toggleImageBtn");
  if (oldToggleBtn) oldToggleBtn.remove();

  const oldCopyBtn = document.getElementById("copyImageBtn");
  if (oldCopyBtn) oldCopyBtn.remove();

  // Create container for image and buttons
  const container = box.parentElement;

  const imageContainer = document.createElement("div");
  imageContainer.id = "imageContainer";
  imageContainer.style.maxWidth = "400px";
  imageContainer.style.marginTop = "10px";

  // Create image element
  const img = document.createElement("img");
  img.id = "renderedImage";
  img.style.width = "100%";
  img.style.border = "1px solid #ccc";
  img.style.borderRadius = "6px";
  img.style.cursor = "pointer";

  imageContainer.appendChild(img);
  box.appendChild(imageContainer);

  // Create toggle button
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

  container.insertBefore(toggleBtn, box.nextSibling);

  // Create copy button below toggle button
  const copyBtn = document.createElement("button");
  copyBtn.id = "copyImageBtn";
  copyBtn.textContent = "Copy THIS image to Clipboard";
  copyBtn.style.marginTop = "10px";
  copyBtn.style.width = "100%";
  copyBtn.style.maxWidth = "400px";
  copyBtn.style.padding = "12px";
  copyBtn.style.fontSize = "16px";
  copyBtn.style.backgroundColor = "#2a9fd6";
  copyBtn.style.color = "white";
  copyBtn.style.border = "none";
  copyBtn.style.borderRadius = "6px";
  copyBtn.style.cursor = "pointer";

  container.insertBefore(copyBtn, toggleBtn.nextSibling);

  let currentSlideNum = 1;

  // Helper: fetch base64 image from Apps Script URL
  async function fetchRenderedImage(slideNum) {
    const url = `${BASE_URL}?json=${encodedPayload}&slideNum=${slideNum}`;
    const res = await fetch(url, { mode: 'cors' });
    const text = await res.text();
    const match = text.match(/<img src="([^"]+)"/);
    if (match && match[1]) return match[1];
    throw new Error("Image base64 not found");
  }

  // Load image into img element
  async function loadImage(slideNum) {
    try {
      img.src = ""; // clear while loading
      const base64 = await fetchRenderedImage(slideNum);
      img.src = base64;
      currentSlideNum = slideNum;
    } catch (err) {
      alert("Failed to load image: " + err.message);
    }
  }

  // Load initial slide image
  await loadImage(1);

  // Toggle image button click handler
  toggleBtn.onclick = async () => {
    const nextSlide = currentSlideNum === 1 ? 2 : 1;
    await loadImage(nextSlide);
    toggleBtn.textContent = nextSlide === 1 ? "Switch to Paid Image" : "Switch to Regular Image";
  };

  // Copy image button click handler
  copyBtn.onclick = () => {
    if (!img.src) {
      alert("No image loaded to copy.");
      return;
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      canvas.toBlob(blob => {
        if (!blob) {
          alert("Failed to copy image.");
          return;
        }
        navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]).then(() => {
          alert("Image copied to clipboard!");
        }).catch(() => {
          alert("Failed to copy image.");
        });
      }, "image/png");
    };
    image.onerror = () => alert("Failed to load image for copying.");
    image.src = img.src;
  };

  // Optional: clicking image also copies it
  img.onclick = copyBtn.onclick;
}
