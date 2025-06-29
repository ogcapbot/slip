// firebaseInit.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, RecaptchaVerifier } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2ggF-0vtAyLhoftOIVnFbzfSpYYzy6rw",
  authDomain: "ogcapperbets.firebaseapp.com",
  projectId: "ogcapperbets",
  storageBucket: "ogcapperbets.firebasestorage.app",
  messagingSenderId: "442564970374",
  appId: "1:442564970374:web:91e6e1e55eae8e5bc10e07",
  measurementId: "G-71JGC4DVMG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function initRecaptcha() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA resolved');
      }
    }, auth);
  }
}

export { app, auth, db, initRecaptcha };
