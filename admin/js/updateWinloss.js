import { db } from '../firebaseInit.js';
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

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
    const snapshot = await getDocs(officialPicksRef);

    if (snapshot.empty) {
      container.textContent = 'No picks found.';
      return;
    }

    snapshot.docs.forEach((docSnap, i) => {
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

      // Create buttons
      const btnWin = createStyledButton('Win');
      const btnPush = createStyledButton('Push');
      const btnLost = createStyledButton('Lost');

      // Set initial color based on existing value
      const currentStatus = data.gameWinLossDraw;
      if (currentStatus === 'Won') {
        btnWin.classList.replace('blue', 'green');
      } else if (currentStatus === 'Push') {
        // Keep blue but no pressed class needed
      } else if (currentStatus === 'Lost') {
        btnLost.classList.replace('blue', 'red');
      }

      // Handler for button click
      const onButtonClick = async (status, btnClicked) => {
        // If clicked the button that matches current status, require password
        if (currentStatus === status) {
          const password = prompt('Enter password to change this status:');
          if (password !== 'super123') {
            alert('Incorrect password. Status not changed.');
            return;
          }
        }

        // Update DB
        try {
          const docRef = doc(db, 'OfficialPicks', docSnap.id);
          await updateDoc(docRef, { gameWinLossDraw: status });
        } catch (error) {
          alert('Failed to update status. See console for details.');
          console.error('Error updating status:', error);
          return;
        }

        // Update button UI:
        // Show only clicked button, hide others
        [btnWin, btnPush, btnLost].forEach(btn => {
          if (btn === btnClicked) {
            // Set color
            btn.style.display = 'block';
            btn.classList.remove('blue', 'green', 'red');
            if (status === 'Won') btn.classList.add('green');
            else if (status === 'Push') btn.classList.add('blue'); // push is blue
            else if (status === 'Lost') btn.classList.add('red');
          } else {
            btn.style.display = 'none';
          }
        });
      };

      btnWin.addEventListener('click', () => onButtonClick('Won', btnWin));
      btnPush.addEventListener('click', () => onButtonClick('Push', btnPush));
      btnLost.addEventListener('click', () => onButtonClick('Lost', btnLost));

      buttonsCol.appendChild(btnWin);
      buttonsCol.appendChild(btnPush);
      buttonsCol.appendChild(btnLost);

      docRow.appendChild(buttonsCol);

      container.appendChild(docRow);

      // Horizontal separator except after last
      if (i < snapshot.docs.length - 1) {
        const hr = document.createElement('hr');
        container.appendChild(hr);
      }
    });

  } catch (error) {
    console.error('Error loading updateWinLoss picks:', error);
    container.textContent = 'Failed to load picks.';
  }
}
