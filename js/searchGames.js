// searchGames.js

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

document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  const teamSearch = document.getElementById("teamSearch");

  searchBtn.addEventListener("click", searchGames);

  teamSearch.addEventListener("keydown", e => {
    if (e.key === "Enter") searchGames();
  });
});
