import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadSports } from '/admin/js/sportSelector.js';

const loginBtn = document.getElementById('loginBtn');
const accessCodeInput = document.getElementById('AccessCode'); // Correct casing here!
const loginError = document.getElementById('loginError');
const loginSection = document.getElementById('loginSection');
const pickForm = document.getElementById('pickForm');
const sportSelect = document.getElementById('sportSelect');

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
    const q = query(usersRef, where('AccessCode', '==', accessCode)); // EXACT field name here!
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      loginError.textContent = 'Invalid access code.';
      return;
    }

    // Successful login
    loginSection.style.display = 'none';
    pickForm.style.display = 'block';

    // Enable sport select and load sports
    sportSelect.disabled = false;
    await loadSports();

  } catch (error) {
    loginError.textContent = 'Login failed. Please try again.';
    console.error('Login error:', error);
  }
});

// Add Enter key support on AccessCode input
if (accessCodeInput) {
  accessCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loginBtn.click();
    }
  });
}
