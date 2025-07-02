import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadLeagues } from './leagueSelector.js'; // next selector module

const originalSportSelect = document.getElementById('sportSelect');

let sportButtonsContainer;
let hiddenSelect;
let selectedSport = null;

// Create or get sportButtonsContainer and hiddenSelect same as before...

// Add this new container for summary display (create once)
let officialPickSummaryContainer = document.getElementById('officialPickSummaryContainer');
if (!officialPickSummaryContainer) {
  officialPickSummaryContainer = document.createElement('div');
  officialPickSummaryContainer.id = 'officialPickSummaryContainer';
  officialPickSummaryContainer.style.marginTop = '12px';
  officialPickSummaryContainer.style.fontWeight = '700';
  officialPickSummaryContainer.style.fontSize = '11px';
  officialPickSummaryContainer.style.fontFamily = 'Oswald, sans-serif';
  if (sportButtonsContainer && sportButtonsContainer.parentNode) {
    sportButtonsContainer.parentNode.insertBefore(officialPickSummaryContainer, sportButtonsContainer.nextSibling);
  } else {
    document.body.appendChild(officialPickSummaryContainer);
  }
}

export async function loadSports(container = null) {
  const targetContainer = container || sportButtonsContainer;
  console.log('[SportSelector] loadSports called.');

  targetContainer.innerHTML = '';
  selectedSport = null;
  hiddenSelect.innerHTML = '';
  hiddenSelect.dispatchEvent(new Event('change'));

  // Clear summary on fresh load
  officialPickSummaryContainer.textContent = 'Sport: Not Selected';

  try {
    const snapshot = await getDocs(collection(db, 'GameCache'));
    // ...rest same as before to create buttons

    sports.forEach(sport => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = sport;
      btn.className = 'pick-btn blue';
      btn.style.width = '100%';
      btn.style.minWidth = '0';
      btn.style.boxSizing = 'border-box';

      btn.addEventListener('click', () => {
        console.log(`[SportSelector] Button clicked for sport: ${sport}`);
        selectSport(sport);
      });

      targetContainer.appendChild(btn);
    });
  } catch (error) {
    console.error('[SportSelector] Error loading sports:', error);
    targetContainer.textContent = 'Error loading sports';
  }
}

function selectSport(sport) {
  console.log(`[SportSelector] selectSport fired for: ${sport}`);

  if (selectedSport === sport) {
    console.log('[SportSelector] Selected sport is the same as current; ignoring.');
    return;
  }

  selectedSport = sport;

  // Hide all sport buttons after selecting
  sportButtonsContainer.style.display = 'none';

  // Update summary container
  officialPickSummaryContainer.textContent = `Sport: ${sport}`;

  // Update hidden select for form compatibility
  hiddenSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = sport;
  option.selected = true;
  hiddenSelect.appendChild(option);
  hiddenSelect.dispatchEvent(new Event('change'));
  console.log('[SportSelector] Hidden select updated and change event dispatched.');

  // Call next selector passing default params
  console.log('[SportSelector] Calling loadLeagues with sport:', sport);
  loadLeagues(null, sport);
}

export function resetSportSelectorState() {
  console.log('[SportSelector] resetSportSelectorState called.');
  selectedSport = null;
  if (sportButtonsContainer) {
    sportButtonsContainer.innerHTML = '';
    sportButtonsContainer.style.display = 'grid'; // Show again when resetting
  }
  if (hiddenSelect) {
    hiddenSelect.innerHTML = '';
    hiddenSelect.dispatchEvent(new Event('change'));
  }
  if (officialPickSummaryContainer) {
    officialPickSummaryContainer.textContent = 'Sport: Not Selected';
  }
}
