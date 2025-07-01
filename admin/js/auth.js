import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadSports } from '/admin/js/sportSelector.js';

const loginBtn = document.getElementById('loginBtn');
const accessCodeInput = document.getElementById('AccessCode');
const loginError = document.getElementById('loginError');
const loginSection = document.getElementById('loginSection');
const pickForm = document.getElementById('pickForm');
const sportSelect = document.getElementById('sportSelect');

if (accessCodeInput && loginBtn) {
  accessCodeInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      loginBtn.click();
    }
  });
}

loginBtn.addEventListener('click', async () => {
  if (!accessCodeInput) {
    console.error('Access code input element not found!');
    if (loginError) loginError.textContent = 'Internal error: access code input missing.';
    return;
  }

  const accessCode = accessCodeInput.value?.trim();
  if (loginError) loginError.textContent = '';

  if (!accessCode) {
    if (loginError) loginError.textContent = 'Access code is required.';
    return;
  }

  try {
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('AccessCode', '==', accessCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      if (loginError) loginError.textContent = 'Invalid access code.';
      return;
    }

    // Successful login
    if (loginSection) loginSection.style.display = 'none';
    if (pickForm) pickForm.style.display = 'block';

    // Enable sport select and load sports
    if (sportSelect) {
      sportSelect.disabled = false;
      await loadSports();
    }
  } catch (error) {
    if (loginError) loginError.textContent = 'Login failed. Please try again.';
    console.error('Login error:', error);
  }
});
