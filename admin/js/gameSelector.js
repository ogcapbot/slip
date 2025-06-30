import { db } from "../firebaseInit.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const leagueSelect = document.getElementById("leagueSelect");
const gameSelect = document.getElementById("gameSelect");
const pickOptionsContainer = document.getElementById("pickOptionsContainer");

if (gameSelect) {
  gameSelect.style.display = "none";
}

let gameButtonsContainer = document.getElementById("gameButtonsContainer");
if (!gameButtonsContainer) {
  gameButtonsContainer = document.createElement("div");
  gameButtonsContainer.id = "gameButtonsContainer";

  const gameLabel = document.querySelector('label[for="gameSelect"]');
  if (gameLabel) {
    gameLabel.parentNode.insertBefore(gameButtonsContainer, gameLabel.nextSibling);
  } else if (gameSelect && gameSelect.parentNode) {
    gameSelect.parentNode.insertBefore(gameButtonsContainer, gameSelect.nextSibling);
  } else {
    document.body.appendChild(gameButtonsContainer);
  }
}

let selectedGameId = null;
let changeGameBtn = null;
let selectedTeam = null;

leagueSelect.addEventListener("change", async () => {
  console.log("League changed:", leagueSelect.value);
  resetGameSelection();
  clearPickOptions();
  await loadGamesForSelectedLeague();
});

gameSelect.addEventListener("change", async () => {
  console.log("Game select changed:", gameSelect.value);
  // No special action needed here for now
});

async function loadGamesForSelectedLeague() {
  const selectedLeague = leagueSelect.value;
  if (!selectedLeague) {
    gameSelect.innerHTML = '<option>Select a league first</option>';
    gameSelect.disabled = true;
    gameButtonsContainer.innerHTML = '';
    return;
  }

  gameSelect.disabled = true;
  gameSelect.innerHTML = '';
  gameButtonsContainer.textContent = "Loading games...";

  try {
    const q = query(collection(db, "GameCache"), where("sportName", "==", selectedLeague));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      gameButtonsContainer.textContent = "No games found";
      gameSelect.innerHTML = '<option>No games found</option>';
      gameSelect.disabled = true;
      return;
    }

    gameButtonsContainer.textContent = "";

    const games = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      games.push({ id: doc.id, data });
    });

    games.sort((a, b) => {
      const aTime = a.data.commenceTimeUTC ? new Date(a.data.commenceTimeUTC).getTime() : 0;
      const bTime = b.data.commenceTimeUTC ? new Date(b.data.commenceTimeUTC).getTime() : 0;
      return aTime - bTime;
    });

    gameButtonsContainer.style.display = "grid";
    gameButtonsContainer.style.gridTemplateColumns = "1fr";
    gameButtonsContainer.style.gridAutoRows = "min-content";
    gameButtonsContainer.style.marginTop = "8px";

    games.forEach(({ id, data }) => {
      gameButtonsContainer.appendChild(createGameButton(id, data));
    });

    gameSelect.disabled = false;
  } catch (error) {
    console.error("Error loading games:", error);
    gameButtonsContainer.textContent = "Error loading games";
  }
}

function createGameButton(id, gameData) {
  console.log("Creating game button:", id);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pick-btn blue";

  btn.style.paddingTop = "6px";
  btn.style.paddingBottom = "6px";
  btn.style.marginTop = "2px";
  btn.style.marginBottom = "2px";

  btn.style.width = "100%";
  btn.style.minWidth = "0";
  btn.style.boxSizing = "border-box";

  const startTime = gameData.commenceTimeUTC ? new Date(gameData.commenceTimeUTC) : null;
  const timeString = startTime ? startTime.toLocaleString() : "Unknown time";

  btn.textContent = `${gameData.homeTeam || "Home"} vs ${gameData.awayTeam || "Away"} — ${timeString}`;

  btn.onclick = function () {
    console.log("Game button clicked:", id);
    selectGame(btn, id);
  };

  return btn;
}

function selectGame(button, gameId) {
  console.log("selectGame fired for gameId:", gameId);
  if (selectedGameId === gameId) return;

  selectedGameId = gameId;

  // Hide the game buttons list
  gameButtonsContainer.innerHTML = "";
  gameButtonsContainer.style.display = "block";

  // Prepare but DO NOT show Change Game button yet
  if (!changeGameBtn) {
    changeGameBtn = document.createElement("button");
    changeGameBtn.type = "button";
    changeGameBtn.textContent = "Change Game";
    changeGameBtn.className = "pick-btn blue";
    changeGameBtn.style.minWidth = "120px";
    changeGameBtn.style.width = "100%";
    changeGameBtn.style.boxSizing = "border-box";
    changeGameBtn.style.alignSelf = "flex-start";
    changeGameBtn.style.marginTop = "0";

    changeGameBtn.onclick = () => {
      console.log("Change Game button clicked");
      resetGameSelection();
    };
  }
  // Hide change button initially (will show after team pick)
  changeGameBtn.style.display = "none";

  // Clear pickOptionsContainer and show the two team buttons side by side
  const [home, rest] = button.textContent.split(" vs ");
  const away = rest ? rest.split(" — ")[0] : "Away";

  console.log("Showing teams:", home, away);
  if (pickOptionsContainer) {
    pickOptionsContainer.innerHTML = "";
    // Create a container with grid styling for 2 columns
    pickOptionsContainer.style.display = "grid";
    pickOptionsContainer.style.gridTemplateColumns = "1fr 1fr";
    pickOptionsContainer.style.gap = "8px";
    pickOptionsContainer.style.marginTop = "8px";

    // Append team buttons side by side
    pickOptionsContainer.appendChild(createTeamButton(home));
    pickOptionsContainer.appendChild(createTeamButton(away));
    selectedTeam = null;
  }

  // Update hidden select for form compatibility
  gameSelect.innerHTML = "";
  const option = document.createElement("option");
  option.value = gameId;
  option.selected = true;
  gameSelect.appendChild(option);
  gameSelect.disabled = false;
  gameSelect.dispatchEvent(new Event("change"));

  // Append Change Game button to pickOptionsContainer but keep hidden for now
  pickOptionsContainer.appendChild(changeGameBtn);
}

function createTeamButton(teamName) {
  console.log("Creating team button for:", teamName);
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

  btn.onclick = () => selectTeam(btn, teamName);

  return btn;
}

function selectTeam(button, teamName) {
  console.log("Team selected:", teamName);
  if (selectedTeam === teamName) return;

  selectedTeam = teamName;

  if (pickOptionsContainer) {
    const buttons = pickOptionsContainer.querySelectorAll("button.pick-btn");
    buttons.forEach((b) => {
      b.classList.remove("green");
      b.classList.add("blue");
    });
  }

  button.classList.remove("blue");
  button.classList.add("green");

  // Move the selected team button to the left column, and Change Game to right column

  if (pickOptionsContainer) {
    pickOptionsContainer.style.gridTemplateColumns = "1fr 1fr";
    pickOptionsContainer.style.alignItems = "center";
    pickOptionsContainer.style.gap = "8px";

    // Remove all buttons except selected team & changeGameBtn
    pickOptionsContainer.innerHTML = "";
    // Append selected team button first (left column)
    pickOptionsContainer.appendChild(button);
    // Show and append Change Game button (right column)
    changeGameBtn.style.display = "inline-block";
    pickOptionsContainer.appendChild(changeGameBtn);

    // Style selected team button to match other buttons size (example width 120px, height 40px)
    button.style.width = "120px";
    button.style.minWidth = "120px";
    button.style.height = "40px";
    button.style.margin = "0";
    button.style.paddingTop = "6px";
    button.style.paddingBottom = "6px";
    button.style.fontSize = "1rem";
    button.classList.remove("blue");
    button.classList.add("green");

    // Style Change Game button to match (same width & height)
    changeGameBtn.style.width = "120px";
    changeGameBtn.style.minWidth = "120px";
    changeGameBtn.style.height = "40px";
    changeGameBtn.style.margin = "0";
    changeGameBtn.style.paddingTop = "6px";
    changeGameBtn.style.paddingBottom = "6px";
    changeGameBtn.style.fontSize = "1rem";
  }
}

function resetGameSelection() {
  console.log("Resetting game selection");
  selectedGameId = null;
  selectedTeam = null;

  if (changeGameBtn) {
    changeGameBtn.remove();
    changeGameBtn = null;
  }

  gameSelect.innerHTML = '<option value="" disabled selected>Select a game</option>';
  gameSelect.disabled = true;
  gameSelect.dispatchEvent(new Event("change"));

  gameButtonsContainer.innerHTML = "";
  gameButtonsContainer.style.display = "grid";

  if (pickOptionsContainer) {
    pickOptionsContainer.innerHTML = "";
    pickOptionsContainer.style.display = "block";
    pickOptionsContainer.style.gridTemplateColumns = "";
  }
}

function clearPickOptions() {
  if (pickOptionsContainer) {
    pickOptionsContainer.innerHTML = "";
    pickOptionsContainer.style.display = "block";
    pickOptionsContainer.style.gridTemplateColumns = "";
  }
}

export default {};
