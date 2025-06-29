// admin/firebaseInit.js

// Import Firestore modular SDK normally
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

// No imports for auth and recaptcha — use global firebase compat
// So you MUST load compat SDK scripts in HTML <head> as before

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
const db = getFirestore(app);

// Export app and db normally
export { app, db };

// Export auth and initRecaptcha from global firebase compat
function initRecaptcha() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
      callback: (response) => {
        console.log('reCAPTCHA solved:', response);
      }
    });
  }
}

// Export initRecaptcha function
export { initRecaptcha };
