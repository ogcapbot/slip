// auth.js

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

import { showAdminOptions } from './adminOptions.js';

const firebaseConfig = {
  apiKey: "AIzaSyD9Px_6V0Yl5Dz8HRiLuFNgC3RT6AL9P-o",
  authDomain: "ogcapperbets.firebaseapp.com",
  projectId: "ogcapperbets",
  storageBucket: "ogcapperbets.appspot.com",
  messagingSenderId: "70543247155",
  appId: "1:70543247155:web:48f6a17d8d496792b5ec2b"
};

// Initialize Firebase app only if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const loginInput = document.querySelector('input[type="password"]');
const loginButton = document.querySelector('button');
const loginSection = document.querySelector('section');
const errorDisplay = document.getElementById('loginError');

loginButton.addEventListener('click', () => {
  const code = loginInput.value.trim();
  if (!code) {
    displayError('Please enter access code.');
    return;
  }
  checkAccessCode(code);
});

loginInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    loginButton.click();
  }
});

function displayError(message) {
  errorDisplay.textContent = message;
  errorDisplay.style.color = 'red';
}

async function checkAccessCode(code) {
  try {
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('accessCode', '==', code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      displayError('Invalid Access Code.');
      return;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Increment loginCount field (creates it if missing)
    const userDocRef = doc(db, 'Users', userDoc.id);
    await updateDoc(userDocRef, {
      loginCount: increment(1)
    });

    // Hide login UI after success
    loginSection.style.display = 'none';

    // Clear any previous error messages
    errorDisplay.textContent = '';

    // Call adminOptions.js to display admin UI and user info
    showAdminOptions(userData);

  } catch (error) {
    console.error('Error checking access code:', error);
    displayError('An error occurred. Please try again.');
  }
}
