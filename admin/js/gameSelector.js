// gameSelector.js
import { db } from "../firebaseInit.js"; // adjust path if needed
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById("sportSelect");
const leagueSelect = document.getElementById("leagueSelect");
const gameSelect = document.getElementById("gameSelect");
const pickInput = document.getElementById("pickInput");
const submitBtn = document.querySelector("button[type='submit']");

// Clear and disable downstream selects/input/buttons
function resetSelect(selectElement, defaultOptionText) {
  selectElement.innerHTML = `<option>${defaultOptionText}</option>`;
  selectElement.disabled = true;
}

function disablePickInputAndSubmit() {
  pickInput.disabled = true;
  submitBtn.disabled = true;
}

// Listen for change on leagueSelect to populate games
leagueSelect.addEventListener("change", async () => {
  resetSelect(gameSelect, "Loading games...");
  disablePickInputAndSubmit();

  const selectedSport = sportSelect.value;
  const selectedLeague = leagueSelect.value;

  if (!selectedSport || !selectedLeague) {
    resetSelect(gameSelect, "Select a sport and league first");
    return;
  }

  try {
    // Query games by sport and league
    const q = query(
      collection(db, "GameCache"),
      where("Sport", "==", selectedSport),
      where("League", "==", selectedLeague)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      resetSelect(gameSelect, "No games available");
      return;
    }

    // Populate gameSelect
    gameSelect.innerHTML = "";
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const option = document.createElement("option");
      option.value = doc.id; // or data.id or something unique
      option.textContent = `${data.HomeTeam} vs ${data.AwayTeam} (${data.StartTimeEST.toDateString()})`;
      gameSelect.appendChild(option);
    });

    gameSelect.disabled = false;

  } catch (error) {
    console.error("Error loading games:", error);
    resetSelect(gameSelect, "Error loading games");
  }
});

// Enable pick input and submit only when a game is selected
gameSelect.addEventListener("change", () => {
  if (gameSelect.value) {
    pickInput.disabled = false;
    submitBtn.disabled = false;
  } else {
    disablePickInputAndSubmit();
  }
});

// On sport change, reset league and game selects, disable pick input and submit
sportSelect.addEventListener("change", () => {
  resetSelect(leagueSelect, "Select a sport first");
  resetSelect(gameSelect, "Select a league first");
  disablePickInputAndSubmit();

  if (!sportSelect.value) {
    return;
  }

  // Populate league select based on sport
  (async () => {
    try {
      const q = query(
        collection(db, "GameCache"),
        where("Sport", "==", sportSelect.value)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        resetSelect(leagueSelect, "No leagues found");
        return;
      }

      // Get unique leagues
      const leaguesSet = new Set();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        leaguesSet.add(data.League);
      });

      leagueSelect.innerHTML = "";
      leaguesSet.forEach((league) => {
        const option = document.createElement("option");
        option.value = league;
        option.textContent = league;
        leagueSelect.appendChild(option);
      });

      leagueSelect.disabled = false;
    } catch (error) {
      console.error("Error loading leagues:", error);
      resetSelect(leagueSelect, "Error loading leagues");
    }
  })();
});
