// leagueSelector.js
// Loads league buttons based on selected sport,
// manages league selection state,
// updates the summary,
// and triggers the next step (game selection).

import { db } from '../firebaseInit.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

let leagueButtonsContainer;
let selectedLeague = null;

/**
 * Loads leagues filtered by selected sport.
 * Displays league buttons, updates summary on selection,
 * hides this container after selection,
 * and calls next step loader (e.g., loadGames).
 * @param {HTMLElement|null} container - Optional container override.
 * @param {string|null} selectedSport - Currently selected sport.
 */
export async function loadLeagues(container = null, selectedSport = null) {
  // Determine container to use or create new one if missing
  if (!container) {
    leagueButtonsContainer = document.getElementById('leagueButtonsContainer');
    if (!leagueButtonsContainer) {
      leagueButtonsContainer = document.createElement('div');
      leagueButtonsContainer.id = 'leagueButtonsContainer';
      document.body.appendChild(leagueButtonsContainer);
      console.log('[leagueSelector.js:20] leagueButtonsContainer not found, created new container.');
    }
  } else {
    leagueButtonsContainer = container;
  }

  console.log('[leagueSelector.js:27] loadLeagues called with selectedSport:', selectedSport);

  // Clear container and reset selected league state
  leagueButtonsContainer.innerHTML = '';
  leagueButtonsContainer.style.display = 'grid';
  leagueButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  leagueButtonsContainer.style.gap = '4px 6px';
  leagueButtonsContainer.style.marginTop = '8px';
  leagueButtonsContainer.style.alignItems = 'start';

  selectedLeague = null;

  if (!selectedSport) {
    leagueButtonsContainer.textContent = 'No sport selected.';
    console.warn('[leagueSelector.js:39] No sport selected to load leagues.');
    return;
  }

  try {
    // Query database where leagueGroup (sport) matches selectedSport
    const q = query(collection(db, 'GameCache'), where('leagueGroup', '==', selectedSport));
    const snapshot = await getDocs(q);
    console.log(`[leagueSelector.js:46] Retrieved league documents count: ${snapshot.size}`);

    // Collect unique leagues from docs
    const leaguesSet = new Set();
    snapshot.forEach(doc => {
      // NOTE: sportName is league in your DB mapping
      const league = doc.data().sportName;
      if (league) {
        leaguesSet.add(league);
        console.log(`[leagueSelector.js:52] Found league: ${league}`);
      }
    });

    const leagues = Array.from(leaguesSet).sort((a, b) => a.localeCompare(b));
    console.log(`[leagueSelector.js:56] Sorted leagues: ${leagues.join(', ')}`);

    if (leagues.length === 0) {
      leagueButtonsContainer.textContent = 'No leagues found';
      console.warn('[leagueSelector.js:60] No leagues found for selected sport.');
      return;
    }

    // Create buttons for each league
    leagues.forEach(league => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = league;
      btn.className = 'pick-btn blue';
      btn.style.width = '100%';
      btn.style.minWidth = '0';
      btn.style.boxSizing = 'border-box';

      btn.addEventListener('click', () => {
        console.log(`[leagueSelector.js:72] League button clicked: ${league}`);
        selectLeague(league);
      });

      leagueButtonsContainer.appendChild(btn);
      console.log(`[leagueSelector.js:76] Created button for league: ${league}`);
    });

    console.log('[leagueSelector.js:79] All league buttons created and appended.');
  } catch (error) {
    console.error('[leagueSelector.js:82] Error loading leagues:', error);
    leagueButtonsContainer.textContent = 'Error loading leagues';
  }
}

/**
 * Handles league selection:
 * - Updates selected league state.
 * - Updates summary dynamically.
 * - Hides league buttons container after selection.
 * - Calls next selector (e.g. loadGames) to continue the process.
 * @param {string} league - The selected league name.
 */
function selectLeague(league) {
  if (selectedLeague === league) {
    console.log('[leagueSelector.js:95] Selected league is the same as current; ignoring.');
    return;
  }

  selectedLeague = league;

  // Update summary dynamically
  const summaryLeague = document.getElementById('summaryLeague');
  if (summaryLeague) {
    summaryLeague.textContent = `League: ${league}`;
    console.log(`[leagueSelector.js:103] Updated summaryLeague text to: ${league}`);
  } else {
    console.warn('[leagueSelector.js:106] summaryLeague element not found.');
  }

  // Hide league buttons container after selection
  if (leagueButtonsContainer) {
    leagueButtonsContainer.style.display = 'none';
    console.log('[leagueSelector.js:111] leagueButtonsContainer hidden after selection.');
  } else {
    console.warn('[leagueSelector.js:113] leagueButtonsContainer not found to hide.');
  }

  // TODO: Show next container here (e.g. gameSelectorContainer)
  // For now, just log
  console.log('[leagueSelector.js:117] League selected:', league);

  // Ideally, trigger next load (e.g., loadGames) here, passing league as param
  // You can export and call that function from games.js
}

export { selectLeague }; // Export if needed externally
