// admin/firebaseInit.js

// Modular imports for app and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB2ggF-0vtAyLhoftOIVnFbzfSpYYzy6rw",
  authDomain: "ogcapperbets.firebaseapp.com",
  projectId: "ogcapperbets",
  storageBucket: "ogcapperbets.firebasestorage.app",
  messagingSenderId: "442564970374",
  appId: "1:442564970374:web:91e6e1e55eae8e5bc10e07",
  measurementId: "G-71JGC4DVMG"
};

// Initialize app and Firestore DB modularly
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export app and db
export { app, db };

// For auth and reCAPTCHA, use global firebase compat SDK loaded via HTML scripts
function initRecaptcha() {
  if (!window.recaptchaVerifier) {
    console.log('Creating RecaptchaVerifier...');
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
      callback: (response) => {
        console.log('reCAPTCHA solved:', response);
      }
    });
  }
}

// Export initRecaptcha to be used in auth.js
export { initRecaptcha };
