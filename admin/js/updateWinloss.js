
import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const requiredFields = [
  'sport',
  'league',
  'pick',
  'unit',
  'wagerTypeDesc',
  'timestampSubmitted'
];

export async function loadUpdateWinLoss(container) {
  if (!container) {
    console.error('No container element provided to loadUpdateWinLoss');
    return;
  }

  container.innerHTML = ''; // Clear existing content

  try {
    const officialPicksRef = collection(db, 'OfficialPicks');
    // Query where gameWinLossDraw is null or empty string
    const q = query(officialPicksRef, where('gameWinLossDraw', '==', null));
    const snapshotNull = await getDocs(q);

    // Also query for empty string if needed (Firestore does not support "or" in older versions)
    // So do a separate query for '' if you expect that case:
    const qEmpty = query(officialPicksRef, where('gameWinLossDraw', '==', ''));
    const snapshotEmpty = await getDocs(qEmpty);

    const combinedDocs = [...snapshotNull.docs, ...snapshotEmpty.docs];

    if (combinedDocs.length === 0) {
      container.textContent = 'No picks pending Win/Loss update.';
      return;
    }

    combinedDocs.forEach((doc, i) => {
      const data = doc.data();

      const docDiv = document.createElement('div');
      docDiv.style.marginBottom = '15px';

      requiredFields.forEach(field => {
        const p = document.createElement('p');
        p.textContent = `${field}: ${data[field] !== undefined ? data[field] : 'N/A'}`;
        docDiv.appendChild(p);
      });

      container.appendChild(docDiv);

      if (i < combinedDocs.length - 1) {
        const hr = document.createElement('hr');
        container.appendChild(hr);
      }
    });
  } catch (error) {
    console.error('Error loading updateWinLoss picks:', error);
    container.textContent = 'Failed to load picks.';
  }
}
