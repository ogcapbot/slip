// sportSelector.js
import { db } from './firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');

async function populateSportsDropdown() {
  sportSelect.innerHTML = '<option value="">-- Select a Sport --</option>';

  try {
    const gameCacheRef = collection(db, "GameCache");
    const snapshot = await getDocs(gameCacheRef);

    const sportsSet = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.Sport) {
        sportsSet.add(data.Sport);
      }
    });

    const sports = Array.from(sportsSet).sort();

    sports.forEach(sport => {
      const option = document.createElement("option");
      option.value = sport;
      option.textContent = sport;
      sportSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading sports:", err);
    sportSelect.innerHTML = '<option value="">Error loading sports</option>';
  }
}

// Call this when the pick form is shown, e.g., after login
export { populateSportsDropdown };
