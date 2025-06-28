import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseInit.js"; // Adjust path if necessary

// Check access code against Firestore Users collection
async function checkAccessCode(inputCode) {
  console.log("Checking access code:", inputCode);
  const usersRef = collection(db, "Users");
  const q = query(usersRef, where("AccessCode", "==", inputCode));
  const querySnapshot = await getDocs(q);

  console.log("Query snapshot size:", querySnapshot.size);

  if (!querySnapshot.empty) {
    const userData = querySnapshot.docs[0].data();
    console.log("User found:", userData);
    return true;
  } else {
    console.warn("No user found for access code:", inputCode);
    return false;
  }
}

// Handle login button click
export async function loginHandler(event) {
  event.preventDefault();
  const accessCodeInput = document.getElementById("accessCode");
  const loginError = document.getElementById("loginError");

  const inputCode = accessCodeInput.value.trim();

  if (!inputCode) {
    loginError.textContent = "Please enter an access code.";
    return;
  }

  try {
    const valid = await checkAccessCode(inputCode);
    if (valid) {
      loginError.textContent = "";
      // TODO: Proceed to show pick form, hide login, etc.
      console.log("Login successful!");
      // For example:
      document.getElementById("loginSection").style.display = "none";
      document.getElementById("pickForm").style.display = "block";
    } else {
      loginError.textContent = "Invalid access code";
    }
  } catch (error) {
    console.error("Error during login:", error);
    loginError.textContent = "An error occurred. Please try again.";
  }
}

// Attach loginHandler to login button click
document.getElementById("loginBtn").addEventListener("click", loginHandler);
