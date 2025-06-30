import { db } from "../firebaseInit.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const leagueSelect = document.getElementById("leagueSelect");
const gameSelect = document.getElementById("gameSelect");

// Hide the original gameSelect dropdown but keep it for compatibility
if (gameSelect) {
  gameSelect.style.display = "none";
}

let gameButtonsContainer = document.getElementById("gameButtonsContainer");
if (!gameButtonsContainer) {
  gameButtonsContainer = document.createElement("div");
  gameButtonsContainer.id = "gameButtonsContainer";

  // Insert container after label for gameSelect
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

leagueSelect.addEventListener("change", async () => {
  const selectedLeague = leagueSelect.value;
  gameButtonsContainer.innerHTML = "";
  selectedGameId = null;
  if (changeGameBtn) {
    changeGameBtn.remove();
    changeGameBtn = null;
  }

  if (!selectedLeague) {
    gameSelect.innerHTML = '<option>Select a league first</option>';
    gameSelect.disabled = true;
    return;
  }

  gameSelect.disabled = true;
  gameSelect.innerHTML = "";

  gameButtonsContainer.textContent = "Loading games...";

  try {
    // Updated to use sportName field for league filter
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

    // Sort games by commenceTimeUTC ascending (string ISO date)
    games.sort((a, b) => {
      const aTime = a.data.commenceTimeUTC ? new Date(a.data.commenceTimeUTC).getTime() : 0;
      const bTime = b.data.commenceTimeUTC ? new Date(b.data.commenceTimeUTC).getTime() : 0;
      return aTime - bTime;
    });

    // Style container as grid 1-column, tight rows, no gap needed here
    gameButtonsContainer.style.display = "grid";
    gameButtonsContainer.style.gridTemplateColumns = "1fr";
    gameButtonsContainer.style.gridAutoRows = "min-content";
    gameButtonsContainer.style.marginTop = "8px";

    games.forEach(({ id, data }) => {
      gameButtonsContainer.appendChild(createGameButton(id, data));
    });

  } catch (error) {
    gameButtonsContainer.textContent = "Error loading games";
    console.error("Error loading games:", error);
  }
});

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

  // Display HomeTeam vs AwayTeam and start time formatted
  const startTime = gameData.commenceTimeUTC ? new Date(gameData.commenceTimeUTC) : null;
  const timeString = startTime ? startTime.toLocaleString() : "Unknown time";

  btn.textContent = `${gameData.homeTeam || "Home"} vs ${gameData.awayTeam || "Away"} — ${timeString}`;

  btn.addEventListener("click", () => selectGame(btn, id));

  return btn;
}

function selectGame(button, gameId) {
  if (selectedGameId === gameId) return;

  selectedGameId = gameId;

  gameButtonsContainer.innerHTML = "";

  gameButtonsContainer.style.display = "grid";
  gameButtonsContainer.style.gridTemplateColumns = "1fr";
  gameButtonsContainer.style.gridAutoRows = "min-content";
  gameButtonsContainer.style.marginTop = "8px";

  // Extract Home and Away from button text for the selected button
  const [home, rest] = button.textContent.split(" vs ");
  const away = rest ? rest.split(" — ")[0] : "Away";

  const selectedBtn = createGameButton(gameId, {
    homeTeam: home,
    awayTeam: away,
    commenceTimeUTC: null
  });
  selectedBtn.classList.remove("blue");
  selectedBtn.classList.add("green");
  gameButtonsContainer.appendChild(selectedBtn);

  // Invisible placeholder for spacing
  const placeholderBtn = createGameButton("", {});
  placeholderBtn.style.visibility = "hidden";
  placeholderBtn.style.pointerEvents = "none";
  placeholderBtn.style.margin = "0";
  placeholderBtn.style.padding = "0";
  placeholderBtn.style.height = selectedBtn.offsetHeight ? selectedBtn.offsetHeight + "px" : "36px";
  gameButtonsContainer.appendChild(placeholderBtn);

  // Change Game button in third cell
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

  // Update hidden select for compatibility
  gameSelect.innerHTML = "";
  const option = document.createElement("option");
  option.value = gameId;
  option.selected = true;
  gameSelect.appendChild(option);
  gameSelect.disabled = false;
  gameSelect.dispatchEvent(new Event("change"));
}

function resetGameSelection() {
  selectedGameId = null;

  if (changeGameBtn) {
    changeGameBtn.remove();
    changeGameBtn = null;
  }

  gameSelect.innerHTML = '<option value="" disabled selected>Select a game</option>';
  gameSelect.disabled = true;
  gameSelect.dispatchEvent(new Event("change"));

  gameButtonsContainer.innerHTML = "";
}

export default {};
