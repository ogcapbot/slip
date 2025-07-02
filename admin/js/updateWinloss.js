import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

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
    const snapshot = await getDocs(officialPicksRef);

    // Convert docs to data array with id and data
    const docsData = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    // Sort so docs without gameWinLossDraw come first
    docsData.sort((a, b) => {
      const aVal = a.data.gameWinLossDraw;
      const bVal = b.data.gameWinLossDraw;
      if (!aVal && bVal) return -1;
      if (aVal && !bVal) return 1;
      return 0;
    });

    if (docsData.length === 0) {
      container.textContent = 'No picks found.';
      return;
    }

    docsData.forEach(({ id, data }, i) => {
      const docDiv = document.createElement('div');
      docDiv.style.marginBottom = '15px';
      docDiv.style.padding = '10px';
      docDiv.style.borderRadius = '6px';

      // Highlight with subtle yellow if no win/loss set yet
      if (!data.gameWinLossDraw) {
        docDiv.style.backgroundColor = '#fff9db';
      }

      // Create left column for text
      const leftCol = document.createElement('div');
      leftCol.style.display = 'inline-block';
      leftCol.style.width = 'calc(100% - 130px)';
      leftCol.style.verticalAlign = 'top';

      // Create right column for buttons
      const rightCol = document.createElement('div');
      rightCol.style.display = 'inline-block';
      rightCol.style.width = '120px';
      rightCol.style.verticalAlign = 'top';
      rightCol.style.textAlign = 'right';

      requiredFields.forEach(field => {
        const p = document.createElement('p');
        p.style.margin = '2px 0';
        p.textContent = `${field}: ${data[field] !== undefined ? data[field] : 'N/A'}`;
        leftCol.appendChild(p);
      });

      docDiv.appendChild(leftCol);
      docDiv.appendChild(rightCol);

      // Helper to create buttons
      function createStatusButton(text, color) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = text;
        btn.className = 'pick-btn blue';
        btn.style.display = 'block';
        btn.style.marginBottom = '6px';
        btn.style.width = '100%';
        btn.style.minWidth = '0';
        btn.style.boxSizing = 'border-box';

        if (color) {
          btn.style.backgroundColor = color;
          btn.style.borderColor = color;
          btn.style.color = '#fff';
        }

        btn.addEventListener('click', async () => {
          // Show prompt if this status is already set
          if (data.gameWinLossDraw === text) {
            const pw = prompt('Password required to change existing status:');
            if (pw !== 'super123') {
              alert('Incorrect password. Status not changed.');
              return;
            }
          }

          // Update DB
          try {
            const docRef = doc(db, 'OfficialPicks', id);
            await updateDoc(docRef, {
              gameWinLossDraw: text
            });

            // Update local data to reflect change
            data.gameWinLossDraw = text;

            // Update UI: hide other buttons except clicked one
            Array.from(rightCol.children).forEach(button => {
              if (button !== btn) button.style.display = 'none';
            });

            // Update button colors per status
            if (text === 'Win') {
              btn.style.backgroundColor = '#4CAF50';
              btn.style.borderColor = '#4CAF50';
              btn.style.color = '#fff';
            } else if (text === 'Push') {
              btn.style.backgroundColor = '#2196F3';
              btn.style.borderColor = '#2196F3';
              btn.style.color = '#fff';
            } else if (text === 'Lost') {
              btn.style.backgroundColor = '#B74141';
              btn.style.borderColor = '#B74141';
              btn.style.color = '#fff';
            }
          } catch (error) {
            console.error('Error updating win/loss:', error);
            alert('Failed to update status.');
          }
        });

        return btn;
      }

      // Create buttons, hide all except existing status or show all if none set
      if (!data.gameWinLossDraw) {
        rightCol.appendChild(createStatusButton('Win', '#4CAF50'));
        rightCol.appendChild(createStatusButton('Push', '#2196F3'));
        rightCol.appendChild(createStatusButton('Lost', '#B74141'));
      } else {
        // Only show button for existing status
        rightCol.appendChild(createStatusButton(data.gameWinLossDraw,
          data.gameWinLossDraw === 'Win' ? '#4CAF50' :
          data.gameWinLossDraw === 'Push' ? '#2196F3' :
          data.gameWinLossDraw === 'Lost' ? '#B74141' : null
        ));
      }

      container.appendChild(docDiv);

      if (i < docsData.length - 1) {
        const hr = document.createElement('hr');
        container.appendChild(hr);
      }
    });
  } catch (error) {
    console.error('Error loading updateWinLoss picks:', error);
    container.textContent = 'Failed to load picks.';
  }
}
