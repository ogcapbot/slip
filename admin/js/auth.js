import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadSports } from '/admin/js/sportSelector.js';

const loginBtn = document.getElementById('loginBtn');
const accessCodeInput = document.getElementById('AccessCode');
const loginError = document.getElementById('loginError');
const loginSection = document.getElementById('loginSection');
const pickForm = document.getElementById('pickForm');
const sportSelect = document.getElementById('sportSelect');

// On page load, ensure only login section is visible, everything else hidden or disabled
window.addEventListener('DOMContentLoaded', () => {
  loginSection.style.display = 'block';
  pickForm.style.display = 'none';

  // Sport select visible but disabled and empty until login
  sportSelect.innerHTML = '';
  sportSelect.disabled = true;

  // Hide all other pick form elements except sport selector label + container
  // We'll assume your HTML labels and containers are properly structured to show/hide next
  // Here we do minimal: hide pickForm except sportSelect label + container visible after login
});

loginBtn.addEventListener('click', async () => {
  loginError.textContent = '';

  const accessCode = accessCodeInput.value?.trim();
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

    // Successful login
    loginSection.style.display = 'none';
    pickForm.style.display = 'block';

    // Enable sport select and load sports
    sportSelect.disabled = false;
    sportSelect.innerHTML = ''; // Clear placeholder/loading option
    await loadSports();

  } catch (error) {
    console.error('Login error:', error);
    loginError.textContent = 'Login failed. Please try again.';
  }
});
