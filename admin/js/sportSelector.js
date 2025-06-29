// admin/js/sportSelector.js
import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');

// Remove the original select from the DOM entirely
if (sportSelect) {
  sportSelect.parentNode.removeChild(sportSelect);
}

let sportButtonsContainer = document.getElementById('sportButtonsContainer');
if (!sportButtonsContainer) {
  sportButtonsContainer = document.createElement('div');
  sportButtonsContainer.id = 'sportButtonsContainer';
  sportButtonsContainer.style.display = 'flex';
  sportButtonsContainer.style.flexWrap = 'wrap';
  sportButtonsContainer.style.gap = '10px';
  sportButtonsContainer.style.marginTop = '8px';

  // Insert into the container where select was — assuming container div with class or id is available:
  // Here we append to the container div for the sport section.
  // Adjust this selector to where your sportSelect used to be.
  const container = document.querySelector('#sportSelect')?.parentNode || document.body;
  container.appendChild(sportButtonsContainer);
}

let selectedSport = null;
let changeSportBtn = null;

export async function loadSports() {
  sportButtonsContainer.innerHTML = ''; // Clear any existing buttons
  selectedSport = null;
  if (changeSportBtn) {
    changeSportBtn.remove();
    changeSportBtn = null;
  }

  try {
    const snapshot = await getDocs(collection(db, 'GameCache'));
    const sports = new Set();

    snapshot.forEach(doc => {
      const sport = doc.data().Sport;
      if (sport) sports.add(sport);
    });

    if (sports.size === 0) {
      sportButtonsContainer.textContent = 'No sports found';
      return;
    }

    sports.forEach(sport => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = sport;
      btn.className = 'pick-btn blue';
      btn.style.flex = '0 1 auto';
      btn.style.minWidth = '100px';

      btn.addEventListener('click', () => selectSport(btn, sport));

      sportButtonsContainer.appendChild(btn);
    });

  } catch (error) {
    console.error('Error loading sports:', error);
    sportButtonsContainer.textContent = 'Error loading sports';
  }
}

function selectSport(button, sport) {
  if (selectedSport === sport) return; // already selected

  selectedSport = sport;

  // Remove green/blue from all buttons, hide all except selected
  const allButtons = Array.from(sportButtonsContainer.querySelectorAll('button'));
  allButtons.forEach(btn => {
    if (btn === button) {
      btn.classList.remove('blue');
      btn.classList.add('green');
    } else {
      btn.style.display = 'none';
    }
  });

  // Add "Change Sport" button to right of selected button
  if (!changeSportBtn) {
    changeSportBtn = document.createElement('button');
    changeSportBtn.type = 'button';
    changeSportBtn.textContent = 'Change Sport';
    changeSportBtn.className = 'pick-btn blue';
    changeSportBtn.style.flex = '0 1 auto';
    changeSportBtn.style.minWidth = '120px';
    changeSportBtn.style.alignSelf = 'center';

    changeSportBtn.addEventListener('click', () => {
      resetSportSelection();
    });

    sportButtonsContainer.appendChild(changeSportBtn);
  }

  // Dispatch a custom event to notify other parts of the app about the selection
  const event = new CustomEvent('sportSelected', { detail: { sport } });
  sportButtonsContainer.dispatchEvent(event);
}

function resetSportSelection() {
  selectedSport = null;
  if (changeSportBtn) {
    changeSportBtn.remove();
    changeSportBtn = null;
  }

  // Show all buttons and reset colors
  const allButtons = Array.from(sportButtonsContainer.querySelectorAll('button'));
  allButtons.forEach(btn => {
    btn.style.display = '';
    btn.classList.remove('green');
    btn.classList.add('blue');
  });

  // Dispatch a custom event to notify reset/clear selection
  const event = new CustomEvent('sportSelectionCleared');
  sportButtonsContainer.dispatchEvent(event);
}
