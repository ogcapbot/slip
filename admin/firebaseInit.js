// firebaseInit.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";
import { getAuth, RecaptchaVerifier } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js";

// Your Firebase config here
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ...rest of your config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let recaptchaVerifier;

export function initRecaptcha() {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        console.log('reCAPTCHA solved:', response);
      }
    }, auth);
  }
  recaptchaVerifier.clear(); // clear any existing instance
  recaptchaVerifier.render();
}

export { app, db, auth, recaptchaVerifier };
