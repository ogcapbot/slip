import { db } from '../firebaseInit.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

let leagueButtonsContainer;
let leagueSelect;
let selectedLeague = null;

export async function loadLeagues(container = null, selectedSport = null) {
  if (!container) {
    leagueButtonsContainer = document.getElementById('leagueButtonsContainer');
    if (!leagueButtonsContainer) {
      leagueButtonsContainer = document.createElement('div');
      leagueButtonsContainer.id = 'leagueButtonsContainer';
      document.body.appendChild(leagueButtonsContainer);
      console.log('[LeagueSelector] leagueButtonsContainer not found, creating new container.');
    }
  } else {
    leagueButtonsContainer = container;
  }

  console.log('[LeagueSelector] loadLeagues called with selectedSport:', selectedSport);

  leagueButtonsContainer.innerHTML = '';
  selectedLeague = null;

  if (!selectedSport) {
    leagueButtonsContainer.textContent = 'No sport selected.';
    console.warn('[LeagueSelector] No sport selected to load leagues.');
    return;
  }

  try {
    // Filter by sport (leagueGroup) but retrieve leagues from sportName
    const q = query(collection(db, 'GameCache'), where('leagueGroup', '==', selectedSport));
    const snapshot = await getDocs(q);
    console.log(`[LeagueSelector] Retrieved league documents count: ${snapshot.size}`);

    const leaguesSet = new Set();
    snapshot.forEach(doc => {
      const league = doc.data().sportName; // Corrected: leagues are in sportName field
      if (league) {
        leaguesSet.add(league);
        console.log(`[LeagueSelector] Found league: ${league}`);
      } else {
        console.warn('[LeagueSelector] No sportName field (league) in document:', doc.id);
      }
    });

    const leagues = Array.from(leaguesSet).sort((a, b) => a.localeCompare(b));
    console.log(`[LeagueSelector] Sorted leagues: ${leagues}`);

    if (leagues.length === 0) {
      leagueButtonsContainer.textContent = 'No leagues found';
      console.warn('[LeagueSelector] No leagues found for selected sport.');
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
      console.log(`[LeagueSelector] Creating button for league: ${league}`);
    });

    console.log('[LeagueSelector] All league buttons created and appended.');
  } catch (error) {
    console.error('[LeagueSelector] Error loading leagues:', error);
    leagueButtonsContainer.textContent = 'Error loading leagues';
  }
}

function selectLeague(league) {
  if (selectedLeague === league) {
    console.log('[LeagueSelector] Selected league is the same as current; ignoring.');
    return;
  }

  selectedLeague = league;

  // Update summary text dynamically
  const summaryLeague = document.getElementById('summaryLeague');
  if (summaryLeague) {
    summaryLeague.textContent = `League: ${league}`;
  }

  // Hide league selector container and show next step container here (not implemented yet)
  const leagueContainer = document.getElementById('leagueSelectorContainer');
  if (leagueContainer) leagueContainer.style.display = 'none';

  // TODO: Show next container (e.g. gameSelectorContainer) here

  console.log('[LeagueSelector] League selected:', league);
}
