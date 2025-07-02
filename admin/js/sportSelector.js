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

  // Clear container for new layout
  container.innerHTML = '';

  // Create container for selected sport and change button
  const selectedContainer = document.createElement('div');
  selectedContainer.style.display = 'flex';
  selectedContainer.style.alignItems = 'center';
  selectedContainer.style.justifyContent = 'space-between';
  selectedContainer.style.marginTop = '8px';
  selectedContainer.style.marginBottom = '8px';
  selectedContainer.style.padding = '4px 8px';
  selectedContainer.style.borderRadius = '6px';
  selectedContainer.style.backgroundColor = '#f0f0f0';

  // Selected sport text
  const selectedText = document.createElement('span');
  selectedText.textContent = `Selected Sport: ${sport}`;
  selectedText.style.fontWeight = '600';
  selectedText.style.fontFamily = 'Oswald, sans-serif';
  selectedText.style.fontSize = '14px';
  selectedText.style.color = '#333';

  // Change button
  const changeBtn = document.createElement('button');
  changeBtn.type = 'button';
  changeBtn.textContent = 'Change';
  changeBtn.className = 'pick-btn blue';
  changeBtn.style.fontSize = '12px';
  changeBtn.style.padding = '4px 10px';
  changeBtn.style.marginLeft = '12px';
  changeBtn.style.minWidth = '70px';
  changeBtn.style.height = '32px';
  changeBtn.style.boxSizing = 'border-box';

  changeBtn.addEventListener('click', () => {
    resetSportSelection();
  });

  selectedContainer.appendChild(selectedText);
  selectedContainer.appendChild(changeBtn);

  container.appendChild(selectedContainer);

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
