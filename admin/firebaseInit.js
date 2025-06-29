// admin/firebaseInit.js

// No imports — using global firebase variable loaded via HTML scripts

const firebaseConfig = {
  apiKey: "AIzaSyB2ggF-0vtAyLhoftOIVnFbzfSpYYzy6rw",
  authDomain: "ogcapperbets.firebaseapp.com",
  projectId: "ogcapperbets",
  storageBucket: "ogcapperbets.firebasestorage.app",
  messagingSenderId: "442564970374",
  appId: "1:442564970374:web:91e6e1e55eae8e5bc10e07",
  measurementId: "G-71JGC4DVMG"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

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

export { app, auth, initRecaptcha };
