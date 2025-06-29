import { db } from '../firebaseInit.js';
import { collection, doc, getDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getNotesData, reset as resetNotes } from '/admin/js/notesSection.js';

const pickForm = document.getElementById('pickForm');
const sportSelect = document.getElementById('sportSelect');
const leagueSelect = document.getElementById('leagueSelect');
const gameSelect = document.getElementById('gameSelect');
const pickOptionsContainer = document.getElementById('pickOptionsContainer');
const wagerTypeSelect = document.getElementById('wagerTypeSelect');
const numberInput = document.getElementById('numberInput');
const unitsSelect = document.getElementById('unitsSelect');
const pickError = document.getElementById('pickError');
const pickSuccess = document.getElementById('pickSuccess');
const finalPickDescription = document.getElementById('finalPickDescription');
const numberInputContainer = document.getElementById('numberInputContainer');
const submitBtn = pickForm.querySelector('button[type="submit"]');

// Create container for action buttons (Start Over and Submit)
let actionButtonsContainer = document.getElementById('actionButtonsContainer');
if (!actionButtonsContainer) {
  actionButtonsContainer = document.createElement('div');
  actionButtonsContainer.id = 'actionButtonsContainer';
  actionButtonsContainer.style.display = 'grid';
  actionButtonsContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
  actionButtonsContainer.style.gap = '8px';
  actionButtonsContainer.style.marginTop = '16px';

  // Insert after the submit button or form
  if (submitBtn && submitBtn.parentNode) {
    submitBtn.parentNode.insertBefore(actionButtonsContainer, submitBtn);
  } else {
    pickForm.appendChild(actionButtonsContainer);
  }
}

// Create Start Over button
let startOverBtn = document.getElementById('startOverBtn');
if (!startOverBtn) {
  startOverBtn = document.createElement('button');
  startOverBtn.id = 'startOverBtn';
  startOverBtn.type = 'button';
  startOverBtn.textContent = 'Start Over';
  startOverBtn.className = 'pick-btn blue';
  actionButtonsContainer.appendChild(startOverBtn);
} else {
  actionButtonsContainer.appendChild(startOverBtn);
}

// Move submit button into third column
actionButtonsContainer.appendChild(submitBtn);

// Style buttons to match others
function styleButtons() {
  const buttons = actionButtonsContainer.querySelectorAll('button.pick-btn');
  buttons.forEach(btn => {
    btn.style.padding = '6px';
    btn.style.fontSize = '1rem';
    btn.style.border = 'none';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';
    btn.style.width = '100%';
    btn.style.boxSizing = 'border-box';
    btn.style.whiteSpace = 'normal';
    btn.style.display = 'flex';
    btn.style.justifyContent = 'center';
    btn.style.alignItems = 'center';
    btn.style.minHeight = '44px';
    btn.style.transition = 'background-color 0.3s ease, box-shadow 0.2s ease';
  });

  // Start Over button: blue style
  startOverBtn.style.backgroundColor = '#4a90e2';
  startOverBtn.style.color = '#fff';
  startOverBtn.onmouseover = () => {
    if (!startOverBtn.disabled) startOverBtn.style.backgroundColor = '#357ABD';
  };
  startOverBtn.onmouseout = () => {
    if (!startOverBtn.disabled) startOverBtn.style.backgroundColor = '#4a90e2';
  };

  // Submit button: light red when disabled, green when enabled
  submitBtn.style.backgroundColor = '#d9534f'; // deeper red default disabled
  submitBtn.style.color = '#fff';
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.7';
  submitBtn.style.cursor = 'not-allowed';

  submitBtn.onmouseover = () => {
    if (!submitBtn.disabled) submitBtn.style.backgroundColor = '#4caf50';
  };
  submitBtn.onmouseout = () => {
    if (!submitBtn.disabled) submitBtn.style.backgroundColor = '#4caf50';
    else submitBtn.style.backgroundColor = '#d9534f';
  };
}
styleButtons();

// Enable/disable submit button and toggle colors based on form validity
function checkFormValidity() {
  const sport = sportSelect.value;
  const league = leagueSelect.value;
  const gameId = gameSelect.value;
  const wagerTypeId = wagerTypeSelect.value;
  const unit = unitsSelect.value;
  const selectedPickButton = pickOptionsContainer.querySelector('button.green');
  const pickText = selectedPickButton ? selectedPickButton.textContent.trim() : '';
  const wagerNumValid = !numberInput.disabled && numberInput.value.trim() !== '' && !isNaN(Number(numberInput.value));

  const valid = sport && league && gameId && wagerTypeId && unit && pickText && (numberInput.disabled || wagerNumValid);

  if (valid) {
    submitBtn.disabled = false;
    submitBtn.style.backgroundColor = '#4caf50'; // green
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
  } else {
    submitBtn.disabled = true;
    submitBtn.style.backgroundColor = '#d9534f'; // deeper red
    submitBtn.style.opacity = '0.7';
    submitBtn.style.cursor = 'not-allowed';
  }
}

// Add event listeners to trigger validation check
const elementsToWatch = [sportSelect, leagueSelect, gameSelect, wagerTypeSelect, unitsSelect, numberInput];
elementsToWatch.forEach(el => {
  if (!el) return;
  el.addEventListener('change', checkFormValidity);
  if (el.tagName === 'INPUT') {
    el.addEventListener('input', checkFormValidity);
  }
});

pickOptionsContainer.addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON' && e.target.classList.contains('pick-btn')) {
    setTimeout(checkFormValidity, 10);
  }
});

// Start Over button clears all selections & resets form
startOverBtn.addEventListener('click', () => {
  pickError.textContent = '';
  pickSuccess.textContent = '';

  sportSelect.value = '';
  leagueSelect.innerHTML = '<option value="">Select a sport first</option>';
  leagueSelect.disabled = true;
  gameSelect.innerHTML = '<option value="">Select a league first</option>';
  gameSelect.disabled = true;
  wagerTypeSelect.innerHTML = '<option value="">Select a game first</option>';
  wagerTypeSelect.disabled = true;
  unitsSelect.innerHTML = '<option value="" disabled selected>Select a unit</option>';
  unitsSelect.disabled = true;

  pickOptionsContainer.innerHTML = '';
  finalPickDescription.textContent = '';

  numberInput.value = '';
  numberInput.disabled = true;
  numberInputContainer.style.display = 'none';

  pickOptionsContainer.querySelectorAll('button.green').forEach(btn => btn.classList.remove('green'));

  if (typeof resetNotes === 'function') {
    resetNotes();
  }

  sportSelect.disabled = false;

  // Disable submit button and reset styling
  submitBtn.disabled = true;
  submitBtn.style.backgroundColor = '#d9534f';
  submitBtn.style.opacity = '0.7';
  submitBtn.style.cursor = 'not-allowed';

  checkFormValidity();
});

function resetAllSelections() {
  pickError.textContent = '';
  pickSuccess.textContent = '';

  sportSelect.value = '';
  leagueSelect.innerHTML = '<option value="">Select a sport first</option>';
  leagueSelect.disabled = true;
  gameSelect.innerHTML = '<option value="">Select a league first</option>';
  gameSelect.disabled = true;
  wagerTypeSelect.innerHTML = '<option value="">Select a game first</option>';
  wagerTypeSelect.disabled = true;
  unitsSelect.innerHTML = '<option value="" disabled selected>Select a unit</option>';
  unitsSelect.disabled = true;

  pickOptionsContainer.innerHTML = '';
  finalPickDescription.textContent = '';

  numberInput.value = '';
  numberInput.disabled = true;
  numberInputContainer.style.display = 'none';

  pickOptionsContainer.querySelectorAll('button.green').forEach(btn => btn.classList.remove('green'));

  if (typeof resetNotes === 'function') {
    resetNotes();
  }

  sportSelect.disabled = false;

  submitBtn.disabled = true;
  submitBtn.style.backgroundColor = '#d9534f';
  submitBtn.style.opacity = '0.7';
  submitBtn.style.cursor = 'not-allowed';

  // Optional: call your function here to reload sports buttons if you have one
  // e.g., loadSportsButtons();
}

pickForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  pickError.textContent = '';
  pickSuccess.textContent = '';

  submitBtn.disabled = true;

  const sport = sportSelect.value;
  const league = leagueSelect.value;
  const gameId = gameSelect.value;
  const wagerTypeId = wagerTypeSelect.value;
  const unit = unitsSelect.value;

  const selectedPickButton = pickOptionsContainer.querySelector('button.green');
  const pickText = selectedPickButton ? selectedPickButton.textContent.trim() : '';

  const wagerNum = numberInput && !numberInput.disabled ? Number(numberInput.value) : null;

  const notes = getNotesData() || '';

  if (!sport) return (pickError.textContent = 'Please select a sport.', submitBtn.disabled = false);
  if (!league) return (pickError.textContent = 'Please select a league.', submitBtn.disabled = false);
  if (!gameId) return (pickError.textContent = 'Please select a game.', submitBtn.disabled = false);
  if (!pickText) return (pickError.textContent = 'Please make your pick by selecting a team.', submitBtn.disabled = false);
  if (!wagerTypeId) return (pickError.textContent = 'Please select a wager type.', submitBtn.disabled = false);
  if (numberInput && !numberInput.disabled && (wagerNum === null || isNaN(wagerNum))) {
    return (pickError.textContent = 'Please enter a valid number for the wager.', submitBtn.disabled = false);
  }
  if (!unit) return (pickError.textContent = 'Please select a unit.', submitBtn.disabled = false);

  try {
    const gameDocRef = doc(db, 'GameCache', gameId);
    const gameDocSnap = await getDoc(gameDocRef);
    if (!gameDocSnap.exists()) {
      return (pickError.textContent = 'Selected game data not found.', submitBtn.disabled = false);
    }
    const gameData = gameDocSnap.data();

    const wagerTypeDocRef = doc(db, 'WagerTypes', wagerTypeId);
    const wagerTypeDocSnap = await getDoc(wagerTypeDocRef);
    if (!wagerTypeDocSnap.exists()) {
      return (pickError.textContent = 'Selected wager type data not found.', submitBtn.disabled = false);
    }
    const wagerTypeData = wagerTypeDocSnap.data();

    let wagerDesc = wagerTypeData.pick_desc_template || '';
    const pickLastWord = pickText.split(' ').slice(-1)[0];
    if (wagerDesc.includes('[[TEAM]]')) {
      wagerDesc = wagerDesc.replace(/\[\[TEAM\]\]/g, pickLastWord);
    }
    if (wagerDesc.includes('[[NUM]]')) {
      wagerDesc = wagerDesc.replace(/\[\[NUM\]\]/g, wagerNum !== null ? wagerNum : '___');
    }

    const userAccessCode = window.currentUser?.AccessCode || null;
    const userDisplayName = window.currentUser?.DisplayName || null;

    const submissionDoc = {
      userAccessCode,
      userDisplayName,
      timestampSubmitted: serverTimestamp(),
      timestampStatusUpdated: null,
      statusUpdatedBy: null,
      sport,
      league,
      gameId,
      gameWinLossDraw: null,
      pick: pickText,
      wagerTypeId,
      wagerTypeDesc: wagerDesc,
      wagerNum,
      unit,
      notes,
      originalGameSnapshot: {
        HomeTeam: gameData.HomeTeam || null,
        AwayTeam: gameData.AwayTeam || null,
        StartTimeUTC: gameData.StartTimeUTC || null,
        location: gameData.location || null,
        status: gameData.status || null,
      },
      originalWagerTypeSnapshot: wagerTypeData,
    };

    await addDoc(collection(db, 'OfficialPicks'), submissionDoc);

    pickSuccess.textContent = 'Pick submitted successfully!';
    pickForm.reset();

    resetAllSelections();

  } catch (err) {
    console.error('Error submitting pick:', err);
    pickError.textContent = 'Error submitting pick. Please try again.';
  } finally {
    submitBtn.disabled = false;
  }
});
