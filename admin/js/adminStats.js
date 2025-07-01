import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadAdminOptions } from './adminOptions.js';

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

    statsDiv.textContent =
      `Total Official Picks: ${total}\n` +
      `Official Picks Pending Win/Loss: ${pending}\n` +
      `Official Picks Won: ${won}\n` +
      `Official Picks Lost: ${lost}\n` +
      `Official Picks Push: ${push}`;

    pickForm.appendChild(statsDiv);

    // Create Back button
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.textContent = 'Back';
    backBtn.className = 'pick-btn blue';

    backBtn.style.paddingTop = '6px';
    backBtn.style.paddingBottom = '6px';
    backBtn.style.marginTop = '2px';
    backBtn.style.marginBottom = '2px';
    backBtn.style.width = '100%';
    backBtn.style.minWidth = '0';
    backBtn.style.boxSizing = 'border-box';

    backBtn.addEventListener('click', () => {
      loadAdminOptions();
    });

    pickForm.appendChild(backBtn);

  } catch (error) {
    console.error('Error loading official picks stats:', error);
    pickForm.textContent = 'Failed to load stats.';
  }
}
