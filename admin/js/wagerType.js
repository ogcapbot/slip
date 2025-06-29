// wagerType.js
import { db } from '../firebaseInit.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadUnits } from './units.js';

const sportSelect = document.getElementById('sportSelect');
const wagerTypeSelect = document.getElementById('wagerTypeSelect');
const numberInputContainer = document.getElementById('numberInputContainer');
const numberInput = document.getElementById('numberInput');
const finalPickDescription = document.getElementById('finalPickDescription');
const pickOptionsContainer = document.getElementById('pickOptionsContainer'); // To get team buttons
const gameSelect = document.getElementById('gameSelect'); // added here since it listens

// Utility to get last word of a team name
function getLastWord(teamName) {
  if (!teamName) return '';
  const words = teamName.trim().split(' ');
  return words[words.length - 1];
}

// Reset wagerType dropdown on sport change
sportSelect.addEventListener('change', () => {
  wagerTypeSelect.innerHTML = '<option>Select a sport first</option>';
  wagerTypeSelect.disabled = true;
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';
});

// Enable wagerType load on game selection change
gameSelect.addEventListener('change', async () => {
  if (!gameSelect.value) {
    wagerTypeSelect.disabled = true;
    wagerTypeSelect.innerHTML = '<option>Select a game first</option>';
    numberInputContainer.style.display = 'none';
    finalPickDescription.textContent = '';
    return;
  }
  await loadWagerTypes();
});

// Load wager types filtered by sport or 'All'
async function loadWagerTypes() {
  const selectedSport = sportSelect.value;
  wagerTypeSelect.disabled = true;
  wagerTypeSelect.innerHTML = '<option>Loading wager types...</option>';
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';

  try {
    // Firestore does NOT support multiple where on same field combined by OR.
    // So we query for 'All' first, then for selectedSport, then merge results.
    const wagerTypesRef = collection(db, 'WagerTypes');

    const qAll = query(wagerTypesRef, where('active_status', '==', 'active'), where('Sport', '==', 'All'), orderBy('id'));
    const qSport = query(wagerTypesRef, where('active_status', '==', 'active'), where('Sport', '==', selectedSport), orderBy('id'));

    const [allSnap, sportSnap] = await Promise.all([getDocs(qAll), getDocs(qSport)]);

    const wagerTypesMap = new Map();

    allSnap.forEach(doc => wagerTypesMap.set(doc.id, doc.data()));
    sportSnap.forEach(doc => wagerTypesMap.set(doc.id, doc.data()));

    const wagerTypes = Array.from(wagerTypesMap.values());

    if (wagerTypes.length === 0) {
      wagerTypeSelect.innerHTML = '<option>No wager types found</option>';
      wagerTypeSelect.disabled = true;
      return;
    }

    wagerTypeSelect.innerHTML = '<option value="" disabled selected>Choose wager type</option>';
    wagerTypes.forEach(wt => {
      const option = document.createElement('option');
      option.value = wt.id; // Use id for selection
      option.textContent = wt.wager_label_template || 'Unknown';
      option.dataset.descTemplate = wt.pick_desc_template || '';
      wagerTypeSelect.appendChild(option);
    });

    wagerTypeSelect.disabled = false;
  } catch (error) {
    console.error('Error loading wager types:', error);
    wagerTypeSelect.innerHTML = '<option>Error loading wager types</option>';
    wagerTypeSelect.disabled = true;
  }
}

// Update pick description and number input visibility on wagerType change
wagerTypeSelect.addEventListener('change', () => {
  const selectedOption = wagerTypeSelect.options[wagerTypeSelect.selectedIndex];
  const descTemplate = selectedOption?.dataset.descTemplate || '';
  finalPickDescription.textContent = '';
  numberInputContainer.style.display = 'none';
  numberInput.value = '';

  // Get selected team button text
  const selectedTeamButton = pickOptionsContainer.querySelector('button.green');
  const selectedTeam = selectedTeamButton ? selectedTeamButton.textContent.trim() : '';

  // Replace [[TEAM]] with last word of selected team
  let desc = descTemplate;
  if (desc.includes('[[TEAM]]')) {
    const teamName = getLastWord(selectedTeam);
    desc = desc.replace(/\[\[TEAM\]\]/g, teamName);
  }

  if (desc.includes('[[NUM]]')) {
    numberInputContainer.style.display = 'block';
    finalPickDescription.textContent = desc.replace(/\[\[NUM\]\]/g, '___');
  } else {
    finalPickDescription.textContent = desc;
  }

  // Enable or disable number input accordingly
  numberInput.disabled = !desc.includes('[[NUM]]');
  if (!desc.includes('[[NUM]]')) {
    numberInput.value = '';
  }

  // Load Units dropdown after wager type selection
  loadUnits();
});

// Update final description live when number input changes
numberInput.addEventListener('input', () => {
  const selectedOption = wagerTypeSelect.options[wagerTypeSelect.selectedIndex];
  if (!selectedOption) return;
  const descTemplate = selectedOption.dataset.descTemplate || '';
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
