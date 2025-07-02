import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const originalSportSelect = document.getElementById('sportSelect');

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

export async function loadSports(container = null) {
  const targetContainer = container || sportButtonsContainer;

  targetContainer.innerHTML = '';
  selectedSport = null;
  if (changeSportBtn) {
    changeSportBtn.remove();
    changeSportBtn = null;
  }
  hiddenSelect.innerHTML = '';
  hiddenSelect.dispatchEvent(new Event('change'));

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
    targetContainer.style.gridAutoRows = 'min-content';
    targetContainer.style.gap = '4px 6px';
    targetContainer.style.marginTop = '8px';
    targetContainer.style.alignItems = 'start';

    sports.forEach(sport => {
      targetContainer.appendChild(createSportButton(sport));
    });
  } catch (error) {
    console.error('Error loading sports:', error);
    targetContainer.textContent = 'Error loading sports';
  }
}

export function resetSportSelectorState() {
  selectedSport = null;
  // Add other state resets here if needed
  if (changeSportBtn) {
    changeSportBtn.remove();
    changeSportBtn = null;
  }
  if (hiddenSelect) {
    hiddenSelect.innerHTML = '';
    hiddenSelect.dispatchEvent(new Event('change'));
  }
  if (sportButtonsContainer) {
    sportButtonsContainer.innerHTML = '';
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

  const container = button.parentNode;

  // Clear container and set flex layout for horizontal alignment
  container.innerHTML = '';
  container.style.display = 'flex';
  container.style.justifyContent = 'space-between';
  container.style.alignItems = 'center';
  container.style.marginTop = '8px';
  container.style.width = '100%'; // Ensure container uses full width

  // Create and add the selected sport text aligned left
  const selectedText = document.createElement('span');
  selectedText.textContent = `Selected Sport: ${sport}`;
  selectedText.style.fontFamily = 'Oswald, sans-serif';
  selectedText.style.fontWeight = '700';
  selectedText.style.fontSize = '11px';
  selectedText.style.userSelect = 'none';
  selectedText.style.flexGrow = '1'; // Take all remaining space on left
  container.appendChild(selectedText);

  // Create the smaller change button aligned right
  changeSportBtn = document.createElement('button');
  changeSportBtn.type = 'button';
  changeSportBtn.textContent = 'Change';
  changeSportBtn.className = 'pick-btn change-btn';
  changeSportBtn.style.minWidth = '60px';   // smaller width
  changeSportBtn.style.height = '22px';     // shorter height
  changeSportBtn.style.fontSize = '11px';   // smaller font
  changeSportBtn.style.padding = '0 8px';
  changeSportBtn.style.cursor = 'pointer';
  changeSportBtn.style.flexShrink = '0';    // Prevent shrinking
  changeSportBtn.style.marginLeft = '10px'; // Add some space from text

  changeSportBtn.addEventListener('click', () => {
    resetSportSelection();
  });

  container.appendChild(changeSportBtn);

  updateHiddenSelect(sport);
}

function resetSportSelection() {
  selectedSport = null;

  if (changeSportBtn) {
    changeSportBtn.remove();
    changeSportBtn = null;
  }

  loadSports();

  clearHiddenSelect();
}

function createSportButton(sport) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = sport;
  btn.className = 'pick-btn blue';

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
