// admin/js/auth.js
import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadSports } from '/admin/js/sportSelector.js';

const loginBtn = document.getElementById('loginBtn');
const accessCodeInput = document.getElementById('AccessCode');
const loginError = document.getElementById('loginError');
const loginSection = document.getElementById('loginSection');
const pickForm = document.getElementById('pickForm');

const sportSelect = document.getElementById('sportSelect');
const leagueSelect = document.getElementById('leagueSelect');
const gameSelect = document.getElementById('gameSelect');
const wagerTypeSelect = document.getElementById('wagerTypeSelect');
const unitsSelect = document.getElementById('unitsSelect');
const pickOptionsContainer = document.getElementById('pickOptionsContainer');
const wagerButtonsContainer = document.getElementById('wagerButtonsContainer');
const numberInputContainer = document.getElementById('numberInputContainer');
const notesContainer = document.getElementById('notesContainer');
const actionButtonsContainer = document.getElementById('actionButtonsContainer');
const pickError = document.getElementById('pickError');
const pickSuccess = document.getElementById('pickSuccess');

loginBtn.addEventListener('click', async () => {
  if (!accessCodeInput) {
    console.error('Access code input element not found!');
    loginError.textContent = 'Internal error: access code input missing.';
    return;
  }

  const accessCode = accessCodeInput.value?.trim();
  loginError.textContent = '';

  if (!accessCode) {
    loginError.textContent = 'Access code is required.';
    return;
  }

  try {
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('AccessCode', '==', accessCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      loginError.textContent = 'Invalid access code.';
      return;
    }

    // Successful login: Hide login, show form
    loginSection.style.display = 'none';
    pickForm.style.display = 'block';

    // Enable sport select only
    sportSelect.disabled = false;
    sportSelect.style.display = ''; // show sport select dropdown
    // Show sport buttons container if exists
    const sportButtonsContainer = document.getElementById('sportButtonsContainer');
    if (sportButtonsContainer) sportButtonsContainer.style.display = '';

    // Hide everything else at this stage:
    leagueSelect.disabled = true;
    leagueSelect.style.display = 'none';

    const leagueButtonsContainer = document.getElementById('leagueButtonsContainer');
    if (leagueButtonsContainer) leagueButtonsContainer.style.display = 'none';

    gameSelect.disabled = true;
    gameSelect.style.display = 'none';

    const gameButtonsContainer = document.getElementById('gameButtonsContainer');
    if (gameButtonsContainer) gameButtonsContainer.style.display = 'none';

    wagerTypeSelect.disabled = true;
    wagerTypeSelect.style.display = 'none';

    if (wagerButtonsContainer) wagerButtonsContainer.style.display = 'none';

    unitsSelect.disabled = true;
    unitsSelect.style.display = 'none';

    const unitButtonsContainer = document.getElementById('unitButtonsContainer');
    if (unitButtonsContainer) unitButtonsContainer.style.display = 'none';

    pickOptionsContainer.style.display = 'none';

    if (numberInputContainer) numberInputContainer.style.display = 'none';

    if (notesContainer) notesContainer.style.display = 'none';

    if (actionButtonsContainer) actionButtonsContainer.style.display = 'none';

    pickError.textContent = '';
    pickSuccess.textContent = '';

    // Load sports buttons
    await loadSports();

  } catch (error) {
    loginError.textContent = 'Login failed. Please try again.';
    console.error('Login error:', error);
  }
});
