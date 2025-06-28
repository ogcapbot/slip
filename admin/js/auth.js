import { auth, db } from './firebaseInit.js';
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Sign in user with email/password
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    // Fetch user role from Firestore users collection
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      throw new Error("User role not found");
    }
    const userData = userDoc.data();
    return { uid: userId, ...userData };
  } catch (error) {
    throw error;
  }
}

// Sign out user
async function logout() {
  await signOut(auth);
}

export { login, logout };
