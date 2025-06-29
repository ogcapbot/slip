import { db } from "../firebaseInit.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const sportSelect = document.getElementById("sportSelect");
  const leagueSelect = document.getElementById("leagueSelect");
  const gameSelect = document.getElementById("gameSelect");

  if (!leagueSelect) {
    console.error("leagueSelect element not found!");
    return;
  }

  // Hide original leagueSelect for compatibility but keep it in the DOM
  leagueSelect.style.display = "none";

  async function loadLeagues(selectedSport) {
    if (!selectedSport) {
      leagueSelect.innerHTML = '<option value="">Select a sport first</option>';
      leagueSelect.disabled = true;
      gameSelect.innerHTML = '<option value="">Select a league first</option>';
      gameSelect.disabled = true;
      return;
    }

    leagueSelect.innerHTML = '<option>Loading leagues...</option>';
    leagueSelect.disabled = true;
    gameSelect.innerHTML = '<option>Select a league first</option>';
    gameSelect.disabled = true;

    try {
      const leaguesRef = collection(db, "Leagues");
      const q = query(leaguesRef, where("Sport", "==", selectedSport));
      const querySnapshot = await getDocs(q);

      const leagues = [];
      querySnapshot.forEach(doc => {
        leagues.push({ id: doc.id, ...doc.data() });
      });

      if (leagues.length === 0) {
        leagueSelect.innerHTML = '<option value="">No leagues found</option>';
        leagueSelect.disabled = true;
        return;
      }

      leagueSelect.innerHTML = '<option value="" disabled selected>Select a league</option>';
      leagues.forEach(league => {
        const option = document.createElement("option");
        option.value = league.id;
        option.textContent = league.LeagueName || league.id;
        leagueSelect.appendChild(option);
      });
      leagueSelect.disabled = false;

    } catch (error) {
      console.error("Error loading leagues:", error);
      leagueSelect.innerHTML = '<option value="">Error loading leagues</option>';
      leagueSelect.disabled = true;
    }
  }

  sportSelect?.addEventListener("change", (e) => {
    loadLeagues(e.target.value);
  });

  // Optional: on page load if sportSelect has a value
  if (sportSelect?.value) {
    loadLeagues(sportSelect.value);
  }
});
