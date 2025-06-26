(() => {
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

  document.addEventListener("unitSelectionCompleted", () => {
    if (window.AppState.pickType === "upTo5") {
      saveCurrentPick();
      if (window.AppState.currentPickNumber < 5) {
        promptAddAnotherPick();
      } else {
        document.dispatchEvent(new CustomEvent("notesScreenStart"));
      }
    }
  });

  document.addEventListener("newParlayPickStart", () => {
    resetForNextPick();
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
    };
  }

  function resetForNextPick() {
    window.AppState.overrideTeamName = null;
    window.AppState.selectedMatch = null;
    window.AppState.currentWagerWithNum = null;
    window.AppState.currentMatchIndex = 0;

    const inputLabel = document.getElementById("inputLabel");
    const teamSearch = document.getElementById("teamSearch");
    const searchBtn = document.getElementById("searchBtn");
    if(inputLabel) inputLabel.classList.remove("hidden");
    if(teamSearch) {
      teamSearch.classList.remove("hidden");
      teamSearch.value = "";
      teamSearch.focus();
    }
    if(searchBtn) searchBtn.classList.remove("hidden");

    ["gameSuggestion", "customInputSection", "unitDropdownSection", "notesChoiceSection", "notesInputSection"].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.classList.add("hidden");
    });
  }
})();
