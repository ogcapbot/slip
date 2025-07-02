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

// Hide submit button by default
submitBtn.style.display = 'none';
submitBtn.classList.remove('red', 'enabled');
submitBtn.disabled = true;

// Create or get container for action buttons (if needed for positioning)
let actionButtonsContainer = document.getElementById('actionButtonsContainer');
if (!actionButtonsContainer) {
  actionButtonsContainer = document.createElement('div');
  actionButtonsContainer.id = 'actionButtonsContainer';
  pickForm.appendChild(actionButtonsContainer);
}

// Move submit button inside container for consistent layout
if (submitBtn.parentNode !== actionButtonsContainer) {
  actionButtonsContainer.appendChild(submitBtn);
}

// Create a review prompt message element (hidden initially)
let reviewPrompt = document.getElementById('reviewPrompt');
if (!reviewPrompt) {
  reviewPrompt = document.createElement('div');
  reviewPrompt.id = 'reviewPrompt';
  reviewPrompt.style.color = '#444';
  reviewPrompt.style.fontWeight = '600';
  reviewPrompt.style.marginBottom = '12px';
  reviewPrompt.style.fontFamily = 'Oswald, sans-serif';
  reviewPrompt.style.display = 'none';
  actionButtonsContainer.insertBefore(reviewPrompt, submitBtn);
}

// Flag to track if phrase has been selected & added to running list
let phraseSelectedAndAdded = false;

// Function to call when phrase is selected and added to running list
export function enableSubmitAfterPhrase() {
  phraseSelectedAndAdded = true;
  reviewPrompt.textContent = 'Please double-check the data above for accuracy before submitting.';
  reviewPrompt.style.display = 'block';

  submitBtn.style.display = 'inline-block';
  submitBtn.classList.remove('red');
  submitBtn.classList.add('green', 'enabled');
  submitBtn.disabled = false;
}

// Function to reset submit button and review prompt (call on form reset)
function resetSubmitUI() {
  phraseSelectedAndAdded = false;
  reviewPrompt.style.display = 'none';
  reviewPrompt.textContent = '';

  submitBtn.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.classList.remove('green', 'enabled');
  submitBtn.classList.add('red');
}

// Form validation (allow submit only if phrase selected and valid form)
function isFormValid() {
  if (!phraseSelectedAndAdded) return false;

  const sport = sportSelect.value;
  const league = leagueSelect.value;
  const gameId = gameSelect.value;
  const wagerTypeId = wagerTypeSelect.value;
  const unit = unitsSelect.value;
  const selectedPickButton = pickOptionsContainer.querySelector('button.green');
  const pickText = selectedPickButton ? selectedPickButton.textContent.trim() : '';
  const wagerNumValid = !numberInput.disabled && numberInput.value.trim() !== '' && !isNaN(Number(numberInput.value));

  return sport && league && gameId && wagerTypeId && unit && pickText && (numberInput.disabled || wagerNumValid);
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

// Listen to relevant elements to keep submit button state updated
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

// No start over button or handler here (removed as requested)

// Initialize submit button state on load
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

  // Validate again before submit
  if (!sport) return (pickError.textContent = 'Please select a sport.', updateSubmitButtonState());
  if (!league) return (pickError.textContent = 'Please select a league.', updateSubmitButtonState());
  if (!gameId) return (pickError.textContent = 'Please select a game.', updateSubmitButtonState());
  if (!pickText) return (pickError.textContent = 'Please make your pick by selecting a team.', updateSubmitButtonState());
  if (!wagerTypeId) return (pickError.textContent = 'Please select a wager type.', updateSubmitButtonState());
  if (numberInput && !numberInput.disabled && (wagerNum === null || isNaN(wagerNum))) {
    return (pickError.textContent = 'Please enter a valid number for the wager.', updateSubmitButtonState());
  }
  if (!unit) return (pickError.textContent = 'Please select a unit.', updateSubmitButtonState());

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

    // After successful submit, clear everything & show success message
    pickSuccess.textContent = 'Your Official Pick has been successfully entered into the database.';
    pickForm.reset();

    // Hide submit button and prompt
    resetSubmitUI();

    // Clear running selections list (you may have a function for this; 
    // otherwise, clear pickOptionsContainer here)
    pickOptionsContainer.innerHTML = '';
    finalPickDescription.textContent = '';

    if (typeof resetNotes === 'function') {
      resetNotes();
    }

  } catch (err) {
    console.error('Error submitting pick:', err);
    pickError.textContent = 'Error submitting pick. Please try again.';
    updateSubmitButtonState();
  }
});
