import { db } from '../firebaseInit.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');
const wagerTypeSelect = document.getElementById('wagerTypeSelect');
const numberInputContainer = document.getElementById('numberInputContainer');
const numberInput = document.getElementById('numberInput');
const finalPickDescription = document.getElementById('finalPickDescription');
const pickOptionsContainer = document.getElementById('pickOptionsContainer'); // To get team buttons

// Utility to get last word of a team name
function getLastWord(teamName) {
  if (!teamName) return '';
  const words = teamName.trim().split(' ');
  return words[words.length - 1];
}

// Reset wagerType dropdown and number input on sport change
sportSelect.addEventListener('change', () => {
  wagerTypeSelect.innerHTML = '<option>Select a sport first</option>';
  wagerTypeSelect.disabled = true;
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';
});

// Enable wagerType and load options only when a game is selected
const gameSelect = document.getElementById('gameSelect');
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

// Load wager types from Firestore, include 'All' and selected sport wagers, sorted by id
async function loadWagerTypes() {
  const selectedSport = sportSelect.value;
  wagerTypeSelect.disabled = true;
  wagerTypeSelect.innerHTML = '<option>Loading wager types...</option>';
  numberInputContainer.style.display = 'none';
  finalPickDescription.textContent = '';

  try {
    const wagerTypesRef = collection(db, 'WagerTypes');

    // Fetch wager types with Sport='All' OR selectedSport, active_status='active', ordered by Sport and then by id ascending
    const q = query(
      wagerTypesRef,
      where('active_status', '==', 'active'),
      where('Sport', 'in', ['All', selectedSport]),
      orderBy('Sport'),
      orderBy('id')
    );
    const querySnapshot = await getDocs(q);

    const wagerTypes = [];
    querySnapshot.forEach(doc => {
      wagerTypes.push(doc.data());
    });

    if (wagerTypes.length === 0) {
      wagerTypeSelect.innerHTML = '<option>No wager types found</option>';
      wagerTypeSelect.disabled = true;
      return;
    }

    wagerTypeSelect.innerHTML = '<option value="" disabled selected>Choose wager type</option>';
    wagerTypes.forEach(wt => {
      const option = document.createElement('option');
      option.value = wt.id;
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

// On wager type selection, update description and toggle number input visibility
wagerTypeSelect.addEventListener('change', () => {
  const selectedOption = wagerTypeSelect.options[wagerTypeSelect.selectedIndex];
  const descTemplate = selectedOption?.dataset.descTemplate || '';
  finalPickDescription.textContent = '';
  numberInputContainer.style.display = 'none';
  numberInput.value = '';

  // Get selected team name from green button
  const selectedTeamButton = pickOptionsContainer.querySelector('button.green');
  const selectedTeam = selectedTeamButton ? selectedTeamButton.textContent.trim() : '';

  // Replace [[TEAM]] with last word of team name
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
});

// Live update final description on number input change
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
