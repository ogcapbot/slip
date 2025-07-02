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

function createStyledButton(text) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = text;
  btn.className = 'pick-btn blue';
  btn.style.paddingTop = '6px';
  btn.style.paddingBottom = '6px';
  btn.style.margin = '0';
  btn.style.minWidth = '0';
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

      // Flex container for info + button side by side
      const docDiv = document.createElement('div');
      docDiv.style.display = 'flex';
      docDiv.style.justifyContent = 'space-between';
      docDiv.style.alignItems = 'center';
      docDiv.style.marginBottom = '15px';

      // Info container (left side)
      const infoDiv = document.createElement('div');
      infoDiv.style.flex = '1';

      requiredFields.forEach(field => {
        const p = document.createElement('p');
        p.style.margin = '2px 0';
        let value = data[field] !== undefined ? data[field] : 'N/A';
        if (field === 'timestampSubmitted') {
          value = formatTimestamp(value);
        }
        p.textContent = `${field}: ${value}`;
        infoDiv.appendChild(p);
      });

      docDiv.appendChild(infoDiv);

      // Update Status button (right side)
      const updateBtn = createStyledButton('Update Status');
      updateBtn.style.marginLeft = '15px';
      updateBtn.style.flexShrink = '0'; // don't shrink the button

      updateBtn.addEventListener('click', () => {
        showUpdateStatusPopup(docSnap.id, docDiv.parentNode, docDiv);
      });

      docDiv.appendChild(updateBtn);

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

// Popup dialog to choose status and confirm update
function showUpdateStatusPopup(docId, container, docDiv) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '9999';

  // Popup container
  const popup = document.createElement('div');
  popup.style.background = '#fff';
  popup.style.padding = '20px';
  popup.style.borderRadius = '8px';
  popup.style.minWidth = '280px';
  popup.style.boxSizing = 'border-box';
  popup.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  popup.style.fontFamily = "'Oswald', sans-serif";
  popup.style.fontSize = '14px';
  popup.style.color = '#444';

  // Title
  const title = document.createElement('h3');
  title.textContent = 'Update Pick Status';
  title.style.marginTop = '0';
  title.style.marginBottom = '12px';
  popup.appendChild(title);

  // Dropdown select
  const select = document.createElement('select');
  ['Won', 'Lost', 'Push'].forEach(optionText => {
    const option = document.createElement('option');
    option.value = optionText;
    option.textContent = optionText;
    select.appendChild(option);
  });
  select.style.width = '100%';
  select.style.padding = '8px';
  select.style.fontSize = '14px';
  select.style.marginBottom = '16px';
  select.style.borderRadius = '6px';
  select.style.border = '1px solid #ccc';
  popup.appendChild(select);

  // Buttons container
  const btnContainer = document.createElement('div');
  btnContainer.style.textAlign = 'right';

  // Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'pick-btn blue';
  cancelBtn.style.marginRight = '10px';
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  // Confirm button
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Update Status';
  confirmBtn.className = 'pick-btn red';

  confirmBtn.addEventListener('click', async () => {
    const selectedValue = select.value;
    try {
      const docRef = doc(db, 'OfficialPicks', docId);
      await updateDoc(docRef, { gameWinLossDraw: selectedValue });
      alert(`Status updated to "${selectedValue}" successfully.`);

      // Remove popup and also remove this docDiv + separator (hr) from container to reflect update
      document.body.removeChild(overlay);
      if (container && docDiv) {
        container.removeChild(docDiv);

        // Also remove the hr that immediately follows docDiv if exists
        const nextSibling = container.firstChild;
        if (nextSibling && nextSibling.tagName === 'HR') {
          container.removeChild(nextSibling);
        }
      }
    } catch (error) {
      alert('Failed to update status. See console for details.');
      console.error('Error updating status:', error);
    }
  });

  btnContainer.appendChild(cancelBtn);
  btnContainer.appendChild(confirmBtn);

  popup.appendChild(btnContainer);

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}
