// admin/js/auth.js
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const loginBtn = document.getElementById('loginBtn');
const accessCodeInput = document.getElementById('accessCodeInput');
const loginError = document.getElementById('loginError');

loginBtn.addEventListener('click', async () => {
  loginError.textContent = '';
  const accessCode = accessCodeInput.value.trim();
  if (!accessCode) {
    loginError.textContent = 'Please enter access code.';
    return;
  }

  try {
    const db = getFirestore();
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('accessCode', '==', accessCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      loginError.textContent = 'Invalid Access Code.';
    } else {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Hide login, show admin section
      document.getElementById('loginSection').style.display = 'none';
      document.getElementById('adminSection').style.display = 'block';

      // Call adminOptions.js to display user info
      import('./adminOptions.js').then(mod => {
        mod.displayAdminOptions(userData);
      });
    }
  } catch (error) {
    console.error('Error checking access code:', error);
    loginError.textContent = 'An error occurred. Please try again.';
  }
});
