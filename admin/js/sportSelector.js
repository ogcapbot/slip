import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadLeagues } from './leagueSelector.js'; // next selector module

const originalSportSelect = document.getElementById('sportSelect');

let sportButtonsContainer;
let hiddenSelect;
let selectedSport = null;

if (originalSportSelect) {
  console.log('[SportSelector] Original sportSelect found, replacing with hidden select and button container.');
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
  console.log('[SportSelector] Original sportSelect NOT found, using existing sportButtonsContainer or creating new.');
  sportButtonsContainer = document.getElementById('sportButtonsContainer');
  if (!sportButtonsContainer) {
    sportButtonsContainer = document.createElement('div');
    sportButtonsContainer.id = 'sportButtonsContainer';
    document.body.appendChild(sportButtonsContainer);
  }
  hiddenSelect = document.getElementById('sportSelect');
  if (!hiddenSelect) {
    hiddenSelect = document.createElement('select');
    hiddenSelect.id = 'sportSelect';
    hiddenSelect.style.display = 'none';
    document.body.appendChild(hiddenSelect);
  }
}

export async function loadSports(container = null) {
  const targetContainer = container || sportButtonsContainer;
  console.log('[SportSelector] loadSports called.');

  targetContainer.innerHTML = '';
  selectedSport = null;
  hiddenSelect.innerHTML = '';
  hiddenSelect.dispatchEvent(new Event('change'));
  console.log('[SportSelector] Cleared existing buttons and hidden select.');

  try {
    const snapshot = await getDocs(collection(db, 'GameCache'));
    console.log('[SportSelector] Retrieved GameCache documents:', snapshot.size);

    const sportsSet = new Set();
    snapshot.forEach(doc => {
      const sport = doc.data().leagueGroup;
      if (sport) {
        sportsSet.add(sport);
        console.log(`[SportSelector] Found sport: ${sport}`);
      }
    });

    const sports = Array.from(sportsSet).sort((a, b) => a.localeCompare(b));
    console.log(`[SportSelector] Sorted sports list: ${sports.join(', ')}`);

    if (sports.length === 0) {
      targetContainer.textContent = 'No sports found';
      console.warn('[SportSelector] No sports found in GameCache.');
      return;
    }

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
        console.log(`[SportSelector] Button clicked for sport: ${sport}`);
        selectSport(sport);
      });

      targetContainer.appendChild(btn);
    });
    console.log('[SportSelector] Buttons created and appended to container.');
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

  // Update summary text dynamically
  const summarySport = document.getElementById('summarySport');
  if (summarySport) {
    summarySport.textContent = `Sport: ${sport}`;
  }

  // Hide the sport buttons container
  const sportContainer = document.getElementById('sportSelectorContainer');
  if (sportContainer) sportContainer.style.display = 'none';

  // Show the league selector container
  const leagueContainer = document.getElementById('leagueSelectorContainer');
  if (leagueContainer) leagueContainer.style.display = 'block';

  // Update hidden select for form compatibility
  hiddenSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = sport;
  option.selected = true;
  hiddenSelect.appendChild(option);
  hiddenSelect.dispatchEvent(new Event('change'));
  console.log('[SportSelector] Hidden select updated and change event dispatched.');

  // Call next selector passing league container and sport
  console.log('[SportSelector] Calling loadLeagues with sport:', sport);
  loadLeagues(leagueContainer, sport);
}

export function resetSportSelectorState() {
  console.log('[SportSelector] resetSportSelectorState called.');
  selectedSport = null;
  if (sportButtonsContainer) {
    sportButtonsContainer.innerHTML = '';
    sportButtonsContainer.style.display = 'block';
  }
  if (hiddenSelect) {
    hiddenSelect.innerHTML = '';
    hiddenSelect.dispatchEvent(new Event('change'));
  }
}
