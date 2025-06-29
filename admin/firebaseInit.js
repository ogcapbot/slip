// admin/firebaseInit.js

// Modular imports for app and Firestore ONLY
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

// Initialize app modularly (for Firestore)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Firebase compat auth app once globally (auth uses global firebase)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

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

// Export Firestore modular db and recaptcha init function
export { db, initRecaptcha };
