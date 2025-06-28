// auth.js - access code login with UI rendering + login logic

import { db } from './firebaseInit.js';
import { collection, query, where, getDocs } from "firebase/firestore";

let currentUser = null;

/**
 * Render the login UI inside the given container element.
 * Creates access code input, login button, and error message area.
 * Handles login process on button click.
 * @param {HTMLElement} container - DOM element to render login UI in.
 */
function renderLogin(container) {
  container.innerHTML = `
    <label for="accessCodeInput">Enter Access Code</label>
    <input
      type="text"
      id="accessCodeInput"
      placeholder="Enter your access code"
      maxlength="10"
      pattern="\\d*"
      inputmode="numeric"
      autocomplete="off"
      style="font-family: 'Oswald', sans-serif; padding: 10px; font-size: 1rem; width: 100%; box-sizing: border-box; margin-top: 6px;"
    />
    <button id="loginBtn" class="btn" style="margin-top: 15px;">Login</button>
    <p id="loginError" style="color: red; font-weight: 600; margin-top: 10px;"></p>
  `;

  const loginBtn = container.querySelector('#loginBtn');
  const accessCodeInput = container.querySelector('#accessCodeInput');
  const loginError = container.querySelector('#loginError');

  loginBtn.addEventListener('click', async () => {
    loginError.textContent = '';
    const accessCode = accessCodeInput.value.trim();
    if (!accessCode) {
      loginError.textContent = 'Please enter your access code.';
      return;
    }

    try {
      const user = await login(accessCode);
      alert(`Welcome, ${user.name} (${user.role})!`);
      // TODO: Proceed to dashboard or next UI step here.
    } catch (err) {
      loginError.textContent = err.message;
    }
  });
}

/**
 * Log in a user by their numeric access code.
 * Queries Firestore 'users' collection for a matching code.
 * @param {string} accessCode
 * @returns {Promise<object>} User data if access code is valid.
 * @throws Error if invalid access code.
 */
async function login(accessCode) {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("accessCode", "==", accessCode));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Invalid access code");
  }

  const userDoc = querySnapshot.docs[0];
  currentUser = { id: userDoc.id, ...userDoc.data() };
  sessionStorage.setItem('ogUser', JSON.stringify(currentUser));
  return currentUser;
}

/**
 * Log out the current user and clear session storage.
 */
function logout() {
  currentUser = null;
  sessionStorage.removeItem('ogUser');
}

/**
 * Get the currently logged-in user from memory or sessionStorage.
 * @returns {object|null} Current user data or null if not logged in.
 */
function getCurrentUser() {
  if (!currentUser) {
    const stored = sessionStorage.getItem('ogUser');
    if (stored) {
      currentUser = JSON.parse(stored);
    }
  }
  return currentUser;
}

export { renderLogin, login, logout, getCurrentUser };
