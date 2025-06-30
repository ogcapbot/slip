import { db } from '../firebaseInit.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');
const wagerTypeSelect = document.getElementById('wagerTypeSelect');
const numberInputContainer = document.getElementById('numberInputContainer');
const numberInput = document.getElementById('numberInput');
const finalPickDescription = document.getElementById('finalPickDescription');
const pickOptionsContainer = document.getElementById('pickOptionsContainer'); // For team buttons
const gameSelect = document.getElementById('gameSelect');

if (wagerTypeSelect) {
  wagerTypeSelect.style.display = 'none';
}

numberInputContainer.style.display = 'none';

// Add * Required label below numberInput inside numberInputContainer if not already present
let requiredLabel = numberInputContainer.querySelector('.required-label');
if (!requiredLabel) {
  requiredLabel = document.createElement('div');
  requiredLabel.className = 'required-label';
  requiredLabel.textContent = '* Required';
  requiredLabel.style.color = 'red';
  requiredLabel.style.fontWeight = 'bold';
  requiredLabel.style.fontSize = '0.8em';
  requiredLabel.style.marginTop = '2px';
  requiredLabel.style.display = 'none';
  numberInputContainer.appendChild(requiredLabel);
}

// Hide original wagerTypeLabel to avoid duplication and DOM insertion errors
const wagerTypeLabelOriginal = document.querySelector('label[for="wagerTypeSelect"]');
if (wagerTypeLabelOriginal) {
  wagerTypeLabelOriginal.style.display = 'none';
}

// Create container for labels ("Choose Wager Type" + "Number Input:")
const wagerSectionContainer = document.createElement('div');
wagerSectionContainer.style.display = 'flex';
wagerSectionContainer.style.justifyContent = 'space-between';
wagerSectionContainer.style.alignItems = 'center';
wagerSectionContainer.style.marginBottom = '8px';
wagerSectionContainer.style.width = '100%';
wagerSectionContainer.style.maxWidth = '600px';

// New "Choose Wager Type" label inside container
const wagerTypeLabelNew = document.createElement('label');
wagerTypeLabelNew.textContent = 'Choose Wager Type';
wagerTypeLabelNew.style.fontWeight = 'bold';
wagerTypeLabelNew.style.display = 'inline-block';

wagerSectionContainer.appendChild(wagerTypeLabelNew);

// Number input label
let numberInputTitle = document.createElement('label');
numberInputTitle.textContent = 'Number Input:';
numberInputTitle.style.fontWeight = 'bold';
numberInputTitle.style.display = 'none';
wagerSectionContainer.appendChild(numberInputTitle);

// Style numberInputContainer for alignment and size inside grid (no margin to fit grid cell)
numberInputContainer.style.margin = '0';
numberInputContainer.style.width = '100%';

// Insert labels container and number input container before wagerTypeSelect element
if (wagerTypeSelect && wagerTypeSelect.parentNode) {
  wagerTypeSelect.parentNode.insertBefore(wagerSectionContainer, wagerTypeSelect);
  wagerTypeSelect.parentNode.insertBefore(numberInputContainer, wagerTypeSelect);
} else {
  document.body.appendChild(wagerSectionContainer);
  document.body.appendChild(numberInputContainer);
}

let wagerButtonsContainer = document.getElementById('wagerButtonsContainer');
if (!wagerButtonsContainer) {
  wagerButtonsContainer = document.createElement('div');
  wagerButtonsContainer.id = 'wagerButtonsContainer';

  if (wagerTypeSelect && wagerTypeSelect.parentNode) {
    wagerTypeSelect.parentNode.insertBefore(wagerButtonsContainer, wagerTypeSelect.nextSibling);
  } else {
    document.body.appendChild(wagerButtonsContainer);
  }
}

// Style wager buttons container as 3-column grid full width
wagerButtonsContainer.style.display = 'grid';
wagerButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
wagerButtonsContainer.style.gap = '8px 12px';
wagerButtonsContainer.style.marginTop = '8px';
wagerButtonsContainer.style.alignItems = 'center'; // vertically center items
wagerButtonsContainer.style.width = '100%';
wagerButtonsContainer.style.maxWidth = '600px';

// Initially hide wager buttons container
wagerButtonsContainer.style.display = 'none';

let selectedWagerId = null;
let changeWagerBtn = null;

function toggleWagerSection() {
  const selectedTeamButton = pickOptionsContainer.querySelector('button.green');
  const teamSelected = !!selectedTeamButton;
  console.log(`[toggleWagerSection] Team selected: ${teamSelected ? selectedTeamButton.textContent : 'None'}`);

  wagerButtonsContainer.style.display = teamSelected ? 'grid' : 'none';
  console.log(`[toggleWagerSection] Wager buttons container display set to: ${wagerButtonsContainer.style.display}`);
}

sportSelect.addEventListener('change', () => {
  console.log('[sportSelect] Sport changed:', sportSelect.value);
  clearWagerButtons();
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';
  toggleWagerSection();
});

gameSelect.addEventListener('change', async () => {
  console.log('[gameSelect] Game changed:', gameSelect.value);
  if (!gameSelect.value) {
    clearWagerButtons();
    wagerButtonsContainer.textContent = 'Select a game first';
    numberInputContainer.style.display = 'none';
    finalPickDescription.textContent = '';
    toggleWagerSection();
    return;
  }
  await loadWagerTypes();
  toggleWagerSection();
});

pickOptionsContainer.addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON') {
    Array.from(pickOptionsContainer.querySelectorAll('button')).forEach(btn => btn.classList.remove('green'));
    e.target.classList.add('green');
    console.log('[pickOptionsContainer] Team selected:', e.target.textContent);
    toggleWagerSection();
  }
});

function clearWagerButtons() {
  console.log('[clearWagerButtons] Clearing wager buttons and resetting state.');
  selectedWagerId = null;
  wagerButtonsContainer.innerHTML = '';
  wagerButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  wagerButtonsContainer.style.marginTop = '8px';
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';
  numberInput.value = '';
  requiredLabel.style.display = 'none';
  numberInputTitle.style.display = 'none';
  if (changeWagerBtn) {
    changeWagerBtn.remove();
    changeWagerBtn = null;
  }
  wagerTypeSelect.innerHTML = '<option value="" disabled selected>Choose wager type</option>';
  wagerTypeSelect.disabled = true;
  wagerTypeSelect.dispatchEvent(new Event('change'));
}

async function loadWagerTypes() {
  const selectedSport = sportSelect.value;
  console.log('[loadWagerTypes] Loading wager types for sport:', selectedSport);

  const selectedTeamButton = pickOptionsContainer.querySelector('button.green');
  if (!selectedTeamButton) {
    clearWagerButtons();
  } else {
    console.log('[loadWagerTypes] Team already selected, skipping clearing wager buttons.');
  }

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

    console.log(`[loadWagerTypes] Found ${wagerTypes.length} wager types.`);

    if (wagerTypes.length === 0) {
      wagerButtonsContainer.textContent = 'No wager types found';
      return;
    }

    wagerButtonsContainer.textContent = '';

    wagerTypes.forEach(wt => {
      const btn = createWagerButton(wt.id, wt.wager_label_template || 'Unknown', wt.pick_desc_template || '');
      wagerButtonsContainer.appendChild(btn);
      console.log(`[loadWagerTypes] Appended wager button: ${wt.wager_label_template || 'Unknown'}`);
    });

  } catch (error) {
    console.error('Error loading wager types:', error);
    wagerButtonsContainer.textContent = 'Error loading wager types';
  }

  toggleWagerSection();
}

function formatLabelWithLineBreaks(label) {
  const keywords = ['OVER', 'UNDER', 'PLUS', 'MINUS'];
  let formatted = label;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\s${keyword}`, 'gi');
    formatted = formatted.replace(regex, `<br>${keyword}`);
  });
  return formatted;
}

function createWagerButton(id, label, descTemplate) {
  console.log(`[createWagerButton] Creating button: ${label} (ID: ${id})`);
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

  console.log('[selectWager] Wager selected:', id, button.textContent);

  selectedWagerId = id;

  wagerButtonsContainer.innerHTML = '';

  wagerButtonsContainer.style.display = 'grid';
  wagerButtonsContainer.style.gridTemplateColumns = '1fr auto auto';
  wagerButtonsContainer.style.gridAutoRows = 'min-content';
  wagerButtonsContainer.style.gap = '4px 6px';
  wagerButtonsContainer.style.marginTop = '0';
  wagerButtonsContainer.style.alignItems = 'center';

  const formattedLabel = formatLabelWithLineBreaks(button.textContent);

  const selectedBtn = createWagerButton(id, formattedLabel, descTemplate);
  selectedBtn.classList.remove('blue');
  selectedBtn.classList.add('green');
  selectedBtn.style.gridColumn = '1 / 2';
  selectedBtn.innerHTML = formattedLabel;
  wagerButtonsContainer.appendChild(selectedBtn);

  if (descTemplate.includes('[[NUM]]')) {
    numberInputContainer.style.display = 'block';
    numberInputContainer.style.gridColumn = '2 / 3';
    requiredLabel.style.display = 'block';
    numberInputTitle.style.display = 'inline-block';

    numberInput.value = '0';
    numberInput.focus();
    numberInput.select();

    wagerButtonsContainer.appendChild(numberInputContainer);
  } else {
    numberInputContainer.style.display = 'none';
    requiredLabel.style.display = 'none';
    numberInputTitle.style.display = 'none';
  }

  if (!changeWagerBtn) {
    changeWagerBtn = document.createElement('button');
    changeWagerBtn.type = 'button';
    changeWagerBtn.textContent = 'Change Wager';
    changeWagerBtn.className = 'pick-btn blue';
    changeWagerBtn.style.minWidth = '120px';
    changeWagerBtn.style.width = '100%';
    changeWagerBtn.style.boxSizing = 'border-box';
    changeWagerBtn.style.alignSelf = 'center';
    changeWagerBtn.style.marginTop = '0';
    changeWagerBtn.style.gridColumn = '3 / 4';

    changeWagerBtn.addEventListener('click', () => {
      resetWagerSelection();
    });
  }
  wagerButtonsContainer.appendChild(changeWagerBtn);

  updateFinalPickDescription(descTemplate);

  numberInput.disabled = !descTemplate.includes('[[NUM]]');
  if (!descTemplate.includes('[[NUM]]')) {
    numberInput.value = '';
  }

  wagerTypeSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = id;
  option.selected = true;
  wagerTypeSelect.appendChild(option);
  wagerTypeSelect.disabled = true;
  wagerTypeSelect.dispatchEvent(new Event('change'));
}

function resetWagerSelection() {
  console.log('[resetWagerSelection] Resetting wager selection.');
  selectedWagerId = null;

  if (changeWagerBtn) {
    changeWagerBtn.remove();
    changeWagerBtn = null;
  }

  wagerTypeSelect.innerHTML = '<option value="" disabled selected>Choose wager type</option>';
  wagerTypeSelect.disabled = true;
  wagerTypeSelect.dispatchEvent(new Event('change'));

  wagerButtonsContainer.innerHTML = '';
  wagerButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  wagerButtonsContainer.style.marginTop = '8px';
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';
  numberInput.value = '';
  requiredLabel.style.display = 'none';
  numberInputTitle.style.display = 'none';
}

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

function getLastWord(teamName) {
  if (!teamName) return '';
  const words = teamName.trim().split(' ');
  return words[words.length - 1];
}

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
