import { db } from '../firebaseInit.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

let leagueButtonsContainer;
let selectedLeague = null;

export async function loadLeagues(container = null, selectedSport = null) {
  if (!container) {
    leagueButtonsContainer = document.getElementById('leagueSelectorContainer');
    if (!leagueButtonsContainer) {
      leagueButtonsContainer = document.createElement('div');
      leagueButtonsContainer.id = 'leagueSelectorContainer';
      document.body.appendChild(leagueButtonsContainer);
    }
  } else {
    leagueButtonsContainer = container;
  }

  leagueButtonsContainer.innerHTML = '';
  selectedLeague = null;

  if (!selectedSport) {
    leagueButtonsContainer.textContent = 'No sport selected.';
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
      leagueButtonsContainer.textContent = 'No leagues found';
      return;
    }

    leagueButtonsContainer.style.display = 'grid';
    leagueButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    leagueButtonsContainer.style.gap = '4px 6px';
    leagueButtonsContainer.style.marginTop = '8px';
    leagueButtonsContainer.style.alignItems = 'start';

    leagues.forEach(league => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = league;
      btn.className = 'pick-btn blue';
      btn.style.width = '100%';
      btn.style.minWidth = '0';
      btn.style.boxSizing = 'border-box';

      btn.addEventListener('click', () => {
        selectLeague(league);
      });

      leagueButtonsContainer.appendChild(btn);
    });
  } catch (error) {
    leagueButtonsContainer.textContent = 'Error loading leagues';
    console.error(error);
  }
}

function selectLeague(league) {
  if (selectedLeague === league) return;
  selectedLeague = league;

  const summaryLeague = document.getElementById('summaryLeague');
  if (summaryLeague) summaryLeague.textContent = `League: ${league}`;

  const leagueContainer = document.getElementById('leagueSelectorContainer');
  if (leagueContainer) leagueContainer.style.display = 'none';

  const gameContainer = document.getElementById('gameSelectorContainer');
  if (gameContainer) gameContainer.style.display = 'block';
}
