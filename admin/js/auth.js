// admin/js/auth.js
import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

document.querySelector('button').addEventListener('click', async () => {
  const accessCode = document.querySelector('input[type="password"]').value.trim();
  const loginError = document.getElementById('loginError');
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

      import('./adminOptions.js').then(({ showAdminOptions }) => {
        showAdminOptions(userDoc);
      });
    }
  } catch (error) {
    console.error('Error checking access code:', error);
    loginError.textContent = 'An error occurred. Please try again.';
  }
});
