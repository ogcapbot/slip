(() => {
  const sportsScreen = document.getElementById("sports-screen");

  let matches = [];
  let currentMatchIndex = 0;
  let selectedMatch = null;

  function createUI() {
    sportsScreen.innerHTML = `
      <div id="loggedInInfo" style="text-align:center; margin-bottom:20px;">
        <h5 id="loginNotice" style="color:red;"></h5>
      </div>

      <label id="inputLabel" style="color:#666; font-size:14px; margin-bottom:5px; display:block;">
        Enter Team Name: (e.g. 'Chicago Cubs' or 'Cubs')
      </label>
      <input type="text" id="teamSearch" placeholder="Must be at least 3 Characters" style="width: 100%; max-width: 400px; box-sizing: border-box; padding: 12px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;" />
      <button id="searchBtn">Submit</button>
      <div class="error" id="searchError" style="color:red; font-size: 14px; margin-top: 5px;"></div>
      <div id="gameSuggestion" class="hidden" style="margin-top: 15px;"></div>
      <div id="customInputSection" class="hidden" style="margin-top: 15px;"></div>
      <div id="unitDropdownSection" class="hidden" style="margin-top: 15px;">
        <label for="unitDropdown" style="color:#666;font-size:14px;margin-bottom:5px;display:block;">Select Unit(s):</label>
        <select id="unitDropdown" style="width: 100%; max-width: 400px; box-sizing: border-box; padding: 12px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;"></select>
        <div class="error" id="unitDropdownError" style="color:red; font-size: 14px; margin-top: 5px;"></div>
      </div>

      <div id="notesChoiceSection" class="hidden" style="margin-top: 20px;">
        <label style="color: #666; font-size: 14px; margin-bottom: 10px; display: block;">
          Do You Want to Include any Comments/Notes?
        </label>
        <button id="yesNoteBtn">Yes, Enter Comment/Note</button>
        <button id="noNoteBtn">No, Proceed to Next Step</button>
      </div>

      <div id="notesInputSection" class="hidden" style="margin-top: 20px;">
        <div id="notesHeaderRow" style="display: none; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <label for="notesInput" style="color: #666; font-size: 14px;">
            Enter Your Comment/Note Below:
          </label>
          <div id="charCount" style="color: #666; font-size: 14px;">
            Remaining: 100
          </div>
        </div>
        <textarea
          id="notesInput"
          rows="2"
          maxlength="100"
          placeholder="Enter Comment/Note Here"
          style="font-family: 'Oswald', Arial, sans-serif; font-size: 14px; width: 100%; box-sizing: border-box;"
        ></textarea>
        <button id="submitNoteBtn" class="hidden">Submit</button>
      </div>

      <pre id="confirmOutput" class="hidden" style="white-space: pre-wrap; font-family: monospace; background: #fff; border: 1px solid #ccc; padding: 15px; border-radius: 6px; margin-top: 10px; resize: none; overflow: hidden; min-height: 200px; height: auto;"></pre>
    `;

    document.getElementById("loginNotice").textContent = `Logged in as: ${window.AppState.capperName}`;
    setupListeners();
  }

  function setupListeners() {
    const teamSearchInput = document.getElementById("teamSearch");
    const searchBtn = document.getElementById("searchBtn");

    searchBtn.addEventListener("click", searchGames);
    teamSearchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") searchGames();
    });

    document.addEventListener("overrideSelected", () => {
      document.dispatchEvent(new CustomEvent("proceedToWager"));
    });

    document.addEventListener("gameSelected", () => {
      document.dispatchEvent(new CustomEvent("proceedToWager"));
    });
  }

  async function searchGames() {
    clearErrors();

    const inputVal = document.getElementById("teamSearch").value.trim().toLowerCase();
    if (inputVal.length < 3) {
      showError("Please enter at least 3 characters to search.");
      return;
    }

    const rows = window.AppState.allData.gameCache || [];
    let results = [];

    for (let row of rows) {
      const home = (row["Home Team"] || "").toLowerCase();
      const away = (row["Away Team"] || "").toLowerCase();
      const date = new Date(row["Commence Time (UTC)"]);

      if (
        inputVal === home ||
        inputVal === away ||
        home.split(" ").includes(inputVal) ||
        away.split(" ").includes(inputVal) ||
        (inputVal.length >= 3 && (home.includes(inputVal) || away.includes(inputVal)))
      ) {
        results.push({ row, date });
      }
    }

    results.sort((a, b) => a.date - b.date);

    if (results.length === 0) {
      showNoResults(inputVal);
      return;
    }

    window.AppState.matches = results;
    window.AppState.currentMatchIndex = 0;
    showGameOption();
  }

  function clearErrors() {
    const errorDiv = document.getElementById("searchError");
    if (errorDiv) errorDiv.textContent = "";
  }

  function showError(msg) {
    const errorDiv = document.getElementById("searchError");
    if (errorDiv) errorDiv.textContent = msg;
  }

  function showNoResults(inputVal) {
    const container = document.getElementById("gameSuggestion");
    const searchError = document.getElementById("searchError");

    searchError.textContent = "";
    container.classList.remove("hidden");
    container.innerHTML = `
      <div style="color: red; font-weight: bold;">
        No matching games found for '${inputVal}'.
        <br>
        Please be more specific and try again.
      </div>
      <h3 style="margin-top: 10px; color: black;">Manual Override Option:</h3>
      <p style="color: black;">
        If you have tried being more specific and checked for spelling errors and are still receiving 0 results,
        you can manually override the lookup function and use your input value of <strong>'${inputVal}'</strong> instead.
        <br><br>
        Please double check the spelling and use the complete name before Overriding.
      </p>
      <h3 style="color: black;">Your Input Value: '${inputVal}'</h3>
      <button id="overrideBtn" style="margin-top: 10px; padding: 10px; background-color: #d9534f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
        Override – Use Value Above
      </button>
    `;

    document.getElementById("overrideBtn").onclick = () => {
      window.AppState.overrideTeamName = inputVal;
      window.AppState.selectedMatch = {
        "League (Group)": "Unavailable",
        "Sport Name": "Unavailable",
        "Home Team": "Unavailable",
        "Away Team": "Unavailable",
        "Commence Time (UTC)": null
      };
      hideGameSearchUI();
      document.dispatchEvent(new CustomEvent("overrideSelected"));
    };
  }

  function showGameOption() {
    const container = document.getElementById("gameSuggestion");
    const matches = window.AppState.matches;
    const currentMatchIndex = window.AppState.currentMatchIndex;

    if (currentMatchIndex >= matches.length) {
      showError("No more matches. Please be more specific and try again.");
      return;
    }

    const { row, date } = matches[currentMatchIndex];
    window.AppState.selectedMatch = row;

    const now = new Date();
    const dateMidnight = new Date(date);
    dateMidnight.setHours(0, 0, 0, 0);
    const nowMidnight = new Date(now);
    nowMidnight.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((dateMidnight - nowMidnight) / (1000 * 60 * 60 * 24));

    let c_date = "";
    if (daysDiff === 0 || (daysDiff < 0 && now.toDateString() === date.toDateString())) {
      c_date = "Today";
    } else if (daysDiff === 1) {
      c_date = "Tomorrow";
    } else {
      c_date = `${Math.abs(daysDiff)} Days ${daysDiff < 0 ? "Ago" : "Away"}`;
    }

    const teamInputRaw = document.getElementById("teamSearch").value.trim();
    const timeFormatted = date.toLocaleString("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const matchedTeam = [row["Home Team"], row["Away Team"]].find(team =>
      team.toLowerCase().includes(teamInputRaw.toLowerCase())
    ) || teamInputRaw;

    container.classList.remove("hidden");
    container.innerHTML = `
      <div style="font-weight: bold; font-size: 20px; white-space: nowrap;">
        Results Found for '${teamInputRaw}': <span style="color: red;">${matches.length}</span>
      </div>
      <p style="margin-top:10px;">Did you mean:</p>
      <p style="text-align: center; margin: 5px 0 15px;">
        <strong style="font-size: 24px;">${matchedTeam}</strong>
      </p>
      <p>Sport: ${row["League (Group)"]}</p>
      <p>League: ${row["Sport Name"]}</p>
      <p>Next Event: ${row["Away Team"]} @ ${row["Home Team"]}</p>
      <p>When: ${c_date} @ ${timeFormatted} EST</p>
      <br />
      ${matches.length > 1 ? '<button id="nextOptionBtn">Next Option</button>' : ''}
      <button id="useThisGameBtn">Use This Game</button>
    `;

    if (matches.length > 1) {
      document.getElementById("nextOptionBtn").onclick = () => {
        window.AppState.currentMatchIndex++;
        showGameOption();
      };
    }

    document.getElementById("useThisGameBtn").onclick = () => {
      container.classList.add("hidden");
      hideGameSearchUI();
      document.dispatchEvent(new CustomEvent("gameSelected"));
    };
  }

  function hideGameSearchUI() {
    document.getElementById("inputLabel").classList.add("hidden");
    document.getElementById("teamSearch").classList.add("hidden");
    document.getElementById("searchBtn").classList.add("hidden");
  }

  document.addEventListener("startSportsScreen", () => {
    window.AppState.matches = [];
    window.AppState.currentMatchIndex = 0;
    window.AppState.selectedMatch = null;
    window.AppState.overrideTeamName = null;
    createUI();
    document.getElementById("teamSearch").focus();
  });
})();
