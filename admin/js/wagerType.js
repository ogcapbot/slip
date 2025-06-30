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

// Hide number input container initially (so it doesn't show outside grid)
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
  requiredLabel.style.display = 'none'; // hidden initially
  numberInputContainer.appendChild(requiredLabel);
}

let wagerButtonsContainer = document.getElementById('wagerButtonsContainer');
if (!wagerButtonsContainer) {
  wagerButtonsContainer = document.createElement('div');
  wagerButtonsContainer.id = 'wagerButtonsContainer';

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

sportSelect.addEventListener('change', () => {
  clearWagerButtons();
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';
});

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

function clearWagerButtons() {
  selectedWagerId = null;
  wagerButtonsContainer.innerHTML = '';
  wagerButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';  // reset to 3 col grid default
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';
  numberInput.value = '';
  requiredLabel.style.display = 'none';
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

    wagerButtonsContainer.style.display = 'grid';
    wagerButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    wagerButtonsContainer.style.gridAutoRows = 'min-content';
    wagerButtonsContainer.style.gap = '4px 6px';
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

  wagerButtonsContainer.innerHTML = '';

  // Set container to 3-column grid to place wager, input, change btn side-by-side
  wagerButtonsContainer.style.display = 'grid';
  wagerButtonsContainer.style.gridTemplateColumns = '1fr auto 1fr';
  wagerButtonsContainer.style.gridAutoRows = 'min-content';
  wagerButtonsContainer.style.gap = '4px 6px';
  wagerButtonsContainer.style.marginTop = '8px';
  wagerButtonsContainer.style.alignItems = 'center';

  // Format label with line breaks
  const formattedLabel = formatLabelWithLineBreaks(button.textContent);

  // Selected wager button
  const selectedBtn = createWagerButton(id, formattedLabel, descTemplate);
  selectedBtn.classList.remove('blue');
  selectedBtn.classList.add('green');
  selectedBtn.style.gridColumn = '1 / 2';
  selectedBtn.innerHTML = formattedLabel;
  wagerButtonsContainer.appendChild(selectedBtn);

  // Number input
  if (descTemplate.includes('[[NUM]]')) {
    numberInputContainer.style.display = 'block';
    numberInputContainer.style.gridColumn = '2 / 3';
    numberInputContainer.style.margin = '0';
    numberInputContainer.style.width = '100%';
    numberInput.style.width = '100%';

    // Set input height to match button's computed height
    const btnHeight = selectedBtn.getBoundingClientRect().height;
    numberInput.style.height = btnHeight + 'px';

    wagerButtonsContainer.appendChild(numberInputContainer);

    // Show the required label
    requiredLabel.style.display = 'block';

    // Set default value to 0 and focus input with select
    numberInput.value = '0';
    numberInput.focus();
    numberInput.select();

  } else {
    numberInputContainer.style.display = 'none';
    requiredLabel.style.display = 'none';
  }

  // Change wager button
  if (!changeWagerBtn) {
    changeWagerBtn = document.createElement('button');
    changeWagerBtn.type = 'button';
    changeWagerBtn.textContent = 'Change Wager';
    changeWagerBtn.className = 'pick-btn blue';
    changeWagerBtn.style.minWidth = '120px';
    changeWagerBtn.style.width = '100%';
    changeWagerBtn.style.boxSizing = 'border-box';
    changeWagerBtn.style.alignSelf = 'center'; // align vertically center
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
  wagerButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';  // reset grid cols
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';
  numberInput.value = '';
  requiredLabel.style.display = 'none';
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
