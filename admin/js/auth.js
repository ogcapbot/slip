import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadAdminOptions } from './adminOptions.js';
import { loadSports } from './sportSelector.js';

const loginBtn = document.getElementById('loginBtn');
const accessCodeInput = document.getElementById('AccessCode');
const loginError = document.getElementById('loginError');
const loginSection = document.getElementById('loginSection');
const pickForm = document.getElementById('pickForm');

let currentUserData = null; // store logged-in user data

if (accessCodeInput && loginBtn) {
  accessCodeInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      loginBtn.click();
    }
  });
}

// New reusable post-login UI function
export async function showPostLoginScreen(userData) {
  if (!userData) {
    console.error('No user data provided for post-login screen');
    return;
  }

  if (loginSection) loginSection.style.display = 'none';
  if (pickForm) pickForm.style.display = 'block';

  // Check user access level and load corresponding screen
  const accessField = (userData.Access || '').toLowerCase();
  if (accessField.includes('user')) {
    await loadSports();
  } else {
    await loadAdminOptions();
  }
}

// New function for soft reset
export async function softReset() {
  if (!currentUserData) {
    console.error('No logged-in user data for soft reset');
    return;
  }
  await showPostLoginScreen(currentUserData);
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

    // Store logged-in user data for later resets
    currentUserData = querySnapshot.docs[0].data();

    // Show appropriate post-login UI
    await showPostLoginScreen(currentUserData);

  } catch (error) {
    if (loginError) loginError.textContent = 'Login failed. Please try again.';
    console.error('Login error:', error);
  }
});
