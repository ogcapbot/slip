import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadLeagues } from './leagueSelector.js';

let sportButtonsContainer = document.getElementById('sportButtonsContainer');
let leagueButtonsContainer = document.getElementById('leagueButtonsContainer');
let hiddenSelect = document.getElementById('sportSelect');
let selectedSport = null;

if (!sportButtonsContainer) {
  sportButtonsContainer = document.createElement('div');
  sportButtonsContainer.id = 'sportButtonsContainer';
  sportButtonsContainer.style.display = 'grid';
  sportButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  sportButtonsContainer.style.gap = '4px 6px';
  sportButtonsContainer.style.marginTop = '8px';
  sportButtonsContainer.style.alignItems = 'start';
  document.body.appendChild(sportButtonsContainer);
}

if (!leagueButtonsContainer) {
  leagueButtonsContainer = document.createElement('div');
  leagueButtonsContainer.id = 'leagueButtonsContainer';
  leagueButtonsContainer.style.display = 'none';
  leagueButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  leagueButtonsContainer.style.gap = '4px 6px';
  leagueButtonsContainer.style.marginTop = '8px';
  leagueButtonsContainer.style.alignItems = 'start';
  document.body.appendChild(leagueButtonsContainer);
}

if (!hiddenSelect) {
  hiddenSelect = document.createElement('select');
  hiddenSelect.id = 'sportSelect';
  hiddenSelect.style.display = 'none';
  document.body.appendChild(hiddenSelect);
}

export async function loadSports() {
  sportButtonsContainer.innerHTML = '';
  leagueButtonsContainer.style.display = 'none';
  sportButtonsContainer.style.display = 'grid';
  selectedSport = null;
  hiddenSelect.innerHTML = '';

  try {
    const snapshot = await getDocs(collection(db, 'GameCache'));
    const sportsSet = new Set();
    snapshot.forEach(doc => {
      const sport = doc.data().leagueGroup;
      if (sport) sportsSet.add(sport);
    });

    const sports = Array.from(sportsSet).sort((a, b) => a.localeCompare(b));
    if (sports.length === 0) {
      sportButtonsContainer.textContent = 'No sports found';
      return;
    }

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

      sportButtonsContainer.appendChild(btn);
    });
  } catch (error) {
    sportButtonsContainer.textContent = 'Error loading sports';
    console.error(error);
  }
}

function selectSport(sport) {
  if (selectedSport === sport) return;
  selectedSport = sport;

  // Update summary text
  const summarySport = document.getElementById('summarySport');
  if (summarySport) summarySport.textContent = `Sport: ${sport}`;

  // Update hidden select
  hiddenSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = sport;
  option.selected = true;
  hiddenSelect.appendChild(option);
  hiddenSelect.dispatchEvent(new Event('change'));

  // Hide sport buttons, show league buttons container
  sportButtonsContainer.style.display = 'none';
  leagueButtonsContainer.style.display = 'grid';

  // Load leagues for selected sport inside leagueButtonsContainer
  loadLeagues(leagueButtonsContainer, sport);
}

export function resetSportSelectorState() {
  selectedSport = null;
  if (sportButtonsContainer) {
    sportButtonsContainer.innerHTML = '';
    sportButtonsContainer.style.display = 'grid';
  }
  if (leagueButtonsContainer) {
    leagueButtonsContainer.innerHTML = '';
    leagueButtonsContainer.style.display = 'none';
  }
  if (hiddenSelect) {
    hiddenSelect.innerHTML = '';
    hiddenSelect.dispatchEvent(new Event('change'));
  }
}
