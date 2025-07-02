import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { softReset } from './auth.js';  // Import softReset from auth.js

const pickForm = document.getElementById('pickForm');

export async function loadAdminStats() {
  if (!pickForm) {
    console.error('pickForm element not found!');
    return;
  }

  pickForm.innerHTML = ''; // Clear existing content

  try {
    const officialPicksRef = collection(db, 'OfficialPicks');
    const snapshot = await getDocs(officialPicksRef);

    let total = 0;
    let pending = 0;
    let won = 0;
    let lost = 0;
    let push = 0;

    snapshot.forEach(doc => {
      total++;
      const result = doc.data().gameWinLossDraw;
      if (result === null || result === undefined) {
        pending++;
      } else if (result === 'Won') {
        won++;
      } else if (result === 'Lost') {
        lost++;
      } else if (result === 'Push') {
        push++;
      }
    });

    // Create stats display elements
    const statsDiv = document.createElement('div');
    statsDiv.style.fontFamily = 'Oswald, sans-serif';
    statsDiv.style.whiteSpace = 'pre-line';
    statsDiv.style.marginBottom = '12px';
    statsDiv.style.fontSize = '12px';

    statsDiv.innerHTML = 
  `Total Official Picks: ${total}<br>` +
  `Official Picks Pending Win/Loss: ${pending}<br>` +
  `Official Picks Won: ${won}<br>` +
  `Official Picks Lost: ${lost}<br>` +
  `Official Picks Push: ${push}`;

    pickForm.appendChild(statsDiv);

  } catch (error) {
    console.error('Error loading official picks stats:', error);
    pickForm.textContent = 'Failed to load stats.';
  }
}
