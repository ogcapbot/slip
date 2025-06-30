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

// Hide wager section initially
wagerButtonsContainer.style.display = 'none';
numberInputContainer.style.display = 'none';
finalPickDescription.textContent = '';

let selectedWagerId = null;
let changeWagerBtn = null;

// Utility: Insert <br> before specific keywords in label
function formatLabelWithLineBreaks(label) {
  const keywords = ['OVER', 'UNDER', 'PLUS', 'MINUS'];
  let formatted = label;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\s${keyword}`, 'gi');
    formatted = formatted.replace(regex, `<br>${keyword}`);
  });
  return formatted;
}

sportSelect.addEventListener('change', () => {
  clearWagerButtons();
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';
  wagerButtonsContainer.style.display = 'none';  // hide wager buttons on sport change
});

gameSelect.addEventListener('change', async () => {
  if (!gameSelect.value) {
    clearWagerButtons();
    wagerButtonsContainer.textContent = 'Select a game first';
    numberInputContainer.style.display = 'none';
    finalPickDescription.textContent = '';
    wagerButtonsContainer.style.display = 'none';  // hide wager buttons if no game
    return;
  }
  wagerButtonsContainer.style.display = 'grid'; // show wager buttons only after game selected
  await loadWagerTypes();
});

function clearWagerButtons() {
  selectedWagerId = null;
  wagerButtonsContainer.innerHTML = '';
  wagerButtonsContainer.style.display = 'none';
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';
  numberInput.value = '';
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

  const formattedLabel = formatLabelWithLineBreaks(label);
  btn.innerHTML = formattedLabel;

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

  // Container to hold selected wager, number input, and change button inline
  const container = document.createElement('div');
  container.style.display = 'grid';
  container.style.gridTemplateColumns = '1fr auto 1fr';
  container.style.gridGap = '6px';
  container.style.marginTop = '8px';
  container.style.alignItems = 'center';

  // Selected wager button
  const selectedBtn = createWagerButton(id, button.innerHTML, descTemplate);
  selectedBtn.classList.remove('blue');
  selectedBtn.classList.add('green');
  selectedBtn.style.gridColumn = '1 / 2';
  container.appendChild(selectedBtn);

  // Number input container - show/hide based on [[NUM]]
  if (descTemplate.includes('[[NUM]]')) {
    numberInputContainer.style.display = 'block';
    numberInputContainer.style.gridColumn = '2 / 3';
    numberInputContainer.style.margin = '0';
    numberInputContainer.style.width = '100%';
    // Ensure input fits nicely
    numberInput.style.width = '100%';
    container.appendChild(numberInputContainer);
  } else {
    numberInputContainer.style.display = 'none';
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
    changeWagerBtn.style.alignSelf = 'flex-start';
    changeWagerBtn.style.marginTop = '0';
    changeWagerBtn.style.gridColumn = '3 / 4';

    changeWagerBtn.addEventListener('click', () => {
      resetWagerSelection();
    });
  }
  container.appendChild(changeWagerBtn);

  wagerButtonsContainer.appendChild(container);

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
  wagerButtonsContainer.style.display = 'none';  // hide wager section on reset
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';
  numberInput.value = '';
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
