// login.js
import { db } from '/admin/firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const loginSection = document.getElementById('loginSection');
const pickForm = document.getElementById('pickForm');
const loginBtn = document.getElementById('loginBtn');
const accessCodeInput = document.getElementById('accessCode');
const loginError = document.getElementById('loginError');

let currentUser = null;

async function loginUser(accessCode) {
  const usersRef = collection(db, "Users");
  const q = query(usersRef, where("Access Code", "==", accessCode));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    throw new Error('Invalid access code');
  }
  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
}

loginBtn.addEventListener('click', async () => {
  loginError.textContent = '';
  const code = accessCodeInput.value.trim();
  if (!code) {
    loginError.textContent = 'Please enter your access code.';
    return;
  }

  try {
    currentUser = await loginUser(code);
    loginSection.style.display = 'none';
    pickForm.style.display = 'block';
  } catch (err) {
    loginError.textContent = err.message;
  }
});

export { currentUser };
