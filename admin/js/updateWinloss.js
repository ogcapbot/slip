import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const requiredFields = [
  'sport',
  'league',
  'pick',
  'unit',
  'wagerTypeDesc',
  'timestampSubmitted'
];

function createStyledButton(text, colorClass = 'blue') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = text;
  btn.className = `pick-btn ${colorClass}`;
  btn.style.paddingTop = '6px';
  btn.style.paddingBottom = '6px';
  btn.style.margin = '4px 0';
  btn.style.minWidth = '0';
  btn.style.width = '100%';
  btn.style.boxSizing = 'border-box';
  return btn;
}

// Helper: format Firestore timestamp to readable string
function formatTimestamp(ts) {
  if (!ts) return 'N/A';
  if (ts.seconds) {
    const date = new Date(ts.seconds * 1000);
    return date.toLocaleString();
  }
  return ts.toString();
}

export async function loadUpdateWinLoss(container) {
  if (!container) {
    console.error('No container element provided to loadUpdateWinLoss');
    return;
  }

  container.innerHTML = ''; // Clear existing content

  try {
    const officialPicksRef = collection(db, 'OfficialPicks');
    const qNull = query(officialPicksRef, where('gameWinLossDraw', '==', null));
    const snapshotNull = await getDocs(qNull);
    const qEmpty = query(officialPicksRef, where('gameWinLossDraw', '==', ''));
    const snapshotEmpty = await getDocs(qEmpty);
    const combinedDocs = [...snapshotNull.docs, ...snapshotEmpty.docs];

    if (combinedDocs.length === 0) {
      container.textContent = 'No picks pending Win/Loss update.';
      return;
    }

    combinedDocs.forEach((docSnap, i) => {
      const data = docSnap.data();

      // Container for the whole doc row (2 columns)
      const docRow = document.createElement('div');
      docRow.style.display = 'flex';
      docRow.style.justifyContent = 'space-between';
      docRow.style.alignItems = 'flex-start';
      docRow.style.marginBottom = '15px';

      // Left column: doc info
      const infoCol = document.createElement('div');
      infoCol.style.flex = '1';
      infoCol.style.paddingRight = '15px';

      requiredFields.forEach(field => {
        const p = document.createElement('p');
        p.style.margin = '2px 0';
        let value = data[field] !== undefined ? data[field] : 'N/A';
        if (field === 'timestampSubmitted') {
          value = formatTimestamp(value);
        }
        p.textContent = `${field}: ${value}`;
        infoCol.appendChild(p);
      });

      docRow.appendChild(infoCol);

      // Right column: buttons stacked vertically
      const buttonsCol = document.createElement('div');
      buttonsCol.style.display = 'flex';
      buttonsCol.style.flexDirection = 'column';
      buttonsCol.style.width = '110px'; // fixed width for buttons
      buttonsCol.style.flexShrink = '0';

      // Track pressed button for this doc
      let pressedBtn = null;

      // Create buttons
      const btnWin = createStyledButton('Win');
      const btnPush = createStyledButton('Push');
      const btnLost = createStyledButton('Lost');

      // Set initial pressed button based on existing value
      const currentStatus = data.gameWinLossDraw;
      if (currentStatus === 'Won') {
        btnWin.classList.replace('blue', 'green');
        pressedBtn = btnWin;
      } else if (currentStatus === 'Push') {
        // Keep blue but pressed style
        btnPush.classList.add('pressed'); // We'll define this class in CSS below
        pressedBtn = btnPush;
      } else if (currentStatus === 'Lost') {
        btnLost.classList.replace('blue', 'red');
        pressedBtn = btnLost;
      }

      // Button click handler to update status and UI
      const updateStatus = async (status, btn) => {
        if (pressedBtn === btn) return; // no change

        try {
          const docRef = doc(db, 'OfficialPicks', docSnap.id);
          await updateDoc(docRef, { gameWinLossDraw: status });

          // Reset previously pressed button styles
          if (pressedBtn) {
            pressedBtn.classList.remove('green', 'red', 'pressed');
            pressedBtn.classList.add('blue');
          }

          // Set new pressed button style
          if (status === 'Won') {
            btn.classList.replace('blue', 'green');
            btn.classList.remove('pressed');
          } else if (status === 'Push') {
            btn.classList.add('pressed');
            btn.classList.remove('green', 'red');
            btn.classList.remove('blue'); // remove blue for pressed style
          } else if (status === 'Lost') {
            btn.classList.replace('blue', 'red');
            btn.classList.remove('pressed');
          }

          pressedBtn = btn;

        } catch (error) {
          alert('Failed to update status. Check console for details.');
          console.error('Error updating status:', error);
        }
      };

      btnWin.addEventListener('click', () => updateStatus('Won', btnWin));
      btnPush.addEventListener('click', () => updateStatus('Push', btnPush));
      btnLost.addEventListener('click', () => updateStatus('Lost', btnLost));

      buttonsCol.appendChild(btnWin);
      buttonsCol.appendChild(btnPush);
      buttonsCol.appendChild(btnLost);

      docRow.appendChild(buttonsCol);

      container.appendChild(docRow);

      // Horizontal separator except after last
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
