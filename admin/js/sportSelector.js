// sportSelector.js
// Handles loading and displaying sports selection buttons,
// manages sport selection state, updates the summary,
// and triggers loading the next step (league selection).

import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadLeagues } from './leagueSelector.js'; // Next selector module

// DOM elements and state variables
let sportButtonsContainer;
let hiddenSelect;
let selectedSport = null;

/**
 * Initialize sport selector containers and hidden select dropdown.
 * If original select exists, replace with hidden select and button container.
 * Else, create containers as needed.
 */
const originalSportSelect = document.getElementById('sportSelect');

if (originalSportSelect) {
  console.log('[sportSelector.js:22] Original sportSelect found, replacing with hidden select and button container.');
  const parent = originalSportSelect.parentNode;
  parent.removeChild(originalSportSelect);

  hiddenSelect = document.createElement('select');
  hiddenSelect.id = 'sportSelect';
  hiddenSelect.style.display = 'none';
  parent.appendChild(hiddenSelect);

  sportButtonsContainer = document.createElement('div');
  sportButtonsContainer.id = 'sportButtonsContainer';

  const sportLabel = parent.querySelector('label[for="sportSelect"]');
  if (sportLabel) {
    sportLabel.parentNode.insertBefore(sportButtonsContainer, sportLabel.nextSibling);
  } else {
    parent.appendChild(sportButtonsContainer);
  }
} else {
  console.log('[sportSelector.js:39] Original sportSelect NOT found, using existing sportButtonsContainer or creating new.');
  sportButtonsContainer = document.getElementById('sportButtonsContainer');
  if (!sportButtonsContainer) {
    sportButtonsContainer = document.createElement('div');
    sportButtonsContainer.id = 'sportButtonsContainer';
    document.body.appendChild(sportButtonsContainer);
    console.log('[sportSelector.js:46] Created new sportButtonsContainer in body.');
  }
  hiddenSelect = document.getElementById('sportSelect');
  if (!hiddenSelect) {
    hiddenSelect = document.createElement('select');
    hiddenSelect.id = 'sportSelect';
    hiddenSelect.style.display = 'none';
    document.body.appendChild(hiddenSelect);
    console.log('[sportSelector.js:53] Created new hidden sportSelect in body.');
  }
}

/**
 * Loads all distinct sports from the database and
 * displays them as clickable buttons inside the container.
 * @param {HTMLElement|null} container - Optional container to override default.
 */
export async function loadSports(container = null) {
  const targetContainer = container || sportButtonsContainer;
  console.log('[sportSelector.js:63] loadSports called.');

  targetContainer.innerHTML = '';
  selectedSport = null;
  hiddenSelect.innerHTML = '';
  hiddenSelect.dispatchEvent(new Event('change'));
  console.log('[sportSelector.js:69] Cleared existing buttons and hidden select.');

  try {
    const snapshot = await getDocs(collection(db, 'GameCache'));
    console.log('[sportSelector.js:73] Retrieved GameCache documents:', snapshot.size);

    const sportsSet = new Set();
    snapshot.forEach(doc => {
      // NOTE: leagueGroup = Sport in your DB mapping
      const sport = doc.data().leagueGroup;
      if (sport) {
        sportsSet.add(sport);
        console.log(`[sportSelector.js:79] Found sport: ${sport}`);
      }
    });

    const sports = Array.from(sportsSet).sort((a, b) => a.localeCompare(b));
    console.log(`[sportSelector.js:83] Sorted sports list: ${sports.join(', ')}`);

    if (sports.length === 0) {
      targetContainer.textContent = 'No sports found';
      console.warn('[sportSelector.js:87] No sports found in GameCache.');
      return;
    }

    // Style container as grid for button layout
    targetContainer.style.display = 'grid';
    targetContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    targetContainer.style.gap = '4px 6px';
    targetContainer.style.marginTop = '8px';
    targetContainer.style.alignItems = 'start';

    sports.forEach(sport => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = sport;
      btn.className = 'pick-btn blue';
      btn.style.width = '100%';
      btn.style.minWidth = '0';
      btn.style.boxSizing = 'border-box';

      btn.addEventListener('click', () => {
        console.log(`[sportSelector.js:101] Button clicked for sport: ${sport}`);
        selectSport(sport);
      });

      targetContainer.appendChild(btn);
    });
    console.log('[sportSelector.js:107] Buttons created and appended to container.');
  } catch (error) {
    console.error('[sportSelector.js:110] Error loading sports:', error);
    targetContainer.textContent = 'Error loading sports';
  }
}

/**
 * Handles sport button click selection:
 * - Updates selected sport state.
 * - Updates hidden select for form compatibility.
 * - Clears buttons and shows selected sport summary.
 * - Calls next selector: loadLeagues.
 * @param {string} sport - The sport name selected.
 */
function selectSport(sport) {
  console.log(`[sportSelector.js:125] selectSport fired for: ${sport}`);

  if (selectedSport === sport) {
    console.log('[sportSelector.js:128] Selected sport is the same as current; ignoring.');
    return;
  }

  selectedSport = sport;

  // Clear the sport buttons container and hide it
  sportButtonsContainer.innerHTML = '';
  sportButtonsContainer.style.display = 'none'; // Hide buttons after selection

  // Show/update summary line in a dedicated summary container
  let summaryContainer = document.getElementById('pickSummaryContainer');
  if (!summaryContainer) {
    summaryContainer = document.createElement('div');
    summaryContainer.id = 'pickSummaryContainer';
    if (sportButtonsContainer.parentNode) {
      sportButtonsContainer.parentNode.insertBefore(summaryContainer, sportButtonsContainer.nextSibling);
    } else {
      document.body.appendChild(summaryContainer);
    }
  }

  summaryContainer.innerHTML = `
    <h3>Official Pick Summary</h3>
    <div id="summarySport" style="font-weight: 700; font-size: 11px; font-family: Oswald, sans-serif; margin-bottom: 6px;">
      Sport: ${sport}
    </div>
    <div id="summaryLeague">League: Not Selected</div>
    <div id="summaryGame">Game: Not Selected</div>
    <div id="summaryTeam">Team: Not Selected</div>
    <div id="summaryWager">Wager: Not Selected</div>
    <div id="summaryUnit">Unit: Not Selected</div>
    <div id="summaryPickDesc">Pick Desc: N/A</div>
    <div id="summaryNotes">Notes: Not Entered</div>
    <div id="summaryPhrase">Phrase: Not Selected</div>
    <hr>
  `;

  // Update hidden select for form compatibility
  hiddenSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = sport;
  option.selected = true;
  hiddenSelect.appendChild(option);
  hiddenSelect.dispatchEvent(new Event('change'));
  console.log('[sportSelector.js:159] Hidden select updated and change event dispatched.');

  // Call next selector: load leagues for this sport
  console.log('[sportSelector.js:162] Calling loadLeagues with sport:', sport);
  loadLeagues(null, sport);
}

/**
 * Resets the sport selector state to initial state.
 * Clears all sport buttons and hidden select options.
 */
export function resetSportSelectorState() {
  console.log('[sportSelector.js:172] resetSportSelectorState called.');
  selectedSport = null;
  if (sportButtonsContainer) {
    sportButtonsContainer.innerHTML = '';
    sportButtonsContainer.style.display = 'grid';
  }
  if (hiddenSelect) {
    hiddenSelect.innerHTML = '';
    hiddenSelect.dispatchEvent(new Event('change'));
  }
}
