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

    let docsData = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    // Filter: only picks with sys_GameStatus equal to 'Pending'
    docsData = docsData.filter(({ data }) => data.sys_GameStatus === 'Pending');

    if (docsData.length === 0) {
      container.textContent = 'No picks needing update found.';
      return;
    }

    /**
     * Converts a given date to EST by subtracting a fixed 5-hour offset.
     * NOTE: This does not account for Daylight Saving Time (DST) adjustments.
     * This simplification is intentional to keep code simple as DST edge cases
     * are expected to be rare for submissions.
     * 
     * If DST handling becomes necessary in future, consider using Intl.DateTimeFormat
     * or libraries like Luxon for timezone-aware date manipulations.
     */
    function getESTDate(d) {
      const estOffsetMs = 5 * 60 * 60 * 1000; // fixed 5 hours in milliseconds
      return new Date(d.getTime() - estOffsetMs);
    }

    const now = new Date();
    const estNow = getESTDate(now);
    const estToday = new Date(estNow.getFullYear(), estNow.getMonth(), estNow.getDate()); // 00:00 EST today

    docsData.forEach(({ id, data }, i) => {
      // Parse submission timestamp (Firestore Timestamp or ISO string)
      let submittedDate = null;
      if (data.timestampSubmitted) {
        if (data.timestampSubmitted.toDate) {
          submittedDate = data.timestampSubmitted.toDate();
        } else {
          submittedDate = new Date(data.timestampSubmitted);
        }
      }

      let estSubmittedDate = submittedDate ? getESTDate(submittedDate) : null;
      let estSubDateOnly = estSubmittedDate ? new Date(estSubmittedDate.getFullYear(), estSubmittedDate.getMonth(), estSubmittedDate.getDate()) : null;

      let daysDiff = estSubDateOnly ? Math.floor((estToday - estSubDateOnly) / (1000 * 60 * 60 * 24)) : null;

      // Decide calendar image path
      let calendarImgSrc = '/admin/images/2daysold.png'; // default
      if (daysDiff === 0) calendarImgSrc = '/admin/images/today.png';
      else if (daysDiff === 1) calendarImgSrc = '/admin/images/yesterday.png';

      const val = data.sys_GameStatus || 'Pending';

      const docDiv = document.createElement('div');
      docDiv.style.marginBottom = '8px';
      docDiv.style.padding = '10px 15px';
      docDiv.style.borderRadius = '6px';
      docDiv.style.display = 'flex';
      docDiv.style.justifyContent = 'space-between';
      docDiv.style.alignItems = 'center';
      docDiv.style.backgroundColor = (i % 2 === 1) ? '#f2f2f2' : '#fff';

      // Calendar image container
      const calendarCol = document.createElement('div');
      calendarCol.style.flexShrink = '0';
      calendarCol.style.marginRight = '10px';

      const calendarImg = document.createElement('img');
      calendarImg.src = calendarImgSrc;
      calendarImg.alt = 'Submission Date';
      calendarImg.title = 'Submission Date';
      calendarImg.style.width = '50px';
      calendarImg.style.height = '50px';
      calendarImg.style.objectFit = 'contain';
      calendarCol.appendChild(calendarImg);

      // Left text column container
      const leftCol = document.createElement('div');
      leftCol.style.flex = '1 1 auto';
      leftCol.style.textAlign = 'left';

      const teamSelected = document.createElement('div');
      teamSelected.textContent = data.user_SelectedTeam || 'N/A';
      teamSelected.style.fontWeight = 'bold';
      teamSelected.style.fontSize = '1.2em';
      teamSelected.style.marginBottom = '4px';
      leftCol.appendChild(teamSelected);

      const wagerType = document.createElement('div');
      wagerType.textContent = data.user_WagerType || 'N/A';
      wagerType.style.marginBottom = '2px';
      leftCol.appendChild(wagerType);

      const unitsSelected = document.createElement('div');
      unitsSelected.textContent = data.user_UnitDisplay || 'N/A';
      leftCol.appendChild(unitsSelected);

      // Right images column container
      const rightCol = document.createElement('div');
      rightCol.style.display = 'flex';
      rightCol.style.flexDirection = 'column';
      rightCol.style.gap = '6px';
      rightCol.style.width = '60px';
      rightCol.style.flexShrink = '0';

      function createStatusImage(statusText, imgSrc, rowIndex, currentStatus) {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = statusText;
        img.title = statusText;
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.cursor = 'pointer';
        img.style.borderRadius = '8px';
        img.style.objectFit = 'contain';
        img.style.userSelect = 'none';
        img.style.transition = 'opacity 0.3s ease';

        // Highlight if current status matches
        if (currentStatus === statusText) {
          img.style.opacity = '1';
          img.style.pointerEvents = 'auto';
        } else {
          img.style.opacity = '0.4';
          img.style.pointerEvents = 'auto';
        }

        img.addEventListener('click', async () => {
          if (data.sys_GameStatus === statusText) {
            // Reset status to 'Pending' and reset change count
            try {
              const docRef = doc(db, 'OfficialPicks', id);
              await updateDoc(docRef, { 
                sys_GameStatus: 'Pending',
                sys_GameStatusChangeCount: 0
              });
              data.sys_GameStatus = 'Pending';
              data.sys_GameStatusChangeCount = 0;

              rightCol.innerHTML = '';
              rightCol.appendChild(createStatusImage('Win', '/admin/images/greenWinner.png', rowIndex, 'Pending'));
              rightCol.appendChild(createStatusImage('Push', '/admin/images/bluePush.png', rowIndex, 'Pending'));
              rightCol.appendChild(createStatusImage('Lost', '/admin/images/redLost.png', rowIndex, 'Pending'));

              docDiv.style.backgroundColor = (rowIndex % 2 === 1) ? '#f2f2f2' : '#fff';
            } catch (error) {
              console.error('Error resetting status:', error);
              alert('Failed to reset status.');
            }
            return;
          }

          try {
            const docRef = doc(db, 'OfficialPicks', id);

            // Increment sys_GameStatusChangeCount safely
            const newCount = (data.sys_GameStatusChangeCount || 0) + 1;

            await updateDoc(docRef, { 
              sys_GameStatus: statusText,
              sys_GameStatusChangeCount: newCount
            });

            data.sys_GameStatus = statusText;
            data.sys_GameStatusChangeCount = newCount;

            Array.from(rightCol.children).forEach(image => {
              image.style.opacity = (image === img) ? '1' : '0.4';
              image.style.pointerEvents = (image === img) ? 'auto' : 'none';
            });

            docDiv.style.backgroundColor = (rowIndex % 2 === 1) ? '#f2f2f2' : '#fff';
          } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status.');
          }
        });

        return img;
      }

      rightCol.appendChild(createStatusImage('Win', '/admin/images/greenWinner.png', i, val));
      rightCol.appendChild(createStatusImage('Push', '/admin/images/bluePush.png', i, val));
      rightCol.appendChild(createStatusImage('Lost', '/admin/images/redLost.png', i, val));

      docDiv.appendChild(calendarCol);
      docDiv.appendChild(leftCol);
      docDiv.appendChild(rightCol);

      container.appendChild(docDiv);
    });
  } catch (error) {
    console.error('Error loading updateWinLoss picks:', error);
    container.textContent = 'Failed to load picks.';
  }
}
