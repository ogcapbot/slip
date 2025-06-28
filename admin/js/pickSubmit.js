// pickSubmit.js
import { db } from '../firebaseInit.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const pickForm = document.getElementById('pickForm');
const sportSelect = document.getElementById('sportSelect');
const gameSelect = document.getElementById('gameSelect');
const pickInput = document.getElementById('pickInput');
const pickError = document.getElementById('pickError');
const pickSuccess = document.getElementById('pickSuccess');

// Assuming currentUser info is stored globally in window.currentUser
pickForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  pickError.textContent = '';
  pickSuccess.textContent = '';

  const sport = sportSelect.value;
  const gameId = gameSelect.value;
  const pickText = pickInput.value.trim();

  if (!sport) {
    pickError.textContent = 'Please select a sport.';
    return;
  }
  if (!gameId) {
    pickError.textContent = 'Please select a game.';
    return;
  }
  if (!pickText) {
    pickError.textContent = 'Please enter your pick.';
    return;
  }

  try {
    await addDoc(collection(db, 'Picks'), {
      sport,
      gameId,
      pick: pickText,
      timestamp: serverTimestamp(),
      // User info - make sure window.currentUser is set on login!
      userAccessCode: window.currentUser?.AccessCode || null,
      userDisplayName: window.currentUser?.['Display Name'] || null,
    });

    pickSuccess.textContent = 'Pick submitted successfully!';
    pickForm.reset();
    // Optionally, reset game dropdown and disable inputs until new selections
    gameSelect.innerHTML = '<option value="">Select a sport first</option>';
    gameSelect.disabled = true;
    pickInput.disabled = true;
    pickForm.querySelector('button[type="submit"]').disabled = true;

  } catch (err) {
    console.error('Error submitting pick:', err);
    pickError.textContent = 'Error submitting pick. Try again.';
  }
});
