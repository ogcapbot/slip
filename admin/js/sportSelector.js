// sportSelector.js

import { collection, getDocs, getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

export async function renderSportSelector() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;

  console.log("[sportSelector] Starting to build sport selector buttons...");

  try {
    const db = getFirestore(getApp());
    const gameEventsRef = collection(db, "GameEventsData");
    const snapshot = await getDocs(gameEventsRef);

    const sportsSet = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.sportName) {
        sportsSet.add(data.sportName);
      }
    });

    const uniqueSports = Array.from(sportsSet).sort();

    mainContent.innerHTML = "";

    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(3, 1fr)';
    container.style.gap = '10px';
    container.style.maxWidth = '400px';
    container.style.margin = '0 auto';

    uniqueSports.slice(0, 15).forEach(sportName => {
      const btn = document.createElement('button');
      btn.textContent = sportName;
      btn.className = 'admin-button';
      btn.style.height = '45px';
      btn.style.fontSize = '11px';

      btn.addEventListener('click', () => {
        console.log(`[sportSelector] Button clicked: ${sportName}`);
        // Further logic on sport button click can be added here
      });

      container.appendChild(btn);
    });

    mainContent.appendChild(container);

    console.log("[sportSelector] Sport selector buttons rendered successfully.");
  } catch (error) {
    console.error("[sportSelector] Error rendering sport selector:", error);
    mainContent.textContent = "Failed to load sports. Please try again.";
  }
}
