// admin/js/pickSubmit.js
import { db } from '../firebaseInit.js';
import { collection, doc, getDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getNotesData, reset as resetNotes, checkEnableSubmit } from '/admin/js/notesSection.js';

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

let actionButtonsContainer = document.getElementById('actionButtonsContainer');
if (!actionButtonsContainer) {
  actionButtonsContainer = document.createElement('div');
  actionButtonsContainer.id = 'actionButtonsContainer';
  pickForm.appendChild(actionButtonsContainer);
}

let startOverBtn = document.getElementById('startOverBtn');
if (!startOverBtn) {
  startOverBtn = document.createElement('button');
  startOverBtn.id = 'startOverBtn';
  startOverBtn.type = 'button';
  startOverBtn.textContent = 'Start Over';
  startOverBtn.className = 'pick-btn blue';
  actionButtonsContainer.appendChild(startOverBtn);
} else {
  if (startOverBtn.parentNode !== actionButtonsContainer) {
    actionButtonsContainer.appendChild(startOverBtn);
  }
}

actionButtonsContainer.appendChild(submitBtn);
submitBtn.classList.add('pick-btn', 'red');
submitBtn.disabled = true;

function isFormValid() {
  const sport = sportSelect.value;
  const league = leagueSelect.value;
  const gameId = gameSelect.value;
  const wagerTypeId = wagerTypeSelect.value;
  const unit = unitsSelect.value;
  const selectedPickButton = pickOptionsContainer.querySelector('button.green');
  const pickText = selectedPickButton ? selectedPickButton.textContent.trim() : '';
  const wagerNumValid = !numberInput.disabled && numberInput.value.trim() !== '' && !isNaN(Number(numberInput.value));

  // Include phrase selector check
  const phraseSelected = window.phraseSelector?.isPhraseSelected() || false;

  return sport && league && gameId && wagerTypeId && unit && pickText && (numberInput.disabled || wagerNumValid) && phraseSelected;
}

function updateSubmitButtonState() {
  if (isFormValid()) {
    submitBtn.disabled = false;
    submitBtn.classList.add('enabled');
  } else {
    submitBtn.disabled = true;
    submitBtn.classList.remove('enabled');
  }
}

const watchedElements = [sportSelect, leagueSelect, gameSelect, wagerTypeSelect, unitsSelect, numberInput];
watchedElements.forEach(el => {
  if (!el) return;
  el.addEventListener('change', updateSubmitButtonState);
  if (el.tagName === 'INPUT') {
    el.addEventListener('input', updateSubmitButtonState);
  }
});
pickOptionsContainer.addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON' && e.target.classList.contains('pick-btn')) {
    setTimeout(updateSubmitButtonState, 10);
  }
});

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

  if (window.phraseSelector && typeof window.phraseSelector.reset === 'function') {
    window.phraseSelector.reset();
  }

  sportSelect.disabled = false;

  updateSubmitButtonState();
});

updateSubmitButtonState();

pickForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  pickError.textContent = '';
  pickSuccess.textContent = '';

  submitBtn.disabled = true;
  submitBtn.classList.remove('enabled');

  const sport = sportSelect.value;
  const league = leagueSelect.value;
  const gameId = gameSelect.value;
  const wagerTypeId = wagerTypeSelect.value;
  const unit = unitsSelect.value;

  const selectedPickButton = pickOptionsContainer.querySelector('button.green');
  const pickText = selectedPickButton ? selectedPickButton.textContent.trim() : '';

  const wagerNum = numberInput && !numberInput.disabled ? Number(numberInput.value) : null;

  const notes = getNotesData() || '';

  // Phrase data from phrase selector
  const selectedPhrase = window.phraseSelector?.getSelectedPhrase() || null;
  const selectedPhraseType = window.phraseSelector?.getSelectedType() || null;

  if (!sport) return (pickError.textContent = 'Please select a sport.', updateSubmitButtonState());
  if (!league) return (pickError.textContent = 'Please select a league.', updateSubmitButtonState());
  if (!gameId) return (pickError.textContent = 'Please select a game.', updateSubmitButtonState());
  if (!pickText) return (pickError.textContent = 'Please make your pick by selecting a team.', updateSubmitButtonState());
  if (!wagerTypeId) return (pickError.textContent = 'Please select a wager type.', updateSubmitButtonState());
  if (numberInput && !numberInput.disabled && (wagerNum === null || isNaN(wagerNum))) {
    return (pickError.textContent = 'Please enter a valid number for the wager.', updateSubmitButtonState());
  }
  if (!unit) return (pickError.textContent = 'Please select a unit.', updateSubmitButtonState());
  if (!selectedPhrase || !selectedPhraseType) return (pickError.textContent = 'Please select a hype phrase type and energy.', updateSubmitButtonState());

  try {
    const gameDocRef = doc(db, 'GameCache', gameId);
    const gameDocSnap = await getDoc(gameDocRef);
    if (!gameDocSnap.exists()) {
      return (pickError.textContent = 'Selected game data not found.', updateSubmitButtonState());
    }
    const gameData = gameDocSnap.data();

    const wagerTypeDocRef = doc(db, 'WagerTypes', wagerTypeId);
    const wagerTypeDocSnap = await getDoc(wagerTypeDocRef);
    if (!wagerTypeDocSnap.exists()) {
      return (pickError.textContent = 'Selected wager type data not found.', updateSubmitButtonState());
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
      phraseType: selectedPhraseType,
      phraseEnergy: selectedPhrase.Energy,
      phraseEnergyDescription: selectedPhrase.EnergyDescription || '',
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

    startOverBtn.click();

  } catch (err) {
    console.error('Error submitting pick:', err);
    pickError.textContent = 'Error submitting pick. Please try again.';
    updateSubmitButtonState();
  }
});
