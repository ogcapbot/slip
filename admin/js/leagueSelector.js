import { db } from "../firebaseInit.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById("sportSelect");
const leagueSelect = document.getElementById("leagueSelect");

sportSelect.addEventListener("change", async () => {
  const selectedSport = sportSelect.value;
  leagueSelect.disabled = true;
  leagueSelect.innerHTML = '<option>Loading leagues...</option>';

  try {
    const q = query(collection(db, "GameCache"), where("Sport", "==", selectedSport));
    const querySnapshot = await getDocs(q);

    const leaguesSet = new Set();
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.League) {
        leaguesSet.add(data.League);
      }
    });

    if (leaguesSet.size === 0) {
      leagueSelect.innerHTML = '<option>No leagues found</option>';
    } else {
      leagueSelect.innerHTML = '<option value="" disabled selected>Choose League</option>';
      leaguesSet.forEach(league => {
        const option = document.createElement("option");
        option.value = league;
        option.textContent = league;
        leagueSelect.appendChild(option);
      });
      leagueSelect.disabled = false;
    }
  } catch (error) {
    leagueSelect.innerHTML = '<option>Error loading leagues</option>';
    console.error("Error loading leagues:", error);
  }

  // Reset gameSelect as league changed
  const gameSelect = document.getElementById("gameSelect");
  gameSelect.innerHTML = '<option>Select a league first</option>';
  gameSelect.disabled = true;
});
