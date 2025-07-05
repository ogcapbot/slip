import { db } from '../firebaseInit.js';
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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
      docDiv.style.padding = '15px 20px';
      docDiv.style.borderRadius = '6px';
      docDiv.style.display = 'flex';
      docDiv.style.justifyContent = 'space-between';
      docDiv.style.alignItems = 'flex-start';
      docDiv.style.backgroundColor = (i % 2 === 1) ? '#f2f2f2' : '#fff'; // alternate gray

      // Highlight yellow if win/loss is null/""/"null"
      const val = data.gameWinLossDraw;
      const needsSelection = val === null || val === undefined || val === '' || val === 'null';
      if (needsSelection) {
        docDiv.style.backgroundColor = '#fff9db';
      }

      // Left text column container
      const leftCol = document.createElement('div');
      leftCol.style.flex = '1 1 auto';

      // teamSelected bold and bigger
      const teamSelected = document.createElement('div');
      teamSelected.textContent = data.teamSelected || 'N/A';
      teamSelected.style.fontWeight = 'bold';
      teamSelected.style.fontSize = '1.2em';
      teamSelected.style.marginBottom = '6px';
      leftCol.appendChild(teamSelected);

      // wagerType normal text
      const wagerType = document.createElement('div');
      wagerType.textContent = data.wagerType || 'N/A';
      wagerType.style.marginBottom = '4px';
      leftCol.appendChild(wagerType);

      // unit normal text
      const unitsSelected = document.createElement('div');
      unitsSelected.textContent = data.unit || 'N/A';
      leftCol.appendChild(unitsSelected);

      // Right images column container
      const rightCol = document.createElement('div');
      rightCol.style.display = 'flex';
      rightCol.style.flexDirection = 'column';
      rightCol.style.gap = '6px';
      rightCol.style.width = '60px';
      rightCol.style.flexShrink = '0';

      function createStatusImage(statusText, imgSrc) {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = statusText;
        img.title = statusText;
        img.style.width = '35px';
        img.style.height = '35px';
        img.style.cursor = 'pointer';
        img.style.borderRadius = '8px';
        img.style.objectFit = 'contain';
        img.style.userSelect = 'none';
        img.style.transition = 'opacity 0.3s ease';
        img.style.opacity = '1';

        img.addEventListener('click', async () => {
          if (data.gameWinLossDraw === statusText) {
            const pw = prompt('Password required to change existing status:');
            if (pw !== 'super123') {
              alert('Incorrect password. Status not changed.');
              return;
            }
            try {
              const docRef = doc(db, 'OfficialPicks', id);
              await updateDoc(docRef, { gameWinLossDraw: '' });
              data.gameWinLossDraw = '';
              rightCol.innerHTML = '';
              rightCol.appendChild(createStatusImage('Win', '/admin/images/greenWinner.png'));
              rightCol.appendChild(createStatusImage('Push', '/admin/images/bluePush.png'));
              rightCol.appendChild(createStatusImage('Lost', '/admin/images/redLost.png'));
              docDiv.style.backgroundColor = '#fff9db';
            } catch (error) {
              console.error('Error resetting win/loss:', error);
              alert('Failed to reset status.');
            }
            return;
          }

          try {
            const docRef = doc(db, 'OfficialPicks', id);
            await updateDoc(docRef, { gameWinLossDraw: statusText });
            data.gameWinLossDraw = statusText;

            // Highlight selected image, dim others
            Array.from(rightCol.children).forEach(image => {
              image.style.opacity = (image === img) ? '1' : '0.4';
              image.style.pointerEvents = (image === img) ? 'auto' : 'none';
            });

            docDiv.style.backgroundColor = ''; // remove highlight
          } catch (error) {
            console.error('Error updating win/loss:', error);
            alert('Failed to update status.');
          }
        });

        return img;
      }

      if (needsSelection) {
        rightCol.appendChild(createStatusImage('Win', '/admin/images/greenWinner.png'));
        rightCol.appendChild(createStatusImage('Push', '/admin/images/bluePush.png'));
        rightCol.appendChild(createStatusImage('Lost', '/admin/images/redLost.png'));
      } else {
        const statusMap = {
          'Win': '/admin/images/greenWinner.png',
          'Push': '/admin/images/bluePush.png',
          'Lost': '/admin/images/redLost.png'
        };
        rightCol.appendChild(createStatusImage(val, statusMap[val]));
      }

      docDiv.appendChild(leftCol);
      docDiv.appendChild(rightCol);
      container.appendChild(docDiv);
    });
  } catch (error) {
    console.error('Error loading updateWinLoss picks:', error);
    container.textContent = 'Failed to load picks.';
  }
}
