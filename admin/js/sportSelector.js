// admin/js/sportSelector.js
import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const originalSportSelect = document.getElementById('sportSelect');

// Minimal addition: get league section container to show/hide
const leagueSection = document.getElementById('leagueSelect')?.parentNode || null;

let sportButtonsContainer;
let hiddenSelect;
let selectedSport = null;
let changeSportBtn = null;

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

export async function loadSports() {
  sportButtonsContainer.innerHTML = '';
  selectedSport = null;
  if (changeSportBtn) {
    changeSportBtn.remove();
    changeSportBtn = null;
  }
  hiddenSelect.innerHTML = '';
  hiddenSelect.dispatchEvent(new Event('change'));

  // Minimal addition: hide league section initially
  if (leagueSection) {
    leagueSection.style.display = 'none';
  }

  try {
    const snapshot = await getDocs(collection(db, 'GameCache'));
    const sportsSet = new Set();

    snapshot.forEach(doc => {
      const sport = doc.data().Sport;
      if (sport) sportsSet.add(sport);
    });

    const sports = Array.from(sportsSet).sort((a, b) => a.localeCompare(b));

    if (sports.length === 0) {
      sportButtonsContainer.textContent = 'No sports found';
      return;
    }

    // Style as grid for 3 columns with tight gaps and top alignment
    sportButtonsContainer.style.display = 'grid';
    sportButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    sportButtonsContainer.style.gridAutoRows = 'min-content';
    sportButtonsContainer.style.gap = '4px 6px'; // 4px vertical, 6px horizontal gap
    sportButtonsContainer.style.marginTop = '8px';
    sportButtonsContainer.style.alignItems = 'start';

    // Add buttons in order for natural row-wise grid flow
    sports.forEach(sport => {
      sportButtonsContainer.appendChild(createSportButton(sport));
    });
  } catch (error) {
    console.error('Error loading sports:', error);
    sportButtonsContainer.textContent = 'Error loading sports';
  }
}

function updateHiddenSelect(sport) {
  hiddenSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = sport;
  option.selected = true;
  hiddenSelect.appendChild(option);
  hiddenSelect.dispatchEvent(new Event('change'));
}

function clearHiddenSelect() {
  hiddenSelect.innerHTML = '';
  hiddenSelect.dispatchEvent(new Event('change'));
}

function selectSport(button, sport) {
  if (selectedSport === sport) return;

  selectedSport = sport;

  sportButtonsContainer.innerHTML = '';

  sportButtonsContainer.style.display = 'grid';
  sportButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  sportButtonsContainer.style.gridAutoRows = 'min-content';
  sportButtonsContainer.style.gap = '4px 6px';
  sportButtonsContainer.style.marginTop = '8px';
  sportButtonsContainer.style.alignItems = 'start';

  // Selected sport button green, top-left grid cell
  const selectedBtn = createSportButton(sport);
  selectedBtn.classList.remove('blue');
  selectedBtn.classList.add('green');
  sportButtonsContainer.appendChild(selectedBtn);

  // Invisible placeholder button for middle cell
  const placeholderBtn = createSportButton('');
  placeholderBtn.style.visibility = 'hidden';
  placeholderBtn.style.pointerEvents = 'none';
  placeholderBtn.style.margin = '0';
  placeholderBtn.style.padding = '0';
  placeholderBtn.style.height = selectedBtn.offsetHeight ? selectedBtn.offsetHeight + 'px' : '36px'; // slightly smaller fallback
  sportButtonsContainer.appendChild(placeholderBtn);

  // Change Sport button in third cell
  if (!changeSportBtn) {
    changeSportBtn = document.createElement('button');
    changeSportBtn.type = 'button';
    changeSportBtn.textContent = 'Change Sport';
    changeSportBtn.className = 'pick-btn blue';
    changeSportBtn.style.minWidth = '120px';
    changeSportBtn.style.width = '100%';
    changeSportBtn.style.boxSizing = 'border-box';
    changeSportBtn.style.alignSelf = 'flex-start';
    changeSportBtn.style.marginTop = '0';

    changeSportBtn.addEventListener('click', () => {
      resetSportSelection();
    });
  }
  sportButtonsContainer.appendChild(changeSportBtn);

  updateHiddenSelect(sport);

  // Minimal addition: show league section once sport selected
  if (leagueSection) {
    leagueSection.style.display = ''; // clear inline display to show normally
  }
}

function resetSportSelection() {
  selectedSport = null;

  if (changeSportBtn) {
    changeSportBtn.remove();
    changeSportBtn = null;
  }

  loadSports();

  clearHiddenSelect();

  // Minimal addition: hide league section on reset
  if (leagueSection) {
    leagueSection.style.display = 'none';
  }
}

function createSportButton(sport) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = sport;
  btn.className = 'pick-btn blue';

  // Reduced padding and margin for tighter vertical spacing
  btn.style.paddingTop = '6px';
  btn.style.paddingBottom = '6px';
  btn.style.marginTop = '2px';
  btn.style.marginBottom = '2px';

  btn.style.width = '100%';
  btn.style.minWidth = '0';
  btn.style.boxSizing = 'border-box';
  btn.addEventListener('click', () => selectSport(btn, sport));
  return btn;
}
