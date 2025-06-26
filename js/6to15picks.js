// js/6to15picks.js
(() => {
  // Manages parlay picks from 6 to 15 picks
  // Requires minimum 6 picks before showing submit button
  // After 6 picks, allow add another pick up to 15, then submit only

  const containerId = "customInputSection";

  function promptAddPickButtons() {
    const container = document.getElementById(containerId);
    container.classList.remove("hidden");

    let html = "";
    const currentPick = window.AppState.currentPickNumber;

    if (currentPick < 6) {
      html = `<button id="addAnotherPickBtn" disabled style="margin-bottom:10px;opacity:0.6; cursor:not-allowed;">Add Another Parlay Pick (Minimum 6 picks required)</button>`;
    } else if (currentPick >= 6 && currentPick < 15) {
      html = `
        <button id="addAnotherPickBtn" style="margin-bottom:10px;">Add Another Parlay Pick</button>
        <button id="submitFinalPickBtn">Submit Parlay Picks</button>
      `;
    } else {
      // 15 picks max, only submit
      html = `<button id="submitFinalPickBtn">Submit Parlay Picks</button>`;
    }

    container.innerHTML = html;

    const addBtn = document.getElementById("addAnotherPickBtn");
    const submitBtn = document.getElementById("submitFinalPickBtn");

    if(addBtn) {
      addBtn.onclick = () => {
        if (window.AppState.currentPickNumber < 15) {
          container.classList.add("hidden");
          window.AppState.currentPickNumber++;
          document.dispatchEvent(new CustomEvent("newParlayPickStart"));
        }
      };
    }

    if(submitBtn) {
      submitBtn.onclick = () => {
        container.classList.add("hidden");
        if(window.AppState.currentPickNumber < 6){
          alert("You must select at least 6 picks.");
          promptAddPickButtons(); // re-show buttons
          return;
        }
        document.dispatchEvent(new CustomEvent("notesScreenStart"));
      };
    }
  }

  document.addEventListener("unitSelectionCompleted", () => {
    if (window.AppState.pickType === "6to15") {
      saveCurrentPick();
      promptAddPickButtons();
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

    // Hide other sections
    ["gameSuggestion", "customInputSection", "unitDropdownSection", "notesChoiceSection", "notesInputSection"].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.classList.add("hidden");
    });
  }
})();
