import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadAdminOptions } from './adminOptions.js';  // NEW import
import { loadSports } from './sportSelector.js';       // NEW import for direct sportSelector load

const loginBtn = document.getElementById('loginBtn');
const accessCodeInput = document.getElementById('AccessCode');
const loginError = document.getElementById('loginError');
const loginSection = document.getElementById('loginSection');
const pickForm = document.getElementById('pickForm');

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

    // Get user document data - assume only one match
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Check if Access field contains 'User' (case-insensitive)
    const accessField = (userData.Access || '').toLowerCase();
    if (accessField.includes('user')) {
      // Load sport selector directly for 'User' access
      await loadSports();
    } else {
      // Otherwise load admin options screen
      await loadAdminOptions();
    }

  } catch (error) {
    if (loginError) loginError.textContent = 'Login failed. Please try again.';
    console.error('Login error:', error);
  }
});
