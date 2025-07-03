// admin/js/gameSelector.js
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
  if (!container) {
    container = gameButtonsContainer;
  }
  container.innerHTML = '';
  selectedGameId = null;

  if (!selectedLeague) {
    console.warn("[GameSelector] No league selected, cannot load games.");
    return;
  }

  // Query games based on the selectedLeague
  const gamesRef = collection(db, "games");
  const q = query(gamesRef, where("league", "==", selectedLeague));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    container.innerHTML = "<p>No games available for the selected league.</p>";
    return;
  }

  querySnapshot.forEach((doc) => {
    const game = doc.data();
    const button = document.createElement("button");
    button.textContent = game.name || game.id || "Unnamed Game";
    button.classList.add("btn", "btn-primary", "m-1");
    button.dataset.gameId = doc.id;

    button.addEventListener("click", () => {
      selectedGameId = doc.id;

      // Hide all game buttons after selection
      container.style.display = "none";

      // Update summary or perform any other update (you can trigger an event or call a function here)
      const event = new CustomEvent('gameSelected', { detail: { gameId: selectedGameId, gameData: game } });
      window.dispatchEvent(event);

      // Load next selector
      loadTeams(null, selectedGameId);
    });

    container.appendChild(button);
  });

  // Show the container after building buttons
  container.style.display = "block";
}
