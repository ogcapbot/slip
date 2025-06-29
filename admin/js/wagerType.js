// admin/js/wagerType.js
import { db } from '../firebaseInit.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadUnits } from './units.js';

const sportSelect = document.getElementById('sportSelect');
const wagerTypeSelect = document.getElementById('wagerTypeSelect');
const numberInputContainer = document.getElementById('numberInputContainer');
const numberInput = document.getElementById('numberInput');
const finalPickDescription = document.getElementById('finalPickDescription');
const pickOptionsContainer = document.getElementById('pickOptionsContainer'); // To get team buttons
const gameSelect = document.getElementById('gameSelect'); // listens for enabling wager loading

// Hide original wagerTypeSelect but keep for compatibility
if (wagerTypeSelect) {
  wagerTypeSelect.style.display = 'none';
}

let wagerButtonsContainer = document.getElementById('wagerButtonsContainer');
if (!wagerButtonsContainer) {
  wagerButtonsContainer = document.createElement('div');
  wagerButtonsContainer.id = 'wagerButtonsContainer';

  // Insert wagerButtonsContainer after wagerTypeSelect's label
  const wagerLabel = document.querySelector('label[for="wagerTypeSelect"]');
  if (wagerLabel) {
    wagerLabel.parentNode.insertBefore(wagerButtonsContainer, wagerLabel.nextSibling);
  } else if (wagerTypeSelect && wagerTypeSelect.parentNode) {
    wagerTypeSelect.parentNode.insertBefore(wagerButtonsContainer, wagerTypeSelect.nextSibling);
  } else {
    document.body.appendChild(wagerButtonsContainer);
  }
}

let selectedWagerId = null;
let changeWagerBtn = null;

// Utility to get last word of a team name
function getLastWord(teamName) {
  if (!teamName) return '';
  const words = teamName.trim().split(' ');
  return words[words.length - 1];
}

// Reset wager buttons on sport change
sportSelect.addEventListener('change', () => {
  clearWagerButtons();
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';
});

// Enable wagerType load on game selection change
gameSelect.addEventListener('change', async () => {
  if (!gameSelect.value) {
    clearWagerButtons();
    wagerButtonsContainer.textContent = 'Select a game first';
    numberInputContainer.style.display = 'none';
    finalPickDescription.textContent = '';
    return;
  }
  await loadWagerTypes();
});

async function loadWagerTypes() {
  const selectedSport = sportSelect.value;
  clearWagerButtons();
  wagerButtonsContainer.textContent = 'Loading wager types...';
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';

  try {
    const wagerTypesRef = collection(db, 'WagerTypes');

    const qAll = query(wagerTypesRef, where('active_status', '==', 'active'), where('Sport', '==', 'All'), orderBy('id'));
    const qSport = query(wagerTypesRef, where('active_status', '==', 'active'), where('Sport', '==', selectedSport), orderBy('id'));

    const [allSnap, sportSnap] = await Promise.all([getDocs(qAll), getDocs(qSport)]);

    const wagerTypesMap = new Map();

    allSnap.forEach(doc => wagerTypesMap.set(doc.id, doc.data()));
    sportSnap.forEach(doc => wagerTypesMap.set(doc.id, doc.data()));

    const wagerTypes = Array.from(wagerTypesMap.values());

    if (wagerTypes.length === 0) {
      wagerButtonsContainer.textContent = 'No wager types found';
      return;
    }

    wagerButtonsContainer.textContent = '';

    // Setup grid container
    wagerButtonsContainer.style.display = 'grid';
    wagerButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    wagerButtonsContainer.style.gridAutoRows = 'min-content';
    wagerButtonsContainer.style.gap = '4px 6px'; // vertical 4px, horizontal 6px gap
    wagerButtonsContainer.style.marginTop = '8px';
    wagerButtonsContainer.style.alignItems = 'start';

    wagerTypes.forEach(wt => {
      const btn = createWagerButton(wt.id, wt.wager_label_template || 'Unknown', wt.pick_desc_template || '');
      wagerButtonsContainer.appendChild(btn);
    });
  } catch (error) {
    console.error('Error loading wager types:', error);
    wagerButtonsContainer.textContent = 'Error loading wager types';
  }
}

function createWagerButton(id, label, descTemplate) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.className = 'pick-btn blue';

  btn.style.paddingTop = '6px';
  btn.style.paddingBottom = '6px';
  btn.style.marginTop = '2px';
  btn.style.marginBottom = '2px';

  btn.style.width = '100%';
  btn.style.minWidth = '0';
  btn.style.boxSizing = 'border-box';

  btn.dataset.wagerId = id;
  btn.dataset.descTemplate = descTemplate;

  btn.addEventListener('click', () => selectWager(btn, id, descTemplate));

  return btn;
}

function selectWager(button, id, descTemplate) {
  if (selectedWagerId === id) return;

  selectedWagerId = id;

  // Clear container and show only selected wager button + Change button
  wagerButtonsContainer.innerHTML = '';

  wagerButtonsContainer.style.display = 'grid';
  wagerButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  wagerButtonsContainer.style.gridAutoRows = 'min-content';
  wagerButtonsContainer.style.gap = '4px 6px';
  wagerButtonsContainer.style.marginTop = '8px';
  wagerButtonsContainer.style.alignItems = 'start';

  // Selected wager button green, top-left grid cell
  const selectedBtn = createWagerButton(id, button.textContent, descTemplate);
  selectedBtn.classList.remove('blue');
  selectedBtn.classList.add('green');
  wagerButtonsContainer.appendChild(selectedBtn);

  // Invisible placeholder button for middle cell
  const placeholderBtn = createWagerButton('', '');
  placeholderBtn.style.visibility = 'hidden';
  placeholderBtn.style.pointerEvents = 'none';
  placeholderBtn.style.margin = '0';
  placeholderBtn.style.padding = '0';
  placeholderBtn.style.height = selectedBtn.offsetHeight ? selectedBtn.offsetHeight + 'px' : '36px';
  wagerButtonsContainer.appendChild(placeholderBtn);

  // Change Wager button in third cell
  if (!changeWagerBtn) {
    changeWagerBtn = document.createElement('button');
    changeWagerBtn.type = 'button';
    changeWagerBtn.textContent = 'Change Wager';
    changeWagerBtn.className = 'pick-btn blue';
    changeWagerBtn.style.minWidth = '120px';
    changeWagerBtn.style.width = '100%';
    changeWagerBtn.style.boxSizing = 'border-box';
    changeWagerBtn.style.alignSelf = 'flex-start';
    changeWagerBtn.style.marginTop = '0';

    changeWagerBtn.addEventListener('click', () => {
      resetWagerSelection();
    });
  }
  wagerButtonsContainer.appendChild(changeWagerBtn);

  updateFinalPickDescription(descTemplate);
  numberInputContainer.style.display = descTemplate.includes('[[NUM]]') ? 'block' : 'none';

  // Enable or disable number input accordingly
  numberInput.disabled = !descTemplate.includes('[[NUM]]');
  if (!descTemplate.includes('[[NUM]]')) {
    numberInput.value = '';
  }

  // Update hidden wagerTypeSelect for compatibility
  wagerTypeSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = id;
  option.selected = true;
  wagerTypeSelect.appendChild(option);
  wagerTypeSelect.disabled = false;
  wagerTypeSelect.dispatchEvent(new Event('change'));
}

function resetWagerSelection() {
  selectedWagerId = null;

  if (changeWagerBtn) {
    changeWagerBtn.remove();
    changeWagerBtn = null;
  }

  wagerTypeSelect.innerHTML = '<option value="" disabled selected>Choose wager type</option>';
  wagerTypeSelect.disabled = true;
  wagerTypeSelect.dispatchEvent(new Event('change'));

  wagerButtonsContainer.innerHTML = '';
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';
  numberInput.value = '';
}

// Update final description live when number input changes
numberInput.addEventListener('input', () => {
  if (!selectedWagerId) return;
  const selectedBtn = wagerButtonsContainer.querySelector('button.green');
  if (!selectedBtn) return;
  const descTemplate = selectedBtn.dataset.descTemplate || '';
  const selectedTeamButton = pickOptionsContainer.querySelector('button.green');
  const selectedTeam = selectedTeamButton ? selectedTeamButton.textContent.trim() : '';

  let desc = descTemplate;
  if (desc.includes('[[TEAM]]')) {
    const teamName = getLastWord(selectedTeam);
    desc = desc.replace(/\[\[TEAM\]\]/g, teamName);
  }
  if (desc.includes('[[NUM]]')) {
    const num = numberInput.value || '___';
    desc = desc.replace(/\[\[NUM\]\]/g, num);
  }
  finalPickDescription.textContent = desc;
});

function updateFinalPickDescription(descTemplate) {
  const selectedTeamButton = pickOptionsContainer.querySelector('button.green');
  const selectedTeam = selectedTeamButton ? selectedTeamButton.textContent.trim() : '';

  let desc = descTemplate;
  if (desc.includes('[[TEAM]]')) {
    const teamName = getLastWord(selectedTeam);
    desc = desc.replace(/\[\[TEAM\]\]/g, teamName);
  }
  if (desc.includes('[[NUM]]')) {
    desc = desc.replace(/\[\[NUM\]\]/g, '___');
  }
  finalPickDescription.textContent = desc;
}

export default {};
