const pickOptionsContainer = document.getElementById("pickOptionsContainer");

let selectedTeam = null;

export async function loadTeams(container = null, gameData = null) {
  const targetContainer = container || pickOptionsContainer;

  targetContainer.innerHTML = "";
  selectedTeam = null;

  if (!gameData) {
    targetContainer.textContent = "No game data provided";
    return;
  }

  const homeTeam = gameData.homeTeam || "Home";
  const awayTeam = gameData.awayTeam || "Away";

  targetContainer.style.display = "grid";
  targetContainer.style.gridTemplateColumns = "1fr 1fr";
  targetContainer.style.gap = "8px";
  targetContainer.style.marginTop = "8px";

  targetContainer.appendChild(createTeamButton(homeTeam));
  targetContainer.appendChild(createTeamButton(awayTeam));
}

function createTeamButton(teamName) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = teamName;
  btn.className = "pick-btn blue";

  btn.style.paddingTop = "6px";
  btn.style.paddingBottom = "6px";
  btn.style.marginTop = "2px";
  btn.style.marginBottom = "2px";

  btn.style.width = "100%";
  btn.style.minWidth = "0";
  btn.style.boxSizing = "border-box";

  btn.addEventListener("click", () => selectTeam(btn, teamName));

  return btn;
}

function selectTeam(button, teamName) {
  if (selectedTeam === teamName) return;
  selectedTeam = teamName;

  const container = button.parentNode;
  if (!container) return;

  container.innerHTML = "";

  const summaryLine = document.createElement("div");
  summaryLine.textContent = `Selected Team: ${teamName}`;
  summaryLine.style.fontWeight = "700";
  summaryLine.style.fontSize = "11px";
  summaryLine.style.fontFamily = "Oswald, sans-serif";
  summaryLine.style.marginBottom = "6px";

  container.appendChild(summaryLine);
}
