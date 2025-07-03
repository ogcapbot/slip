import { db } from "../firebaseInit.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadTeams } from './teamSelector.js';  // Next step selector

const gameSelect = document.getElementById("gameSelect");
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

if (gameSelect) {
  gameSelect.style.display = "none";
}

let selectedGameId = null;

export async function loadGames(container = null, selectedLeague = null) {
  const targetContainer = container || gameButtonsContainer;

  targetContainer.innerHTML = "";
  selectedGameId = null;

  gameSelect.innerHTML = '<option>Select a league first</option>';
  gameSelect.disabled = true;

  if (!selectedLeague) {
    return; // No league selected yet
  }

  targetContainer.textContent = "Loading games...";

  try {
    const q = query(collection(db, "GameCache"), where("sportName", "==", selectedLeague));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      targetContainer.textContent = "No games found";
      gameSelect.innerHTML = '<option>No games found</option>';
      gameSelect.disabled = true;
      return;
    }

    targetContainer.textContent = "";

    const games = [];
    querySnapshot.forEach(doc => {
      games.push({ id: doc.id, data: doc.data() });
    });

    games.sort((a, b) => {
      const aTime = a.data.commenceTimeUTC ? new Date(a.data.commenceTimeUTC).getTime() : 0;
      const bTime = b.data.commenceTimeUTC ? new Date(b.data.commenceTimeUTC).getTime() : 0;
      return aTime - bTime;
    });

    targetContainer.style.display = "grid";
    targetContainer.style.gridTemplateColumns = "1fr";
    targetContainer.style.gridAutoRows = "min-content";
    targetContainer.style.marginTop = "8px";

    games.forEach(({ id, data }) => {
      targetContainer.appendChild(createGameButton(id, data));
    });

    gameSelect.disabled = false;
  } catch (error) {
    console.error("Error loading games:", error);
    targetContainer.textContent = "Error loading games";
  }
}

function createGameButton(id, gameData) {
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

  btn.addEventListener("click", () => selectGame(id, btn.textContent, gameData));

  return btn;
}

function selectGame(gameId, gameDescription, gameData) {
  if (selectedGameId === gameId) return;

  selectedGameId = gameId;

  // Clear buttons and show summary line
  gameButtonsContainer.innerHTML = "";
  gameButtonsContainer.style.display = "block";

  const summaryLine = document.createElement("div");
  summaryLine.textContent = `Selected Game: ${gameDescription}`;
  summaryLine.style.fontWeight = "700";
  summaryLine.style.fontSize = "11px";
  summaryLine.style.fontFamily = "Oswald, sans-serif";
  summaryLine.style.marginBottom = "6px";

  gameButtonsContainer.appendChild(summaryLine);

  // Update hidden select for compatibility
  gameSelect.innerHTML = "";
  const option = document.createElement("option");
  option.value = gameId;
  option.selected = true;
  gameSelect.appendChild(option);
  gameSelect.disabled = false;
  gameSelect.dispatchEvent(new Event("change"));

  // Call next selector: loadTeams for this game
  loadTeams(null, gameData);
}
