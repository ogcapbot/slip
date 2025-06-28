// gameSelector.js
import { db } from './firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');
const gameSelect = document.getElementById('gameSelect');

async function populateGamesDropdown(sport) {
  gameSelect.innerHTML = '<option value="">Loading games...</option>';

  if (!sport) {
    gameSelect.innerHTML = '<option value="">Select a sport first</option>';
    return;
  }

  try {
    const gameCacheRef = collection(db, "GameCache");
    const q = query(gameCacheRef, where("Sport", "==", sport));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      gameSelect.innerHTML = '<option value="">No games found</option>';
      return;
    }

    gameSelect.innerHTML = '<option value="">-- Select a Game --</option>';

    snapshot.forEach(doc => {
      const data = doc.data();
      // Use a display string for the game, e.g., "HomeTeam vs AwayTeam @ StartTime"
      const gameLabel = `${data.HomeTeam} vs ${data.AwayTeam} @ ${data.StartTimeEST || ''}`;
      const option = document.createElement('option');
      option.value = doc.id; // store doc id as value
      option.textContent = gameLabel;
      gameSelect.appendChild(option);
    });

  } catch (err) {
    console.error("Error loading games:", err);
    gameSelect.innerHTML = '<option value="">Error loading games</option>';
  }
}

// Add event listener to sportSelect to update games when sport changes
sportSelect.addEventListener('change', () => {
  populateGamesDropdown(sportSelect.value);
});

export { populateGamesDropdown };
