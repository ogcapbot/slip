// js/imagecreation.js
(() => {
  const hypeScreen = document.getElementById("hype-screen");

  document.addEventListener("finalOutputReady", () => {
    // Clear hype screen & show final output area
    hypeScreen.innerHTML = "";
    hypeScreen.classList.remove("hidden");

    // Compose final output text and iframe(s) for image generation
    generateFinalOutput();
  });

  function generateFinalOutput() {
    const notes = window.AppState.selectedHypeNote || "N/A";
    const newTitle = window.AppState.selectedHypePostTitle || "";

    if(newTitle) window.AppState.overrideTitle = newTitle;

    let wagerRaw = "";
    if (window.AppState.currentWagerWithNum) {
      wagerRaw = window.AppState.currentWagerWithNum;
    }

    const wager = wagerRaw.toUpperCase();

    const teamSearchInput = window.AppState.overrideTeamName || (window.AppState.selectedMatch ? window.AppState.selectedMatch["Home Team"] : "");
    const dropdown = document.getElementById("unitDropdown");
    const unitInput = dropdown ? dropdown.value.trim() : "";
    const allInputsRaw = `${teamSearchInput} ${wagerRaw} ${unitInput}`;

    let matchedTeam = "";

    if (window.AppState.overrideTeamName) {
      matchedTeam = window.AppState.overrideTeamName;
    } else if (
      window.AppState.selectedMatch &&
      window.AppState.selectedMatch["Home Team"] !== "Unavailable" &&
      window.AppState.selectedMatch["Away Team"] !== "Unavailable"
    ) {
      const home = window.AppState.selectedMatch["Home Team"];
      const away = window.AppState.selectedMatch["Away Team"];
      matchedTeam = [home, away].find(team => team.toLowerCase() === (teamSearchInput || "").toLowerCase()) || teamSearchInput;
    } else {
      matchedTeam = teamSearchInput;
    }

    let formattedTime = "Unavailable";
    if (window.AppState.selectedMatch?.["Commence Time (UTC)"]) {
      const date = new Date(window.AppState.selectedMatch["Commence Time (UTC)"]);
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

    if (window.AppState.selectedMatch && window.AppState.selectedMatch["wagerDropdown"]) {
      // Legacy support if needed
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
      `Sport: ${window.AppState.selectedMatch?.["League (Group)"]?.toUpperCase() || "N/A"}`,
      `League: ${window.AppState.selectedMatch?.["Sport Name"] || "N/A"}`,
      `Home Team: ${window.AppState.selectedMatch?.["Home Team"] || "N/A"}`,
      `Away Team: ${window.AppState.selectedMatch?.["Away Team"] || "N/A"}`,
      `Game Time: ${formattedTime}`,
      "",
      "═══════════════════════",
      "######## THANK YOU FOR TRUSTING OGCB",
      "═══════════════════════",
      "",
      `Title: ${window.AppState.overrideTitle || "[[TITLE]]"}`,
      `Pick ID: ${pickId}`,
      `Pick by: ${window.AppState.capperName}`,
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

    hypeScreen.innerHTML = `
      <pre style="white-space: pre-wrap; font-family: monospace; background: #fff; border: 1px solid #ccc; padding: 15px; border-radius: 6px; margin-top: 10px; resize: none; overflow: hidden; min-height: 200px; height: auto;">${output}</pre>
    `;
  }
})();
