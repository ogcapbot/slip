// admin/js/phraseSelector.js
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const phraseSection = document.createElement('div');
phraseSection.id = 'phraseSelectorSection';
phraseSection.style.display = 'none';
phraseSection.style.marginTop = '20px';

// Titles
const sportTitle = document.createElement('h4');
const nonSportTitle = document.createElement('h4');
nonSportTitle.style.marginTop = '20px';

// Containers for buttons
const typeButtonsContainer = document.createElement('div');
const energyButtonsContainer = document.createElement('div');
energyButtonsContainer.style.marginTop = '10px';

// Load More button
const loadMoreBtn = document.createElement('button');
loadMoreBtn.type = 'button';
loadMoreBtn.textContent = 'Load More Phrases';
loadMoreBtn.className = 'pick-btn blue';
loadMoreBtn.style.marginTop = '12px';

phraseSection.appendChild(sportTitle);
phraseSection.appendChild(typeButtonsContainer);
phraseSection.appendChild(loadMoreBtn);
phraseSection.appendChild(nonSportTitle);
phraseSection.appendChild(energyButtonsContainer);

// Append phraseSection after notesContainer
const notesContainer = document.getElementById('notesContainer');
notesContainer.parentNode.insertBefore(phraseSection, notesContainer.nextSibling);

// State
let allPhrases = [];
let sportPhrases = [];
let nonSportPhrases = [];
let filteredTypes = [];
let selectedType = null;
let selectedEnergy = null;
let currentSport = null;
let showingNonSport = false;

// Helper: shuffle array
function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function loadPhrases(sport) {
  currentSport = sport || null;
  phraseSection.style.display = 'none';
  typeButtonsContainer.innerHTML = '';
  energyButtonsContainer.innerHTML = '';
  sportTitle.textContent = '';
  nonSportTitle.textContent = '';
  loadMoreBtn.style.display = 'none';
  selectedType = null;
  selectedEnergy = null;
  showingNonSport = false;

  try {
    const snapshot = await getDocs(collection(window.db, 'HypePhrases'));
    allPhrases = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      allPhrases.push({ id: doc.id, ...data });
    });

    // Filter sport phrases and non sport phrases
    sportPhrases = allPhrases.filter(p => p.Sport === currentSport);
    nonSportPhrases = allPhrases.filter(p => !p.Sport);

    // Shuffle sport phrases
    sportPhrases = shuffleArray(sportPhrases);
    nonSportPhrases = shuffleArray(nonSportPhrases);

    // Determine distinct types (union of all phrases)
    const typesSet = new Set(allPhrases.map(p => p.Type));
    filteredTypes = Array.from(typesSet).sort();

    renderTypeButtons();
  } catch (error) {
    phraseSection.textContent = 'Error loading phrases.';
    console.error('PhraseSelector load error:', error);
  }
}

function renderTypeButtons() {
  typeButtonsContainer.innerHTML = '';
  if (currentSport && sportPhrases.length > 0) {
    sportTitle.textContent = `Choose ${currentSport} Specific Hype Phrase Below`;
  } else {
    sportTitle.textContent = '';
  }
  nonSportTitle.textContent = '';

  filteredTypes.forEach(type => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = type;
    btn.className = 'pick-btn blue';
    btn.style.padding = '10px';
    btn.style.marginBottom = '6px';
    btn.style.width = '100%';
    btn.addEventListener('click', () => selectType(type));
    typeButtonsContainer.appendChild(btn);
  });

  loadMoreBtn.style.display = 'inline-block';
  loadMoreBtn.disabled = false;
  loadMoreBtn.onclick = () => showNonSportSection();
}

function selectType(type) {
  selectedType = type;
  selectedEnergy = null;
  energyButtonsContainer.innerHTML = '';

  // Show energies matching selectedType and sport (if any)
  const matchingSportEnergies = sportPhrases.filter(p => p.Type === type);
  const matchingNonSportEnergies = nonSportPhrases.filter(p => p.Type === type);

  let energiesToShow = [];

  if (!showingNonSport && currentSport && matchingSportEnergies.length > 0) {
    energiesToShow = shuffleArray(matchingSportEnergies);
    sportTitle.textContent = `Choose ${currentSport} Specific Hype Phrase Below`;
    nonSportTitle.textContent = '';
  } else {
    energiesToShow = shuffleArray(matchingNonSportEnergies);
    sportTitle.textContent = '';
    nonSportTitle.textContent = 'Non Sport Specific Hype Phrase';
  }

  energiesToShow.forEach(phrase => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick-btn blue';
    btn.style.width = '100%';
    btn.style.marginBottom = '6px';
    btn.textContent = phrase.Energy;
    btn.title = phrase.EnergyDescription || '';
    btn.addEventListener('click', () => selectEnergy(phrase));
    energyButtonsContainer.appendChild(btn);
  });

  checkEnableSubmit();
}

function showNonSportSection() {
  showingNonSport = true;
  sportTitle.textContent = '';
  nonSportTitle.textContent = 'Non Sport Specific Hype Phrase';
  loadMoreBtn.style.display = 'none';
  renderTypeButtons();
  // Automatically select first type if possible to refresh energies list for non-sport
  if (filteredTypes.length > 0) {
    selectType(filteredTypes[0]);
  }
}

// Select Energy (the actual phrase choice)
function selectEnergy(phrase) {
  selectedEnergy = phrase;

  // Highlight selected energy button
  [...energyButtonsContainer.children].forEach(btn => {
    btn.classList.remove('green');
    btn.classList.add('blue');
  });

  const clickedBtn = [...energyButtonsContainer.children].find(btn => btn.textContent === phrase.Energy);
  if (clickedBtn) {
    clickedBtn.classList.remove('blue');
    clickedBtn.classList.add('green');
  }

  checkEnableSubmit();
}

function isPhraseSelected() {
  return selectedType !== null && selectedEnergy !== null;
}

function reset() {
  phraseSection.style.display = 'none';
  typeButtonsContainer.innerHTML = '';
  energyButtonsContainer.innerHTML = '';
  sportTitle.textContent = '';
  nonSportTitle.textContent = '';
  loadMoreBtn.style.display = 'none';
  selectedType = null;
  selectedEnergy = null;
  showingNonSport = false;
}

// Attach to window for global access (used in notesSection)
window.phraseSelector = {
  loadPhrases,
  isPhraseSelected,
  reset,
  getSelectedPhrase: () => selectedEnergy,
  getSelectedType: () => selectedType
};

export { loadPhrases, reset, isPhraseSelected };
