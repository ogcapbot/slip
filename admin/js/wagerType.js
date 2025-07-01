import { db } from '../firebaseInit.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { showUnitSection, updateUnitSummaryText } from './units.js'; // Adjust path accordingly

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

if (numberInputContainer) {
  numberInputContainer.style.display = 'none';
}

let requiredLabel = numberInputContainer ? numberInputContainer.querySelector('.required-label') : null;
if (!requiredLabel && numberInputContainer) {
  requiredLabel = document.createElement('div');
  requiredLabel.className = 'required-label';
  requiredLabel.textContent = '* Required';
  requiredLabel.style.color = 'red';
  requiredLabel.style.fontWeight = 'bold';
  requiredLabel.style.fontSize = '0.8em';
  requiredLabel.style.marginTop = '4px';
  requiredLabel.style.display = 'none';
  numberInputContainer.appendChild(requiredLabel);
}

const wagerTypeLabelOriginal = document.querySelector('label[for="wagerTypeSelect"]');
if (wagerTypeLabelOriginal) {
  wagerTypeLabelOriginal.style.display = 'none';
}

const wagerSectionContainer = document.createElement('div');
wagerSectionContainer.style.display = 'flex';
wagerSectionContainer.style.justifyContent = 'space-between';
wagerSectionContainer.style.alignItems = 'center';
wagerSectionContainer.style.marginBottom = '8px';
wagerSectionContainer.style.width = '100%';
wagerSectionContainer.style.maxWidth = '600px';

const wagerTypeLabelNew = document.createElement('label');
wagerTypeLabelNew.textContent = 'Choose Wager Type';
wagerTypeLabelNew.style.fontWeight = 'bold';
wagerTypeLabelNew.style.display = 'inline-block';

wagerSectionContainer.appendChild(wagerTypeLabelNew);

let numberInputTitle = document.createElement('label');
numberInputTitle.textContent = 'Number Input:';
numberInputTitle.style.fontWeight = 'bold';
numberInputTitle.style.display = 'none';
wagerSectionContainer.appendChild(numberInputTitle);

if (numberInputContainer) {
  numberInputContainer.style.margin = '0';
  numberInputContainer.style.width = '100%';
}

if (wagerTypeSelect && wagerTypeSelect.parentNode) {
  wagerTypeSelect.parentNode.insertBefore(wagerSectionContainer, wagerTypeSelect);
  wagerTypeSelect.parentNode.insertBefore(numberInputContainer, wagerTypeSelect);
} else {
  document.body.appendChild(wagerSectionContainer);
  if (numberInputContainer) {
    document.body.appendChild(numberInputContainer);
  }
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

wagerButtonsContainer.style.display = 'grid';
wagerButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
wagerButtonsContainer.style.gap = '8px 12px';
wagerButtonsContainer.style.marginTop = '8px';
wagerButtonsContainer.style.alignItems = 'center';
wagerButtonsContainer.style.width = '100%';
wagerButtonsContainer.style.maxWidth = '600px';

wagerButtonsContainer.style.display = 'none';

let selectedWagerId = null;
let changeWagerBtn = null;

function toggleWagerSection() {
  if (!wagerButtonsContainer || !pickOptionsContainer) return;
  const selectedTeamButton = pickOptionsContainer.querySelector('button.green');
  const teamSelected = !!selectedTeamButton;
  wagerButtonsContainer.style.display = teamSelected ? 'grid' : 'none';
}

if (sportSelect) {
  sportSelect.addEventListener('change', () => {
    clearWagerButtons();
    if (numberInputContainer) numberInputContainer.style.display = 'none';
    if (finalPickDescription) finalPickDescription.textContent = '';
    toggleWagerSection();
  });
}

if (gameSelect) {
  gameSelect.addEventListener('change', async () => {
    if (!gameSelect.value) {
      clearWagerButtons();
      if (wagerButtonsContainer) wagerButtonsContainer.textContent = 'Select a game first';
      if (numberInputContainer) numberInputContainer.style.display = 'none';
      if (finalPickDescription) finalPickDescription.textContent = '';
      toggleWagerSection();
      return;
    }
    await loadWagerTypes();
    toggleWagerSection();
  });
}

if (pickOptionsContainer) {
  pickOptionsContainer.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
      Array.from(pickOptionsContainer.querySelectorAll('button')).forEach(btn => btn.classList.remove('green'));
      e.target.classList.add('green');
      toggleWagerSection();
    }
  });
}

function clearWagerButtons() {
  selectedWagerId = null;
  if (!wagerButtonsContainer) return;

  wagerButtonsContainer.innerHTML = '';
  wagerButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  wagerButtonsContainer.style.marginTop = '8px';

  if (numberInputContainer) numberInputContainer.style.display = 'none';
  if (finalPickDescription) finalPickDescription.textContent = '';

  if (numberInput) numberInput.value = '';
  if (requiredLabel) requiredLabel.style.display = 'none';
  if (numberInputTitle) numberInputTitle.style.display = 'none';

  if (changeWagerBtn) {
    changeWagerBtn.remove();
    changeWagerBtn = null;
  }
  if (wagerTypeSelect) {
    wagerTypeSelect.innerHTML = '<option value="" disabled selected>Choose wager type</option>';
    wagerTypeSelect.disabled = true;
    wagerTypeSelect.dispatchEvent(new Event('change'));
  }
}

async function loadWagerTypes() {
  if (!wagerButtonsContainer) return;
  const selectedSport = sportSelect ? sportSelect.value : '';

  const selectedTeamButton = pickOptionsContainer ? pickOptionsContainer.querySelector('button.green') : null;
  if (!selectedTeamButton) {
    clearWagerButtons();
  }

  wagerButtonsContainer.textContent = 'Loading wager types...';
  if (numberInputContainer) numberInputContainer.style.display = 'none';
  if (finalPickDescription) finalPickDescription.textContent = '';

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

    wagerTypes.forEach(wt => {
      const btn = createWagerButton(wt.id, wt.wager_label_template || 'Unknown', wt.pick_desc_template || '');
      wagerButtonsContainer.appendChild(btn);
    });

  } catch (error) {
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

  if (!wagerButtonsContainer) return;

  wagerButtonsContainer.innerHTML = '';

  wagerButtonsContainer.style.display = 'grid';
  wagerButtonsContainer.style.gridTemplateColumns = '1fr 150px 1fr';
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
    if (numberInputContainer) numberInputContainer.style.display = 'block';
    if (numberInputContainer) numberInputContainer.style.gridColumn = '2 / 3';
    if (numberInputContainer) numberInputContainer.style.maxWidth = '150px';
    if (requiredLabel) requiredLabel.style.display = 'block';
    if (requiredLabel) requiredLabel.style.marginTop = '4px';
    if (numberInputTitle) numberInputTitle.style.display = 'inline-block';

    if (numberInput) numberInput.value = '0';

    const btnHeight = selectedBtn.getBoundingClientRect().height;
    if (numberInput) {
      numberInput.style.height = btnHeight + 'px';
      numberInput.style.marginLeft = '6px';
      numberInput.style.marginRight = '6px';
      numberInput.focus();
      numberInput.select();
    }

    if (wagerButtonsContainer && numberInputContainer) wagerButtonsContainer.appendChild(numberInputContainer);
  } else {
    if (numberInputContainer) numberInputContainer.style.display = 'none';
    if (requiredLabel) requiredLabel.style.display = 'none';
    if (numberInputTitle) numberInputTitle.style.display = 'none';
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
  if (wagerButtonsContainer) wagerButtonsContainer.appendChild(changeWagerBtn);

  updateFinalPickDescription(descTemplate);

  if (numberInput) numberInput.disabled = !descTemplate.includes('[[NUM]]');
  if (!descTemplate.includes('[[NUM]]') && numberInput) {
    numberInput.value = '';
  }

  if (wagerTypeSelect) {
    wagerTypeSelect.innerHTML = '';
    const option = document.createElement('option');
    option.value = id;
    option.selected = true;
    wagerTypeSelect.appendChild(option);
    wagerTypeSelect.disabled = true;
    wagerTypeSelect.dispatchEvent(new Event('change'));
  }

  // Sync explanatory text with units line:
  updateUnitSummaryText();

  // Show unit selection area after wager chosen
  showUnitSection();
}

function resetWagerSelection() {
  selectedWagerId = null;

  if (changeWagerBtn) {
    changeWagerBtn.remove();
    changeWagerBtn = null;
  }

  if (wagerTypeSelect) {
   // wagerTypeSelect.innerHTML = '<option value="" disabled selected>Choose wager type</option>';
    wagerTypeSelect.disabled = true;
    wagerTypeSelect.dispatchEvent(new Event('change'));
  }

  if (!wagerButtonsContainer) return;

  wagerButtonsContainer.innerHTML = '';
  wagerButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  wagerButtonsContainer.style.marginTop = '8px';

  if (numberInputContainer) numberInputContainer.style.display = 'none';
  if (finalPickDescription) finalPickDescription.textContent = '';
  if (numberInput) numberInput.value = '';
  if (requiredLabel) requiredLabel.style.display = 'none';
  if (numberInputTitle) numberInputTitle.style.display = 'none';
}

if (numberInput) {
  numberInput.addEventListener('input', () => {
    if (!selectedWagerId) return;
    if (!wagerButtonsContainer) return;

    const selectedBtn = wagerButtonsContainer.querySelector('button.green');
    if (!selectedBtn) return;
    const descTemplate = selectedBtn.dataset.descTemplate || '';
    const selectedTeamButton = pickOptionsContainer ? pickOptionsContainer.querySelector('button.green') : null;
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
    if (finalPickDescription) finalPickDescription.textContent = desc;

    // Sync explanatory text with units line on number input change
    updateUnitSummaryText();
  });
}

function getLastWord(teamName) {
  if (!teamName) return '';
  const words = teamName.trim().split(' ');
  return words[words.length - 1];
}

function updateFinalPickDescription(descTemplate) {
  const selectedTeamButton = pickOptionsContainer ? pickOptionsContainer.querySelector('button.green') : null;
  const selectedTeam = selectedTeamButton ? selectedTeamButton.textContent.trim() : '';

  let desc = descTemplate;
  if (desc.includes('[[TEAM]]')) {
    const teamName = getLastWord(selectedTeam);
    desc = desc.replace(/\[\[TEAM\]\]/g, teamName);
  }
  if (desc.includes('[[NUM]]')) {
    desc = desc.replace(/\[\[NUM\]\]/g, '___');
  }
  if (finalPickDescription) finalPickDescription.textContent = desc;

  // Sync explanatory text with units line
  updateUnitSummaryText();
}

export default {};
