// admin/js/sportSelector.js
import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const originalSportSelect = document.getElementById('sportSelect');

let sportButtonsContainer;
let hiddenSelect;
let selectedSport = null;
let changeSportBtn = null;

// Remove the original visible select from DOM
if (originalSportSelect) {
  const parent = originalSportSelect.parentNode;
  parent.removeChild(originalSportSelect);

  // Create a hidden select to keep compatibility
  hiddenSelect = document.createElement('select');
  hiddenSelect.id = 'sportSelect';
  hiddenSelect.style.display = 'none';
  parent.appendChild(hiddenSelect);

  sportButtonsContainer = document.createElement('div');
  sportButtonsContainer.id = 'sportButtonsContainer';
  sportButtonsContainer.style.display = 'flex';
  sportButtonsContainer.style.gap = '20px';
  sportButtonsContainer.style.marginTop = '8px';

  parent.appendChild(sportButtonsContainer);
} else {
  // Fallback if original select not found
  sportButtonsContainer = document.getElementById('sportButtonsContainer');
  if (!sportButtonsContainer) {
    sportButtonsContainer = document.createElement('div');
    sportButtonsContainer.id = 'sportButtonsContainer';
    sportButtonsContainer.style.display = 'flex';
    sportButtonsContainer.style.gap = '20px';
    sportButtonsContainer.style.marginTop = '8px';
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

    // Split sports array in half
    const half = Math.ceil(sports.length / 2);
    const leftSports = sports.slice(0, half);
    const rightSports = sports.slice(half);

    // Create left and right containers for vertical columns
    const leftContainer = document.createElement('div');
    leftContainer.style.display = 'flex';
    leftContainer.style.flexDirection = 'column';
    leftContainer.style.gap = '10px';
    leftContainer.style.flex = '1';

    const rightContainer = document.createElement('div');
    rightContainer.style.display = 'flex';
    rightContainer.style.flexDirection = 'column';
    rightContainer.style.gap = '10px';
    rightContainer.style.flex = '1';

    leftSports.forEach(sport => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = sport;
      btn.className = 'pick-btn blue';
      btn.style.minWidth = '100px';

      btn.addEventListener('click', () => selectSport(btn, sport));

      leftContainer.appendChild(btn);
    });

    rightSports.forEach(sport => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = sport;
      btn.className = 'pick-btn blue';
      btn.style.minWidth = '100px';

      btn.addEventListener('click', () => selectSport(btn, sport));

      rightContainer.appendChild(btn);
    });

    sportButtonsContainer.style.display = 'flex';
    sportButtonsContainer.style.justifyContent = 'space-between';
    sportButtonsContainer.style.alignItems = 'flex-start';
    sportButtonsContainer.appendChild(leftContainer);
    sportButtonsContainer.appendChild(rightContainer);

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

  const allButtons = Array.from(sportButtonsContainer.querySelectorAll('button'));
  allButtons.forEach(btn => {
    if (btn === button) {
      btn.classList.remove('blue');
      btn.classList.add('green');
      btn.style.display = '';
    } else {
      btn.style.display = 'none';
    }
  });

  if (!changeSportBtn) {
    changeSportBtn = document.createElement('button');
    changeSportBtn.type = 'button';
    changeSportBtn.textContent = 'Change Sport';
    changeSportBtn.className = 'pick-btn blue';
    changeSportBtn.style.minWidth = '120px';
    changeSportBtn.style.alignSelf = 'center';
    changeSportBtn.style.marginLeft = '10px';

    changeSportBtn.addEventListener('click', () => {
      resetSportSelection();
    });

    sportButtonsCo
