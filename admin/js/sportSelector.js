// sportSelector.js
// Module to render sport selector buttons based on unique sport names from GameEventsData collection

import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const db = getFirestore();

/**
 * Renders sport selector buttons (max 15) in 3 columns inside #mainContent element
 * Dispatches 'sportSelected' event with sportName detail on button click
 */
export async function renderSportSelector() {
  console.log("[sportSelector] Starting to build sport selector buttons...");

  try {
    // Fetch all docs from GameEventsData
    const gameEventsRef = collection(db, "GameEventsData");
    const snapshot = await getDocs(gameEventsRef);

    // Collect unique sport names
    const sportsSet = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.sportName) {
        sportsSet.add(data.sportName);
      }
    });

    const uniqueSports = Array.from(sportsSet).sort();

    console.log(`[sportSelector] Found ${uniqueSports.length} unique sport names.`);

    // Get container to render buttons
    const container = document.getElementById('mainContent');
    if (!container) {
      console.error("[sportSelector] No #mainContent element found.");
      return;
    }

    container.innerHTML = ""; // Clear existing content

    // Create a grid container for buttons
    const buttonWrapper = document.createElement('div');
    buttonWrapper.style.display = 'grid';
    buttonWrapper.style.gridTemplateColumns = 'repeat(3, 1fr)';
    buttonWrapper.style.gap = '10px';
    buttonWrapper.style.maxWidth = '400px';
    buttonWrapper.style.margin = '0 auto';

    // Limit buttons to 15
    const buttonsToShow = uniqueSports.slice(0, 15);

    buttonsToShow.forEach(sportName => {
      const btn = document.createElement('button');
      btn.textContent = sportName;
      btn.className = 'admin-button'; // Use your button styling class
      btn.style.height = '45px';
      btn.style.fontSize = '11px';

      btn.addEventListener('click', () => {
        console.log(`[sportSelector] Button clicked: ${sportName}`);
        // Dispatch event for adminOptions to handle
        document.dispatchEvent(new CustomEvent('sportSelected', { detail: sportName }));
      });

      buttonWrapper.appendChild(btn);
    });

    container.appendChild(buttonWrapper);

    console.log("[sportSelector] Sport selector buttons rendered successfully.");
  } catch (error) {
    console.error("[sportSelector] Error rendering sport selector:", error);
    const container = document.getElementById('mainContent');
    if (container) {
      container.textContent = "Failed to load sports. Please try again.";
    }
  }
}
