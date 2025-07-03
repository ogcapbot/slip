// admin/js/auth.js
import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const input = document.getElementById('accessCodeInput');
const button = document.getElementById('loginButton');
const loginError = document.getElementById('loginError');

async function checkAccessCode() {
  const accessCode = input.value.trim();
  loginError.textContent = '';

  if (!accessCode) {
    loginError.textContent = 'Please enter an access code.';
    return;
  }

  try {
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('accessCode', '==', accessCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      loginError.textContent = 'Invalid Access Code.';
    } else {
      const userDoc = querySnapshot.docs[0].data();

      // Remove login input and button on successful login
      input.style.display = 'none';
      button.style.display = 'none';

      import('./adminOptions.js').then(({ showAdminOptions }) => {
        showAdminOptions(userDoc);
      });
    }
  } catch (error) {
    console.error('Error checking access code:', error);
    loginError.textContent = 'An error occurred. Please try again.';
  }
}

// Listen for button click
button.addEventListener('click', () => {
  checkAccessCode();
});

// Listen for Enter key press on input
input.addEventListener('keyup', (event) => {
  if (event.key === 'Enter' || event.keyCode === 13) {
    checkAccessCode();
  }
});
