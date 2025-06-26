// js/upto5picks.js
(() => {
  // Manages parlay picks up to 5 picks
  // After each pick, store pick in AppState.parlayPicks array as "Pick 1", "Pick 2", etc.
  // After wager and unit selection, ask if want to add another pick (up to 5)
  // Show buttons accordingly, final submit only after 5 or user stops

  const sportsScreen = document.getElementById("sports-screen");

  function promptAddAnotherPick() {
    const container = document.getElementById("customInputSection");
    container.innerHTML = `
      <button id="addAnotherPickBtn" style="margin-bottom: 10px;">Add Another Parlay Pick</button>
      <button id="submitFinalPickBtn">Submit Parlay Picks</button>
    `;
    container.classList.remove("hidden");

    document.getElementById("addAnotherPickBtn").onclick = () => {
      container.classList.add("hidden");
      window.AppState.currentPickNumber++;
      if (window.AppState.currentPickNumber <= 5) {
        document.dispatchEvent(new CustomEvent("newParlayPickStart"));
      }
    };
    document.getElementById("submitFinalPickBtn").onclick = () => {
      container.classList.add("hidden");
      document.dispatchEvent(new CustomEvent("notesScreenStart"));
    };
  }

  // Listen when unit selection completes in parlay flow
  document.addEventListener("unitSelectionCompleted", () => {
    if (window.AppState.pickType === "upTo5") {
      // Save current pick details in parlayPicks array
      saveCurrentPick();

      if (window.AppState.currentPickNumber < 5) {
        promptAddAnotherPick();
      } else {
        // Max picks reached, proceed to notes
        document.dispatchEvent(new CustomEvent("notesScreenStart"));
      }
    }
  });

  // Listen for newParlayPickStart event to reset for next pick
  document.addEventListener("newParlayPickStart", () => {
    resetForNextPick();
    // Show sports screen for new pick
    document.getElementById("sports-screen").classList.remove("hidden");
  });

  function saveCurrentPick() {
    const pickNum = window.AppState.currentPickNumber;
    const pickLabel = `Pick ${pickNum}`;
    const selectedMatch = window.AppState.selectedMatch || {};
    const wagerRaw = window.AppState.currentWagerWithNum || "";

    window.AppState.parlayPicks[pickNum - 1] = {
      label: pickLabel,
      homeTeam: selectedMatch["Home Team"] || "",
      awayTeam: selectedMatch["Away Team"] || "",
      wager: wagerRaw,
      // Add other relevant fields as needed
    };
  }

  function resetForNextPick() {
    // Clear inputs for next pick, reset AppState related to wager, etc.
    window.AppState.overrideTeamName = null;
    window.AppState.selectedMatch = null;
    window.AppState.currentWagerWithNum = null;
    window.AppState.currentMatchIndex = 0;

    // Reset UI for next pick:
    // Show inputs for team search and wager again, this is managed in game.js/wager.js
    const inputLabel = document.getElementById("inputLabel");
    const teamSearch = document.getElementById("teamSearch");
    const searchBtn = document.getElementById("searchBtn");
    if(inputLabel) {
      inputLabel.classList.remove("hidden");
    }
    if(teamSearch) {
      teamSearch.classList.remove("hidden");
      teamSearch.value = "";
      teamSearch.focus();
    }
    if(searchBtn) {
      searchBtn.classList.remove("hidden");
    }

    // Hide other sections
    const toHide = ["gameSuggestion", "customInputSection", "unitDropdownSection", "notesChoiceSection", "notesInputSection"];
    toHide.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.classList.add("hidden");
    });
  }
})();
