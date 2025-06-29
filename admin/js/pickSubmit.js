import { db } from '../firebaseInit.js';
import { collection, doc, getDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getNotesData, resetNotes } from '/admin/js/notesSection.js';  // Import notes getter + resetter if exists

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

// Add this function to fully reset all selections and UI to initial sports-only state
function resetAllSelections() {
  // Clear error/success messages
  pickError.textContent = '';
  pickSuccess.textContent = '';

  // Reset selects to initial state
  sportSelect.value = '';
  leagueSelect.innerHTML = '<option value="">Select a sport first</option>';
  leagueSelect.disabled = true;
  gameSelect.innerHTML = '<option value="">Select a league first</option>';
  gameSelect.disabled = true;
  wagerTypeSelect.innerHTML = '<option value="">Select a game first</option>';
  wagerTypeSelect.disabled = true;
  unitsSelect.innerHTML = '<option value="" disabled selected>Select a unit</option>';
  unitsSelect.disabled = true;

  // Clear pick options buttons and final pick description
  pickOptionsContainer.innerHTML = '';
  finalPickDescription.textContent = '';

  // Reset number input and container
  numberInput.value = '';
  numberInput.disabled = true;
  numberInputContainer.style.display = 'none';

  // Clear green selection highlights in pick options
  pickOptionsContainer.querySelectorAll('button.green').forEach(btn => btn.classList.remove('green'));

  // Reset notes section if you have a reset function exported
  if (typeof resetNotes === 'function') {
    resetNotes();
  }

  // If you have a function to load/show sports buttons, call it here
  // For example: loadSportsButtons();
  // If you don’t have one, you can trigger the sportSelect UI or build those buttons here.

  // Enable sportSelect so user can start fresh
  sportSelect.disabled = false;
}

// Main submit event listener
pickForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  pickError.textContent = '';
  pickSuccess.textContent = '';

  submitBtn.disabled = true; // Prevent double submits

  const sport = sportSelect.value;
  const league = leagueSelect.value;
  const gameId = gameSelect.value;
  const wagerTypeId = wagerTypeSelect.value;
  const unit = unitsSelect.value;

  const selectedPickButton = pickOptionsContainer.querySelector('button.green');
  const pickText = selectedPickButton ? selectedPickButton.textContent.trim() : '';

  const wagerNum = numberInput && !numberInput.disabled ? Number(numberInput.value) : null;

  // Get notes data from notesSection.js
  const notes = getNotesData() || '';

  // Validation
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
    // Fetch game data
    const gameDocRef = doc(db, 'GameCache', gameId);
    const gameDocSnap = await getDoc(gameDocRef);
    if (!gameDocSnap.exists()) {
      return (pickError.textContent = 'Selected game data not found.', submitBtn.disabled = false);
    }
    const gameData = gameDocSnap.data();

    // Fetch wager type data
    const wagerTypeDocRef = doc(db, 'WagerTypes', wagerTypeId);
    const wagerTypeDocSnap = await getDoc(wagerTypeDocRef);
    if (!wagerTypeDocSnap.exists()) {
      return (pickError.textContent = 'Selected wager type data not found.', submitBtn.disabled = false);
    }
    const wagerTypeData = wagerTypeDocSnap.data();

    // Build wager description
    let wagerDesc = wagerTypeData.pick_desc_template || '';
    const pickLastWord = pickText.split(' ').slice(-1)[0];
    if (wagerDesc.includes('[[TEAM]]')) {
      wagerDesc = wagerDesc.replace(/\[\[TEAM\]\]/g, pickLastWord);
    }
    if (wagerDesc.includes('[[NUM]]')) {
      wagerDesc = wagerDesc.replace(/\[\[NUM\]\]/g, wagerNum !== null ? wagerNum : '___');
    }

    // User info from global window.currentUser (adjust if needed)
    const userAccessCode = window.currentUser?.AccessCode || null;
    const userDisplayName = window.currentUser?.DisplayName || null;

    // Compose submission document
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

    // Reset all selections and UI to initial state
    resetAllSelections();

  } catch (err) {
    console.error('Error submitting pick:', err);
    pickError.textContent = 'Error submitting pick. Please try again.';
  } finally {
    submitBtn.disabled = false; // Re-enable submit button
  }
});
