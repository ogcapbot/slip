// admin/js/sportSelector.js

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

/**
 * Initialize Firebase app and Firestore db instance
 * Use existing app if already initialized to prevent errors
 */
const firebaseConfig = {
  apiKey: "AIzaSyD9Px_6V0Yl5Dz8HRiLuFNgC3RT6AL9P-o",
  authDomain: "ogcapperbets.firebaseapp.com",
  projectId: "ogcapperbets",
  storageBucket: "ogcapperbets.appspot.com",
  messagingSenderId: "70543247155",
  appId: "1:70543247155:web:48f6a17d8d496792b5ec2b"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

/**
 * Build sport selector buttons from GameEventsData collection.
 * Shows up to 15 unique sportName buttons sorted alphabetically.
 * Buttons arranged in 3 columns and up to 5 rows.
 * 
 * @param {HTMLElement} container - DOM element to append buttons container into
 */
export async function showSportSelector(container) {
  console.log("[sportSelector] Starting to build sport selector buttons...");

  if (!container) {
    console.error("[sportSelector] No container element provided.");
    return;
  }

  try {
    // Fetch all documents from GameEventsData
    const gameEventsRef = collection(db, 'GameEventsData');
    const querySnapshot = await getDocs(gameEventsRef);

    // Extract unique sportNames
    const sportNameSet = new Set();

    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.sportName && typeof data.sportName === 'string') {
        sportNameSet.add(data.sportName);
      }
    });

    // Convert to array and sort alphabetically
    const sportNames = Array.from(sportNameSet).sort((a, b) => a.localeCompare(b));

    console.log(`[sportSelector] Found ${sportNames.length} unique sport names.`);

    // Limit to max 15 sports
    const limitedSports = sportNames.slice(0, 15);

    // Clear previous content if any
    container.innerHTML = '';

    // Create a div container for buttons with a CSS class for styling
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('sport-selector-grid');

    // Create buttons for each sport
    limitedSports.forEach(sportName => {
      const btn = document.createElement('button');
      btn.textContent = sportName;
      btn.classList.add('sport-selector-button');
      // Optionally: add click handlers here to do something when clicked
      btn.addEventListener('click', () => {
        console.log(`[sportSelector] Button clicked: ${sportName}`);
        // TODO: handle sport selection action
      });
      buttonsContainer.appendChild(btn);
    });

    // Append buttons container to the provided container element
    container.appendChild(buttonsContainer);

    console.log("[sportSelector] Sport selector buttons rendered successfully.");

  } catch (error) {
    console.error("[sportSelector] Error fetching or rendering sports:", error);
  }
}
