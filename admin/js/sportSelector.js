import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadLeagues } from './leagueSelector.js';

const originalSportSelect = document.getElementById('sportSelect');

let sportButtonsContainer;
let hiddenSelect;
let selectedSport = null;

if (originalSportSelect) {
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

  targetContainer.innerHTML = '';
  selectedSport = null;
  hiddenSelect.innerHTML = '';
  hiddenSelect.dispatchEvent(new Event('change'));

  // Show sport buttons container and hide league container
  const sportContainer = document.getElementById('sportSelectorContainer');
  const leagueContainer = document.getElementById('leagueSelectorContainer');
  if (sportContainer) sportContainer.style.display = 'block';
  if (leagueContainer) leagueContainer.style.display = 'none';

  try {
    const snapshot = await getDocs(collection(db, 'GameCache'));

    const sportsSet = new Set();
    snapshot.forEach(doc => {
      const sport = doc.data().leagueGroup;
      if (sport) sportsSet.add(sport);
    });

    const sports = Array.from(sportsSet).sort((a, b) => a.localeCompare(b));

    if (sports.length === 0) {
      targetContainer.textContent = 'No sports found';
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
        selectSport(sport);
      });

      targetContainer.appendChild(btn);
    });
  } catch (error) {
    targetContainer.textContent = 'Error loading sports';
    console.error(error);
  }
}

function selectSport(sport) {
  if (selectedSport === sport) return;
  selectedSport = sport;

  const summarySport = document.getElementById('summarySport');
  if (summarySport) summarySport.textContent = `Sport: ${sport}`;

  // Hide sport container, show league container
  const sportContainer = document.getElementById('sportSelectorContainer');
  const leagueContainer = document.getElementById('leagueSelectorContainer');
  if (sportContainer) sportContainer.style.display = 'none';
  if (leagueContainer) leagueContainer.style.display = 'block';

  hiddenSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = sport;
  option.selected = true;
  hiddenSelect.appendChild(option);
  hiddenSelect.dispatchEvent(new Event('change'));

  loadLeagues(leagueContainer, sport);
}

export function resetSportSelectorState() {
  selectedSport = null;
  if (sportButtonsContainer) {
    sportButtonsContainer.innerHTML = '';
    sportButtonsContainer.style.display = 'block';
  }
  if (hiddenSelect) {
    hiddenSelect.innerHTML = '';
    hiddenSelect.dispatchEvent(new Event('change'));
  }

  // Also show sport container, hide league container on reset
  const sportContainer = document.getElementById('sportSelectorContainer');
  const leagueContainer = document.getElementById('leagueSelectorContainer');
  if (sportContainer) sportContainer.style.display = 'block';
  if (leagueContainer) leagueContainer.style.display = 'none';
}
