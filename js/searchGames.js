function searchGames() {
  const input = document.getElementById("teamSearch").value.trim().toLowerCase();
  const rows = allData.gameCache || [];
  const resultSet = [];

  for (let row of rows) {
    const home = (row["Home Team"] || "").toLowerCase();
    const away = (row["Away Team"] || "").toLowerCase();
    const date = new Date(row["Commence Time (UTC)"]);

    if (input === home || input === away ||
      home.split(" ").includes(input) || away.split(" ").includes(input) ||
      (input.length >= 3 && (home.includes(input) || away.includes(input)))) {
      resultSet.push({ row, date });
    }
  }

  matches = resultSet.sort((a, b) => a.date - b.date);
  currentMatchIndex = 0;

  if (matches.length > 0) {
    const input = document.getElementById("teamSearch");
    const label = document.getElementById("inputLabel");
    const button = document.getElementById("searchBtn");

    input.classList.add("hidden");
    label.classList.add("hidden");
    button.classList.add("hidden");

    input.style.display = "none";
    label.style.display = "none";
    button.style.display = "none";
  }

  showGameOption();
}

function showGameOption() {
  const container = document.getElementById("gameSuggestion");
  const searchError = document.getElementById("searchError");

  container.classList.add("hidden");
  searchError.textContent = "";

  if (matches.length === 0) {
    const teamInputRaw = document.getElementById("teamSearch").value.trim();

    searchError.innerHTML = `
      <div style="color: red; font-weight: bold;">
        No matching games found for '${teamInputRaw}'.
        <br>
        Please be more specific and try again.
      </div>

      <h3 style="margin-top: 10px; color: black;">Manual Override Option:</h3>
      <p style="color: black;">
        If you have tried being more specific and checked for spelling errors and are still receiving 0 results,
        you can manually override the lookup function and use your input value of <strong>'${teamInputRaw}'</strong> instead.
        <br><br>
        Please double check the spelling and use the complete name before Overriding.
      </p>
      <h3 style="color: black;">Your Input Value: '${teamInputRaw}'</h3>
      <button id="overrideBtn" style="margin-top: 10px; padding: 10px; background-color: #d9534f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
        Override – Use Value Above
      </button>
    `;

    document.getElementById("overrideBtn").onclick = function () {
      const overrideValue = teamInputRaw;
      window.overrideTeamName = overrideValue;
      selectedMatch = {
        "League (Group)": "Unavailable",
        "Sport Name": "Unavailable",
        "Home Team": "Unavailable",
        "Away Team": "Unavailable",
        "Commence Time (UTC)": null
      };

      const input = document.getElementById("teamSearch");
      const label = document.getElementById("inputLabel");
      const button = document.getElementById("searchBtn");

      input.classList.add("hidden");
      label.classList.add("hidden");
      button.classList.add("hidden");

      input.style.display = "none";
      label.style.display = "none";
      button.style.display = "none";

      document.getElementById("searchError").innerHTML = "";
      document.getElementById("gameSuggestion").classList.add("hidden");

      document.getElementById("customInputSection").classList.remove("hidden");
      document.getElementById("wagerType")?.focus();
    };

    return;
  }

  if (currentMatchIndex >= matches.length) {
    searchError.textContent = "No more matches. Please be more specific and try again.";
    return;
  }

  const { row, date } = matches[currentMatchIndex];
  selectedMatch = row;
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

  const timeString = `${c_date} @ ${timeFormatted} EST`;
  const matchedTeam = [row["Home Team"], row["Away Team"]].find(team =>
    team.toLowerCase().includes(teamInputRaw.toLowerCase())
  ) || teamInputRaw;

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

  container.classList.remove("hidden");

  // Add event listeners for new buttons:
  const nextBtn = document.getElementById("nextOptionBtn");
  if (nextBtn) {
    nextBtn.addEventListener("click", nextOption);
  }
  document.getElementById("useThisGameBtn").addEventListener("click", useThisGame);
}

function nextOption() {
  currentMatchIndex++;
  showGameOption();
}

function useThisGame() {
  document.getElementById("gameSuggestion").classList.add("hidden");

  document.getElementById("inputLabel").classList.add("hidden");
  document.getElementById("teamSearch").classList.add("hidden");
  document.getElementById("searchBtn").classList.add("hidden");

  document.getElementById("customInputSection").classList.remove("hidden");
  buildWagerDropdown();
}

document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  const teamSearch = document.getElementById("teamSearch");

  searchBtn.addEventListener("click", searchGames);

  teamSearch.addEventListener("keydown", e => {
    if (e.key === "Enter") searchGames();
  });
});
