// games.js
// Loads game buttons filtered by selected league,
// manages game selection state,
// updates summary dynamically,
// hides game buttons after selection,
// and calls the next step (team selection).

import { db } from "../firebaseInit.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadTeams } from './teamSelector.js';  // Next step selector

let gameButtonsContainer = document.getElementById("gameButtonsContainer");
const gameSelect = document.getElementById("gameSelect");

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

/**
 * Load games filtered by selected league.
 * @param {HTMLElement|null} container Optional container override.
 * @param {string|null} selectedLeague Currently selected league.
 */
export async function loadGames(container = null, selectedLeague = null) {
  const targetContainer = container || gameButtonsContainer;

  console.log('[games.js:36] loadGames called with selectedLeague:', selectedLeague);

  // Clear previous buttons and reset state
  targetContainer.innerHTML = "";
  selectedGameId = null;

  if (gameSelect) {
    gameSelect.innerHTML = '<option>Select a league first</option>';
    gameSelect.disabled = true;
  }

  if (!selectedLeague) {
    targetContainer.textContent = "No league selected.";
    console.warn('[games.js:46] No league selected to load games.');
    return;
  }

  targetContainer.textContent = "Loading games...";

  try {
    // Query GameCache where sportName (which is league) matches selectedLeague
    const q = query(collection(db, "GameCache"), where("sportName", "==", selectedLeague));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      targetContainer.textContent = "No games found";
      if (gameSelect) {
        gameSelect.innerHTML = '<option>No games found</option>';
        gameSelect.disabled = true;
      }
      console.warn('[games.js:60] No games found for selected league.');
      return;
    }

    targetContainer.textContent = "";

    const games = [];
    querySnapshot.forEach(doc => {
      games.push({ id: doc.id, data: doc.data() });
      console.log(`[games.js:68] Found game doc ID: ${doc.id}`);
    });

    // Sort games by commenceTimeUTC ascending
    games.sort((a, b) => {
      const aTime = a.data.commenceTimeUTC ? new Date(a.data.commenceTimeUTC).getTime() : 0;
      const bTime = b.data.commenceTimeUTC ? new Date(b.data.commenceTimeUTC).getTime() : 0;
      return aTime - bTime;
    });

    // Setup container styles
    targetContainer.style.display = "grid";
    targetContainer.style.gridTemplateColumns = "1fr";
    targetContainer.style.gridAutoRows = "min-content";
    targetContainer.style.marginTop = "8px";

    // Create buttons for each game
    games.forEach(({ id, data }) => {
      const btn = createGameButton(id, data);
      targetContainer.appendChild(btn);
    });

    if (gameSelect) {
      gameSelect.disabled = false;
    }

    console.log('[games.js:89] All game buttons created and appended.');

  } catch (error) {
    console.error('[games.js:93] Error loading games:', error);
    targetContainer.textContent = "Error loading games";
  }
}

/**
 * Creates a button element for a game.
 * @param {string} id Game document ID.
 * @param {Object} gameData Game data object.
 * @returns {HTMLButtonElement}
 */
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

  btn.addEventListener("click", () => {
    console.log(`[games.js:116] Game button clicked: ${btn.textContent}`);
    selectGame(id, btn.textContent, gameData);
  });

  return btn;
}

let selectedGame = null;

/**
 * Handles game selection.
 * Updates summary, hides game buttons container,
 * updates hidden select for compatibility,
 * and calls next selector (loadTeams).
 * @param {string} gameId Selected game document ID.
 * @param {string} gameDescription Display text of selected game.
 * @param {Object} gameData Full game data.
 */
function selectGame(gameId, gameDescription, gameData) {
  if (selectedGameId === gameId) {
    console.log('[games.js:133] Selected game is the same as current; ignoring.');
    return;
  }

  selectedGameId = gameId;
  selectedGame = gameData;

  console.log(`[games.js:139] selectGame called for game ID: ${gameId}`);

  // Clear game buttons and show summary line
  if (gameButtonsContainer) {
    gameButtonsContainer.innerHTML = '';
    gameButtonsContainer.style.display = 'block';

    const summaryLine = document.createElement("div");
    summaryLine.textContent = `Selected Game: ${gameDescription}`;
    summaryLine.style.fontWeight = "700";
    summaryLine.style.fontSize = "11px";
    summaryLine.style.fontFamily = "Oswald, sans-serif";
    summaryLine.style.marginBottom = "6px";

    gameButtonsContainer.appendChild(summaryLine);

    console.log('[games.js:153] Game summary updated.');
  } else {
    console.warn('[games.js:156] gameButtonsContainer not found.');
  }

  // Update hidden select for form compatibility
  if (gameSelect) {
    gameSelect.innerHTML = '';
    const option = document.createElement("option");
    option.value = gameId;
    option.selected = true;
    gameSelect.appendChild(option);
    gameSelect.disabled = false;
    gameSelect.dispatchEvent(new Event("change"));
    console.log('[games.js:166] Hidden gameSelect updated and change event dispatched.');
  }

  // Call next selector: loadTeams for this game
  loadTeams(null, gameData);
  console.log('[games.js:170] Called loadTeams with selected game data.');
}
