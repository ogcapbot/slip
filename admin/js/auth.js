// auth.js

import { db } from './firebaseInit.js';

let currentUser = null;

async function login(accessCode) {
  const usersRef = db.collection("users");
  const querySnapshot = await usersRef.where("accessCode", "==", accessCode).get();

  if (querySnapshot.empty) {
    throw new Error("Invalid access code");
  }

  const userDoc = querySnapshot.docs[0];
  currentUser = { id: userDoc.id, ...userDoc.data() };
  sessionStorage.setItem('ogUser', JSON.stringify(currentUser));
  return currentUser;
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('ogUser');
}

function getCurrentUser() {
  if (!currentUser) {
    const stored = sessionStorage.getItem('ogUser');
    if (stored) {
      currentUser = JSON.parse(stored);
    }
  }
  return currentUser;
}

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
      // TODO: Load dashboard or next UI step here.
    } catch (err) {
      loginError.textContent = err.message;
    }
  });
}

export { renderLogin, login, logout, getCurrentUser };
