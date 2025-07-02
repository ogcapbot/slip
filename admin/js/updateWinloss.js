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

export async function loadUpdateWinLoss(container) {
  if (!container) {
    console.error('No container element provided to loadUpdateWinLoss');
    return;
  }

  container.innerHTML = ''; // Clear existing content

  try {
    const officialPicksRef = collection(db, 'OfficialPicks');
    const snapshot = await getDocs(officialPicksRef);

    const docsData = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    // Sort: docs with null/""/"null" first, others after
    docsData.sort((a, b) => {
      function needsUpdate(docData) {
        const val = docData.gameWinLossDraw;
        return val === null || val === undefined || val === '' || val === 'null';
      }
      if (needsUpdate(a.data) && !needsUpdate(b.data)) return -1;
      if (!needsUpdate(a.data) && needsUpdate(b.data)) return 1;
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

      // Highlight yellow if win/loss is null/""/"null"
      const val = data.gameWinLossDraw;
      const needsSelection = val === null || val === undefined || val === '' || val === 'null';
      if (needsSelection) {
        docDiv.style.backgroundColor = '#fff9db';
      }

      // Left text column
      const leftCol = document.createElement('div');
      leftCol.style.display = 'inline-block';
      leftCol.style.width = 'calc(100% - 130px)';
      leftCol.style.verticalAlign = 'top';

      // Right buttons column
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
          if (data.gameWinLossDraw === text) {
            // Existing status clicked, prompt for password to reset
            const pw = prompt('Password required to change existing status:');
            if (pw !== 'super123') {
              alert('Incorrect password. Status not changed.');
              return;
            }

            // Reset status to blank in DB
            try {
              const docRef = doc(db, 'OfficialPicks', id);
              await updateDoc(docRef, {
                gameWinLossDraw: ''
              });

              data.gameWinLossDraw = '';
              // Show all 3 buttons again
              rightCol.innerHTML = '';
              rightCol.appendChild(createStatusButton('Win', null));
              rightCol.appendChild(createStatusButton('Push', null));
              rightCol.appendChild(createStatusButton('Lost', null));
              docDiv.style.backgroundColor = '#fff9db'; // highlight yellow
            } catch (error) {
              console.error('Error resetting win/loss:', error);
              alert('Failed to reset status.');
            }
            return;
          }

          // Update DB with new status
          try {
            const docRef = doc(db, 'OfficialPicks', id);
            await updateDoc(docRef, {
              gameWinLossDraw: text
            });

            data.gameWinLossDraw = text;

            // Hide other buttons except clicked one
            Array.from(rightCol.children).forEach(button => {
              if (button !== btn) button.style.display = 'none';
            });

            // Update button colors accordingly
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

            // Remove yellow highlight because it's now set
            docDiv.style.backgroundColor = '';
          } catch (error) {
            console.error('Error updating win/loss:', error);
            alert('Failed to update status.');
          }
        });

        return btn;
      }

      // Show all 3 buttons if no selection, otherwise show only selected button
      if (needsSelection) {
        rightCol.appendChild(createStatusButton('Win', null));
        rightCol.appendChild(createStatusButton('Push', null));
        rightCol.appendChild(createStatusButton('Lost', null));
      } else {
        const color = val === 'Win' ? '#4CAF50' : val === 'Push' ? '#2196F3' : val === 'Lost' ? '#B74141' : null;
        rightCol.appendChild(createStatusButton(val, color));
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
