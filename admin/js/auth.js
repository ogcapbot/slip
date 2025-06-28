import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadSports } from './sportSelector.js';

const loginBtn = document.getElementById('loginBtn');
const accessCodeInput = document.getElementById('accessCode');
const loginError = document.getElementById('loginError');
const loginSection = document.getElementById('loginSection');
const pickForm = document.getElementById('pickForm');
const sportSelect = document.getElementById('sportSelect');

loginBtn.addEventListener('click', async () => {
  const accessCode = accessCodeInput.value.trim();
  loginError.textContent = '';

  if (!accessCode) {
    loginError.textContent = 'Access code is required.';
    return;
  }

  try {
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('Access Code', '==', accessCode));
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
