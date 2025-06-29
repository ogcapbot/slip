// pickSubmit.js
import { db } from '../firebaseInit.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const pickForm = document.getElementById('pickForm');
const sportSelect = document.getElementById('sportSelect');
const leagueSelect = document.getElementById('leagueSelect');
const gameSelect = document.getElementById('gameSelect');
const wagerTypeSelect = document.getElementById('wagerTypeSelect');
const numberInput = document.getElementById('numberInput');
const unitsSelect = document.getElementById('unitsSelect');
const pickOptionsContainer = document.getElementById('pickOptionsContainer');
const pickError = document.getElementById('pickError');
const pickSuccess = document.getElementById('pickSuccess');

pickForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  pickError.textContent = '';
  pickSuccess.textContent = '';

  const sport = sportSelect.value;
  const league = leagueSelect.value;
  const gameId = gameSelect.value;
  const wagerTypeId = wagerTypeSelect.value;
  const unit = unitsSelect.value;

  // Get selected pick text from pickOptionsContainer (the green button)
  const selectedTeamButton = pickOptionsContainer.querySelector('button.green');
  const pickText = selectedTeamButton ? selectedTeamButton.textContent.trim() : '';

  const numberValue = numberInput.value.trim();

  // Validate inputs
  if (!sport) {
    pickError.textContent = 'Please select a sport.';
    return;
  }
  if (!league) {
    pickError.textContent = 'Please select a league.';
    return;
  }
  if (!gameId) {
    pickError.textContent = 'Please select a game.';
    return;
  }
  if (!wagerTypeId) {
    pickError.textContent = 'Please select a wager type.';
    return;
  }
  if (!pickText) {
    pickError.textContent = 'Please select your pick.';
    return;
  }
  if (numberInput.style.display !== 'none' && numberValue === '') {
    pickError.textContent = 'Please enter a number for the wager.';
    return;
  }
  if (!unit) {
    pickError.textContent = 'Please select a unit.';
    return;
  }

  try {
    // Add pick document to Picks collection
    await addDoc(collection(db, 'Picks'), {
      sport,
      league,
      gameId,
      wagerTypeId,
      pick: pickText,
      numberValue: numberValue || null,
      unit,
      timestamp: serverTimestamp(),
      // Add user info if you keep current user globally
      userAccessCode: window.currentUser?.AccessCode || null,
      userDisplayName: window.currentUser?.DisplayName || null,
    });

    pickSuccess.textContent = 'Pick submitted successfully!';
    pickForm.reset();

    // Reset dependent fields
    pickOptionsContainer.innerHTML = '';
    wagerTypeSelect.disabled = true;
    unitsSelect.disabled = true;
    numberInput.value = '';
    numberInput.style.display = 'none';

  } catch (err) {
    console.error('Error submitting pick:', err);
    pickError.textContent = 'Error submitting pick. Please try again.';
  }
});
