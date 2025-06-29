import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');
const leagueSelect = document.getElementById('leagueSelect');
const gameSelect = document.getElementById('gameSelect');

async function loadLeagues(sport) {
  if (!leagueSelect) return;

  leagueSelect.innerHTML = '';
  gameSelect.innerHTML = '<option>Select a league first</option>';
  gameSelect.disabled = true;

  if (!sport) {
    leagueSelect.innerHTML = '<option>Select a sport first</option>';
    leagueSelect.disabled = true;
    return;
  }

  leagueSelect.disabled = true;
  leagueSelect.innerHTML = '<option>Loading leagues...</option>';

  try {
    // Query games filtered by sport to extract leagues
    const gamesQuery = query(collection(db, 'GameCache'), where('Sport', '==', sport));
    const gamesSnapshot = await getDocs(gamesQuery);

    const leaguesSet = new Set();

    gamesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.League) {
        leaguesSet.add(data.League);
      }
    });

    const uniqueLeagues = Array.from(leaguesSet).sort();

    if (uniqueLeagues.length === 0) {
      leagueSelect.innerHTML = '<option>No leagues found</option>';
      leagueSelect.disabled = true;
      return;
    }

    leagueSelect.innerHTML = '';
    uniqueLeagues.forEach(league => {
      const option = document.createElement('option');
      option.value = league;
      option.textContent = league;
      leagueSelect.appendChild(option);
    });

    leagueSelect.disabled = false;
  } catch (error) {
    console.error('Error loading leagues:', error);
    leagueSelect.innerHTML = '<option>Error loading leagues</option>';
    leagueSelect.disabled = true;
  }
}

// Bind event to sportSelect changes to load leagues accordingly
if (sportSelect) {
  sportSelect.addEventListener('change', () => {
    const sport = sportSelect.value;
    loadLeagues(sport);
  });
}

// Export for external calls if needed
export { loadLeagues };
