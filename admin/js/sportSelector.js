import { db } from '../firebaseInit.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');
const leagueSelect = document.getElementById('leagueSelect');
const gameSelect = document.getElementById('gameSelect');
const pickOptionsContainer = document.getElementById('pickOptionsContainer');

const sportButtonsContainerId = 'sportButtonsContainer';

// Clear and disable dependent selectors
function resetLeagueAndGame() {
  if (leagueSelect) {
    leagueSelect.innerHTML = '<option>Select a sport first</option>';
    leagueSelect.disabled = true;
  }
  if (gameSelect) {
    gameSelect.innerHTML = '<option>Select a league first</option>';
    gameSelect.disabled = true;
  }
  if (pickOptionsContainer) {
    pickOptionsContainer.innerHTML = '';
  }
}

// Create sport buttons container and insert after sportSelect label
function createSportButtonsContainer() {
  let container = document.getElementById(sportButtonsContainerId);
  if (!container) {
    container = document.createElement('div');
    container.id = sportButtonsContainerId;
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(3, 1fr)';
    container.style.gap = '8px';
    container.style.margin = '8px 0 12px 0';

    const sportLabel = document.querySelector('label[for="sportSelect"]');
    if (sportLabel) {
      sportLabel.parentNode.insertBefore(container, sportLabel.nextSibling);
    } else if (sportSelect) {
      sportSelect.parentNode.insertBefore(container, sportSelect.nextSibling);
    } else {
      document.body.appendChild(container);
    }
  }
  return container;
}

// Load and display sports as buttons and populate sportSelect dropdown
async function loadSports() {
  if (!sportSelect) return;

  sportSelect.innerHTML = '';
  resetLeagueAndGame();

  const container = createSportButtonsContainer();
  container.innerHTML = 'Loading sports...';

  try {
    const gamesSnapshot = await getDocs(collection(db, 'GameCache'));
    const sportsSet = new Set();

    gamesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.Sport) {
        sportsSet.add(data.Sport);
      }
    });

    const uniqueSports = Array.from(sportsSet).sort();
    console.log('[sportSelector] Unique sports:', uniqueSports);

    container.innerHTML = '';

    uniqueSports.forEach(sport => {
      // Create and append sport button
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pick-btn blue';
      btn.textContent = sport;
      btn.style.whiteSpace = 'normal';
      btn.addEventListener('click', () => {
        selectSport(sport);
      });
      container.appendChild(btn);

      // Add option to sportSelect dropdown as well
      const option = document.createElement('option');
      option.value = sport;
      option.textContent = sport;
      sportSelect.appendChild(option);
    });

    sportSelect.disabled = false;
  } catch (error) {
    console.error('[sportSelector] Error loading sports:', error);
    container.textContent = 'Failed to load sports';
    sportSelect.innerHTML = '<option>Failed to load sports</option>';
    sportSelect.disabled = true;
  }
}

// When sport is selected (via button or dropdown)
function selectSport(selectedSport) {
  if (!sportSelect) return;

  // Update sportSelect dropdown
  sportSelect.value = selectedSport;

  // Highlight selected button
  const container = document.getElementById(sportButtonsContainerId);
  if (container) {
    [...container.children].forEach(btn => {
      btn.classList.toggle('green', btn.textContent === selectedSport);
      btn.classList.toggle('blue', btn.textContent !== selectedSport);
    });
  }

  // Reset dependent selectors and options
  resetLeagueAndGame();

  // TODO: Load leagues for selected sport (handled in leagueSelector.js)
  leagueSelect.disabled = false;
  leagueSelect.innerHTML = '<option>Select a league first</option>';
  gameSelect.innerHTML = '<option>Select a league first</option>';
  gameSelect.disabled = true;
}

// Bind event to sportSelect dropdown change to sync with buttons
if (sportSelect) {
  sportSelect.addEventListener('change', (e) => {
    selectSport(e.target.value);
  });
}

// Export loadSports to be called on login success
export { loadSports };
