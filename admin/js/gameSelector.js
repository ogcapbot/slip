// admin/js/gameSelector.js
import { db } from "../firebaseInit.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const leagueSelect = document.getElementById("leagueSelect");
const gameSelect = document.getElementById("gameSelect");

const gameButtonsContainer = document.getElementById("gameButtonsContainer");

// Hide the original gameSelect dropdown but keep for compatibility
if (gameSelect) {
  gameSelect.style.display = "none";
  gameSelect.disabled = true;
}

// Hide game buttons container initially
if (gameButtonsContainer) {
  gameButtonsContainer.style.display = "none";
}

let selectedGameId = null;
let changeGameBtn = null;

leagueSelect.addEventListener("change", async () => {
  const selectedLeague = leagueSelect.value;
  gameButtonsContainer.innerHTML = "";
  selectedGameId = null;
  if (changeGameBtn) {
    changeGameBtn.remove();
    changeGameBtn = null;
  }

  // Reset game select and hide
  gameSelect.innerHTML = '<option>Select a league first</option>';
  gameSelect.disabled = true;
  if (gameSelect) gameSelect.style.display = "none";
  if (gameButtonsContainer) gameButtonsContainer.style.display = "none";

  if (!selectedLeague) {
    return;
  }

  gameSelect.disabled = true;
  gameSelect.value = "";
  gameSelect.style.display = "none"; // keep hidden; use buttons only

  gameButtonsContainer.textContent = "Loading games...";
  gameButtonsContainer.style.display = "";

  try {
    const q = query(collection(db, "GameCache"), where("League", "==", selectedLeague));
    const querySnapshot = await getDocs(q);

    const gamesMap = new Map();
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.id && data.HomeTeam && data.AwayTeam) {
        // Store games by ID with Home vs Away display
        gamesMap.set(doc.id, {
          id: doc.id,
          display: `${data.AwayTeam} @ ${data.HomeTeam}`
        });
      }
    });

    if (gamesMap.size === 0) {
      gameButtonsContainer.textContent = "No games found";
      gameSelect.innerHTML = '<option>No games found</option>';
      gameSelect.disabled = true;
      return;
    }

    gameButtonsContainer.textContent = "";

    const games = Array.from(gamesMap.values());

    // Style container as 3-column CSS grid with tight gaps
    gameButtonsContainer.style.display = "grid";
    gameButtonsContainer.style.gridTemplateColumns = "repeat(3, 1fr)";
    gameButtonsContainer.style.gridAutoRows = "min-content";
    gameButtonsContainer.style.gap = "4px 6px"; // vertical 4px, horizontal 6px
    gameButtonsContainer.style.marginTop = "8px";
    gameButtonsContainer.style.alignItems = "start";

    // Create and append game buttons
    games.forEach(game => {
      gameButtonsContainer.appendChild(createGameButton(game.id, game.display));
    });
  } catch (error) {
    gameButtonsContainer.textContent = "Error loading games";
    console.error("Error loading games:", error);
  }
});

function createGameButton(gameId, displayText) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = displayText;
  btn.className = "pick-btn blue";

  btn.style.paddingTop = "6px";
  btn.style.paddingBottom = "6px";
  btn.style.marginTop = "2px";
  btn.style.marginBottom = "2px";

  btn.style.width = "100%";
  btn.style.minWidth = "0";
  btn.style.boxSizing = "border-box";

  btn.addEventListener("click", () => selectGame(btn, gameId));

  return btn;
}

function selectGame(button, gameId) {
  if (selectedGameId === gameId) return;

  selectedGameId = gameId;

  // Update hidden dropdown for form compatibility
  gameSelect.innerHTML = "";
  const option = document.createElement("option");
  option.value = gameId;
  option.selected = true;
  gameSelect.appendChild(option);
  gameSelect.disabled = false;
  gameSelect.style.display = "none"; // keep hidden, buttons shown instead
  gameSelect.dispatchEvent(new Event("change"));

  // Clear and rebuild gameButtonsContainer with only selected and change button
  gameButtonsContainer.innerHTML = "";

  gameButtonsContainer.style.display = "grid";
  gameButtonsContainer.style.gridTemplateColumns = "repeat(3, 1fr)";
  gameButtonsContainer.style.gridAutoRows = "min-content";
  gameButtonsContainer.style.gap = "4px 6px";
  gameButtonsContainer.style.marginTop = "8px";
  gameButtonsContainer.style.alignItems = "start";

  // Selected game button green, first grid cell
  const selectedBtn = createGameButton(gameId, button.textContent);
  selectedBtn.classList.remove("blue");
  selectedBtn.classList.add("green");
  gameButtonsContainer.appendChild(selectedBtn);

  // Invisible placeholder button for middle cell
  const placeholderBtn = createGameButton("", "");
  placeholderBtn.style.visibility = "hidden";
  placeholderBtn.style.pointerEvents = "none";
  placeholderBtn.style.margin = "0";
  placeholderBtn.style.padding = "0";
  placeholderBtn.style.height = selectedBtn.offsetHeight ? selectedBtn.offsetHeight + "px" : "36px";
  gameButtonsContainer.appendChild(placeholderBtn);

  // Change Game button in third grid cell
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

    changeGameBtn.addEventListener("click", () => {
      resetGameSelection();
    });
  }
  gameButtonsContainer.appendChild(changeGameBtn);
}

function resetGameSelection() {
  selectedGameId = null;

  if (changeGameBtn) {
    changeGameBtn.remove();
    changeGameBtn = null;
  }

  gameSelect.innerHTML = '<option value="" disabled selected>Choose Game</option>';
  gameSelect.disabled = true;
  gameSelect.style.display = "none";
  gameSelect.dispatchEvent(new Event("change"));

  gameButtonsContainer.innerHTML = "";
  gameButtonsContainer.style.display = "none";
}

export default {};
