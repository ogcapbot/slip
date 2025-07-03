import { db } from '../firebaseInit.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

let selectedLeague = null;

export async function loadLeagues(container, selectedSport) {
  if (!container) {
    console.error('[LeagueSelector] No container passed to loadLeagues');
    return;
  }

  container.innerHTML = '';
  selectedLeague = null;

  if (!selectedSport) {
    container.textContent = 'No sport selected.';
    return;
  }

  try {
    const q = query(collection(db, 'GameCache'), where('leagueGroup', '==', selectedSport));
    const snapshot = await getDocs(q);

    const leaguesSet = new Set();
    snapshot.forEach(doc => {
      const league = doc.data().sportName;
      if (league) leaguesSet.add(league);
    });

    const leagues = Array.from(leaguesSet).sort((a, b) => a.localeCompare(b));
    if (leagues.length === 0) {
      container.textContent = 'No leagues found';
      return;
    }

    leagues.forEach(league => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = league;
      btn.className = 'pick-btn blue';
      btn.style.width = '100%';
      btn.style.minWidth = '0';
      btn.style.boxSizing = 'border-box';

      btn.addEventListener('click', () => {
        selectLeague(league, container);
      });

      container.appendChild(btn);
    });
  } catch (error) {
    container.textContent = 'Error loading leagues';
    console.error(error);
  }
}

function selectLeague(league, container) {
  if (selectedLeague === league) return;
  selectedLeague = league;

  const summaryLeague = document.getElementById('summaryLeague');
  if (summaryLeague) summaryLeague.textContent = `League: ${league}`;

  // Hide league buttons after selection
  container.style.display = 'none';
  container.innerHTML = '';

  // TODO: trigger next step, e.g. loadGames()
  console.log('[LeagueSelector] League selected:', league);
}
