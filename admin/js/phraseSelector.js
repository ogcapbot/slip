// admin/js/phraseSelector.js
import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const containerId = 'phraseSelectorContainer';
let container = document.getElementById(containerId);

if (!container) {
  // Create container if not present, insert after notes section
  const notesContainer = document.getElementById('notesContainer');
  container = document.createElement('div');
  container.id = containerId;
  container.style.marginTop = '20px';
  if (notesContainer?.parentNode) {
    notesContainer.parentNode.insertBefore(container, notesContainer.nextSibling);
  } else {
    document.body.appendChild(container);
  }
}

let allPhrases = [];
let selectedType = null;
let selectedEnergy = null;
let currentSport = null;  // Pass in from your app on init to prioritize sport-specific phrases

// Create DOM elements
const typeTitle = document.createElement('h4');
typeTitle.textContent = 'Choose Phrase Type';
container.appendChild(typeTitle);

const typeButtonsContainer = document.createElement('div');
typeButtonsContainer.style.display = 'grid';
typeButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
typeButtonsContainer.style.gap = '6px';
container.appendChild(typeButtonsContainer);

const energyTitle = document.createElement('h4');
energyTitle.style.marginTop = '20px';
energyTitle.style.display = 'none';
energyTitle.textContent = 'Choose Energy';
container.appendChild(energyTitle);

const energyButtonsContainer = document.createElement('div');
energyButtonsContainer.style.marginTop = '8px';
energyButtonsContainer.style.display = 'none';
energyButtonsContainer.style.flexDirection = 'column';
energyButtonsContainer.style.gap = '10px';
container.appendChild(energyButtonsContainer);

const sportSpecificTitle = document.createElement('h5');
sportSpecificTitle.style.marginTop = '20px';
sportSpecificTitle.style.display = 'none';
container.appendChild(sportSpecificTitle);

const sportSpecificContainer = document.createElement('div');
sportSpecificContainer.style.display = 'grid';
sportSpecificContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
sportSpecificContainer.style.gap = '6px';
sportSpecificContainer.style.marginTop = '8px';
sportSpecificContainer.style.display = 'none';
container.appendChild(sportSpecificContainer);

const loadMoreBtn = document.createElement('button');
loadMoreBtn.textContent = 'Load More Phrases';
loadMoreBtn.className = 'pick-btn blue';
loadMoreBtn.style.marginTop = '12px';
loadMoreBtn.style.width = 'fit-content';
loadMoreBtn.style.display = 'none';
container.appendChild(loadMoreBtn);

const nonSportTitle = document.createElement('h5');
nonSportTitle.style.marginTop = '20px';
nonSportTitle.style.display = 'none';
nonSportTitle.textContent = 'Non Sport Specific Hype Phrases';
container.appendChild(nonSportTitle);

const nonSportContainer = document.createElement('div');
nonSportContainer.style.display = 'grid';
nonSportContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
nonSportContainer.style.gap = '6px';
nonSportContainer.style.marginTop = '8px';
nonSportContainer.style.display = 'none';
container.appendChild(nonSportContainer);

// State for showing more phrases
let showingMore = false;

// Utility shuffle function
function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createButton(text, onClick, isLarge = false) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pick-btn blue';
  btn.style.width = '100%';
  btn.style.whiteSpace = 'normal';
  btn.style.wordWrap = 'break-word';
  btn.style.textAlign = 'center';
  btn.style.fontWeight = '700';
  btn.style.fontSize = '0.9rem';
  btn.style.padding = isLarge ? '16px 12px' : '8px 12px';
  if (isLarge) btn.style.gridColumn = '1 / -1'; // full width in grid

  btn.textContent = text;
  btn.addEventListener('click', () => {
    onClick(btn);
  });
  return btn;
}

function clearSelection(container, groupName) {
  container.querySelectorAll('button').forEach(btn => btn.classList.remove('green'));
  if (groupName === 'type') selectedType = null;
  if (groupName === 'energy') selectedEnergy = null;
}

function selectType(button, type) {
  if (selectedType === type) return;
  clearSelection(typeButtonsContainer, 'type');
  button.classList.add('green');
  selectedType = type;

  // After selecting Type, show Energy buttons filtered by type
  renderEnergyButtons();
  energyTitle.style.display = '';
  energyButtonsContainer.style.display = 'flex';

  // Reset phrase selections & hides phrase sections
  resetPhraseSections();

  // Callback or event dispatch for your app to consume selected phrase later if needed
}

function selectEnergy(button, energy) {
  if (selectedEnergy === energy) return;
  clearSelection(energyButtonsContainer, 'energy');
  button.classList.add('green');
  selectedEnergy = energy;

  // Show phrases filtered by selectedType & selectedEnergy and currentSport
  renderPhrases();
}

function resetPhraseSections() {
  sportSpecificContainer.style.display = 'none';
  sportSpecificContainer.innerHTML = '';
  sportSpecificTitle.style.display = 'none';

  loadMoreBtn.style.display = 'none';

  nonSportContainer.style.display = 'none';
  nonSportContainer.innerHTML = '';
  nonSportTitle.style.display = 'none';

  showingMore = false;
}

function renderTypeButtons() {
  typeButtonsContainer.innerHTML = '';
  // get unique types from allPhrases
  const typesSet = new Set(allPhrases.map(p => p.Type).filter(Boolean));
  const types = Array.from(typesSet).sort();

  types.forEach(type => {
    const btn = createButton(type, btn => selectType(btn, type));
    typeButtonsContainer.appendChild(btn);
  });
}

function renderEnergyButtons() {
  energyButtonsContainer.innerHTML = '';
  if (!selectedType) return;

  // unique energies for selectedType
  const energiesSet = new Set(allPhrases.filter(p => p.Type === selectedType).map(p => p.Energy).filter(Boolean));
  const energies = Array.from(energiesSet).sort();

  energies.forEach(energy => {
    const btn = createButton(energy, btn => selectEnergy(btn, energy), true);
    energyButtonsContainer.appendChild(btn);
  });
}

function renderPhrases() {
  sportSpecificContainer.innerHTML = '';
  nonSportContainer.innerHTML = '';
  resetPhraseSections();

  if (!selectedType || !selectedEnergy) return;

  // Filter by type & energy
  let filtered = allPhrases.filter(p => p.Type === selectedType && p.Energy === selectedEnergy);

  // Separate sport specific and non sport specific
  const sportSpecific = [];
  const nonSportSpecific = [];

  filtered.forEach(phrase => {
    if (phrase.Sport && phrase.Sport.toLowerCase() === currentSport?.toLowerCase()) {
      sportSpecific.push(phrase);
    } else if (!phrase.Sport) {
      nonSportSpecific.push(phrase);
    }
  });

  if (sportSpecific.length) {
    sportSpecificTitle.textContent = `Choose ${currentSport} Specific Hype Phrase Below`;
    sportSpecificTitle.style.display = '';
    sportSpecificContainer.style.display = 'grid';

    // shuffle sportSpecific phrases and append buttons
    shuffleArray(sportSpecific).forEach(p => {
      const btn = createButton(p.Phrase, () => selectPhrase(p));
      sportSpecificContainer.appendChild(btn);
    });

    loadMoreBtn.style.display = 'inline-block';
  } else {
    loadMoreBtn.style.display = 'none';
  }

  // Hide non sport phrases until user clicks load more
  nonSportTitle.style.display = 'none';
  nonSportContainer.style.display = 'none';

  loadMoreBtn.onclick = () => {
    loadMoreBtn.style.display = 'none';
    if (sportSpecificTitle) sportSpecificTitle.style.display = 'none';

    nonSportTitle.style.display = '';
    nonSportContainer.style.display = 'grid';

    shuffleArray(nonSportSpecific).forEach(p => {
      const btn = createButton(p.Phrase, () => selectPhrase(p));
      nonSportContainer.appendChild(btn);
    });
  };
}

let lastSelectedPhrase = null;

function selectPhrase(phrase) {
  lastSelectedPhrase = phrase;
  // Visual highlight - clear all buttons green, then highlight selected phrase buttons
  [sportSpecificContainer, nonSportContainer].forEach(container => {
    container.querySelectorAll('button').forEach(btn => btn.classList.remove('green'));
  });

  // Find matching buttons for this phrase text and set green
  [sportSpecificContainer, nonSportContainer].forEach(container => {
    [...container.querySelectorAll('button')].forEach(btn => {
      if (btn.textContent === phrase.Phrase) {
        btn.classList.add('green');
      }
    });
  });

  // Optionally: you can fire an event or callback to inform main app about selected phrase
  // e.g. document.dispatchEvent(new CustomEvent('phraseSelected', { detail: phrase }));
}

async function loadAllPhrases(sportToPrioritize = null) {
  currentSport = sportToPrioritize;
  container.style.display = 'block';
  container.textContent = 'Loading hype phrases...';

  try {
    allPhrases = [];
    const snapshot = await getDocs(collection(db, 'HypePhrases'));
    snapshot.forEach(doc => {
      allPhrases.push(doc.data());
    });
    if (allPhrases.length === 0) {
      container.textContent = 'No hype phrases found.';
      return;
    }

    container.textContent = '';
    renderTypeButtons();
  } catch (err) {
    container.textContent = 'Failed to load hype phrases.';
    console.error('Error loading hype phrases:', err);
  }
}

export async function initPhraseSelector(sport) {
  await loadAllPhrases(sport);
}

// To get the selected phrase from outside the module
export function getSelectedPhrase() {
  return lastSelectedPhrase;
}
