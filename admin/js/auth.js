// auth.js - access code login without Firebase Auth

import { db } from './firebaseInit.js';
import { collection, query, where, getDocs } from "firebase/firestore";

let currentUser = null;

/**
 * Log in a user by their numeric access code.
 * @param {string} accessCode - The numeric access code entered by the user.
 * @returns {Promise<object>} The user data if access code is valid.
 * @throws Will throw an error if the access code is invalid.
 */
async function login(accessCode) {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("accessCode", "==", accessCode));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Invalid access code");
  }

  const userDoc = querySnapshot.docs[0];
  currentUser = { id: userDoc.id, ...userDoc.data() };
  sessionStorage.setItem('ogUser', JSON.stringify(currentUser));
  return currentUser;
}

/**
 * Log out the current user and clear session.
 */
function logout() {
  currentUser = null;
  sessionStorage.removeItem('ogUser');
}

/**
 * Get the currently logged-in user from memory or sessionStorage.
 * @returns {object|null} The current user data or null if not logged in.
 */
function getCurrentUser() {
  if (!currentUser) {
    const stored = sessionStorage.getItem('ogUser');
    if (stored) {
      currentUser = JSON.parse(stored);
    }
  }
  return currentUser;
}

export { login, logout, getCurrentUser };
