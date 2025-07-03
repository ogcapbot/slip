// admin/firebaseInit.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// REPLACE these with your actual Firebase config values:
const firebaseConfig = {
  apiKey: "AIzaSyD1LnTPfXyil3m7Q9H_EyXpEqz18KMHLJk",
  authDomain: "ogcapperbets.firebaseapp.com",
  projectId: "ogcapperbets",
  storageBucket: "ogcapperbets.appspot.com",
  messagingSenderId: "280436007170",
  appId: "1:280436007170:web:7f4c6d21550d9bdf2067ce",
  measurementId: "G-4K3N92XN1K"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
