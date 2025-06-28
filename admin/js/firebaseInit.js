// firebaseInit.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB2ggF-0vtAyLhoftOIVnFbzfSpYYzy6rw",
  authDomain: "ogcapperbets.firebaseapp.com",
  projectId: "ogcapperbets",
  storageBucket: "ogcapperbets.firebasestorage.app",
  messagingSenderId: "442564970374",
  appId: "1:442564970374:web:91e6e1e55eae8e5bc10e07",
  measurementId: "G-71JGC4DVMG"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { app, auth, db, analytics };
