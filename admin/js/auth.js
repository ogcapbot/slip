// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Your Firebase config - Replace these with your actual project details!
const firebaseConfig = {
  apiKey: "AIzaSyD1LnTPfXyil3m7Q9H_EyXpEqz18KMHLJk",
  authDomain: "ogcapperbets.firebaseapp.com",
  projectId: "ogcapperbets",
  storageBucket: "ogcapperbets.appspot.com",
  messagingSenderId: "280436007170",
  appId: "1:280436007170:web:7f4c6d21550d9bdf2067ce",
  measurementId: "G-4K3N92XN1K"
};

// Initialize Firebase app and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const accessCodeInput = document.querySelector('input[type="password"]');
const loginButton = document.querySelector('button');
const loginError = document.getElementById('loginError');
const header = document.querySelector('header');
const loginSection = document.querySelector('section');

// Add displayName paragraph under header text
const displayNameEl = document.createElement('p');
displayNameEl.style.color = '#888';
displayNameEl.style.fontSize = '0.9rem';
displayNameEl.style.marginTop = '0';
header.appendChild(displayNameEl);

async function checkAccessCode() {
  loginError.textContent = ''; // Clear previous error

  const code = accessCodeInput.value.trim();
  if (!code) {
    loginError.textContent = 'Please enter access code.';
    return;
  }

  try {
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('accessCode', '==', code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      loginError.textContent = 'Invalid Access Code.';
      return;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Show user display name below header
    displayNameEl.textContent = `User: ${userData.userDisplayname || 'Unknown'}`;

    // Hide login input section
    loginSection.style.display = 'none';

    // Increment loginCount in Firestore
    const userRef = doc(db, 'Users', userDoc.id);
    await updateDoc(userRef, {
      loginCount: increment(1)
    });

    // TODO: Call your adminOptions.js method here, e.g.:
    // showAdminOptions(userData);

    console.log('Logged in user:', userData);

  } catch (error) {
    console.error('Error checking access code:', error);
    loginError.textContent = 'An error occurred. Please try again.';
  }
}

// Event listeners
loginButton.addEventListener('click', checkAccessCode);
accessCodeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    checkAccessCode();
  }
});
