// pickSubmit.js
import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";


const pickForm = document.getElementById('pickForm');
const sportSelect = document.getElementById('sportSelect');
const gameSelect = document.getElementById('gameSelect');
const pickInput = document.getElementById('pickInput');
const pickError = document.getElementById('pickError');
const pickSuccess = document.getElementById('pickSuccess');

// We'll need currentUser info from login module, import if you maintain it globally or pass it somehow.
// For now, assuming you manage currentUser globally or store in window.currentUser

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

  // Basic example of storing pick data
  try {
    await addDoc(collection(db, 'Picks'), {
      sport,
      gameId,
      pick: pickText,
      timestamp: serverTimestamp(),
      // Add user info if available
      userAccessCode: window.currentUser?.['Access Code'] || null,
      userDisplayName: window.currentUser?.['Display Name'] || null,
    });

    pickSuccess.textContent = 'Pick submitted successfully!';
    pickForm.reset();
    // Optionally, reset games dropdown
    gameSelect.innerHTML = '<option value="">Select a sport first</option>';
  } catch (err) {
    console.error('Error submitting pick:', err);
    pickError.textContent = 'Error submitting pick. Try again.';
  }
});
