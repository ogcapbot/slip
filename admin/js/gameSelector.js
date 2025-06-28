import { db } from "../firebaseInit.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById("sportSelect");
const leagueSelect = document.getElementById("leagueSelect");
const gameSelect = document.getElementById("gameSelect");

leagueSelect.addEventListener("change", async () => {
  const selectedSport = sportSelect.value;
  const selectedLeague = leagueSelect.value;

  gameSelect.disabled = true;
  gameSelect.innerHTML = '<option>Loading games...</option>';

  if (!selectedSport || !selectedLeague) {
    gameSelect.innerHTML = '<option>Select a league first</option>';
    return;
  }

  try {
    const q = query(
      collection(db, "GameCache"),
      where("Sport", "==", selectedSport),
      where("League", "==", selectedLeague)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      gameSelect.innerHTML = '<option>No games found</option>';
      return;
    }

    gameSelect.innerHTML = '<option value="" disabled selected>Choose Game</option>';

    querySnapshot.forEach(doc => {
      const data = doc.data();

      // Customize this to display game name or identifier
      const gameName = data.GameName || data.Game || doc.id;

      const option = document.createElement("option");
      option.value = doc.id; // or data.Game if that’s unique and stable
      option.textContent = gameName;
      gameSelect.appendChild(option);
    });

    gameSelect.disabled = false;
  } catch (error) {
    gameSelect.innerHTML = '<option>Error loading games</option>';
    console.error("Error loading games:", error);
  }
});
