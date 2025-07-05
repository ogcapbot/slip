import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const statsContainer = document.getElementById('statsContainer'); // main container in your admin page

const statusIcons = {
  Win: '/admin/images/greenWinner.png',
  Lost: '/admin/images/redLost.png',
  Push: '/admin/images/bluePush.png',
  Pending: '/admin/images/grayPending.png' // make sure you add this
};

const STATUS_VALUES = ['Win', 'Lost', 'Push', 'Pending'];

function getESTDate(d) {
  // Fixed offset -5h EST (no DST handling for simplicity)
  const estOffsetMs = 5 * 60 * 60 * 1000;
  return new Date(d.getTime() - estOffsetMs);
}

// Returns date at 00:00 EST for a given JS Date
function estMidnightDate(date) {
  const estDate = getESTDate(date);
  return new Date(estDate.getFullYear(), estDate.getMonth(), estDate.getDate());
}

// Returns start/end Date objects for Today or Yesterday in EST
function getDateRange(day) {
  const now = new Date();
  const todayEst = estMidnightDate(now);
  let start, end;

  if (day === 'today') {
    start = todayEst;
    end = new Date(start);
    end.setDate(start.getDate() + 1);
  } else if (day === 'yesterday') {
    end = todayEst;
    start = new Date(end);
    start.setDate(end.getDate() - 1);
  } else {
    throw new Error('Invalid day for date range');
  }

  return { start, end };
}

// Fetch picks from Firestore filtered by date range (EST)
async function fetchPicksByDate(day) {
  const { start, end } = getDateRange(day);

  // Firestore query with timestampSubmitted >= start and < end
  const officialPicksRef = collection(db, 'OfficialPicks');
  const q = query(
    officialPicksRef,
    where('timestampSubmitted', '>=', start),
    where('timestampSubmitted', '<', end)
  );

  const snapshot = await getDocs(q);
  const picks = snapshot.docs.map(doc => ({
    id: doc.id,
    data: doc.data()
  }));

  return picks;
}

// Count statuses and prepare summary data
function computeStats(picks) {
  const counts = {
    Win: 0,
    Lost: 0,
    Push: 0,
    Pending: 0,
    Total: picks.length
  };

  picks.forEach(({ data }) => {
    const val = data.gameWinLossDraw;
    if (val === null || val === undefined || val === '' || val === 'null') {
      counts.Pending++;
    } else if (STATUS_VALUES.includes(val)) {
      counts[val]++;
    }
  });

  return counts;
}

// Create a status icon element with count and tooltip
function createStatusSummaryIcon(status, count) {
  const container = document.createElement('div');
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';
  container.style.marginRight = '15px';
  container.style.cursor = 'default';

  const img = document.createElement('img');
  img.src = statusIcons[status];
  img.alt = status;
  img.title = `${status}: ${count}`;
  img.style.width = '24px';
  img.style.height = '24px';
  img.style.marginRight = '6px';

  const text = document.createElement('span');
  text.textContent = count;
  text.style.fontWeight = '600';
  text.style.fontSize = '14px';

  container.appendChild(img);
  container.appendChild(text);

  return container;
}

// Render the stats summary bar
function renderStatsSummary(counts, container) {
  container.innerHTML = ''; // clear

  const totalText = document.createElement('div');
  totalText.textContent = `Total Picks: ${counts.Total}`;
  totalText.style.fontWeight = '700';
  totalText.style.fontSize = '16px';
  totalText.style.marginBottom = '8px';
  container.appendChild(totalText);

  const summaryRow = document.createElement('div');
  summaryRow.style.display = 'flex';
  summaryRow.style.marginBottom = '12px';

  STATUS_VALUES.forEach(status => {
    summaryRow.appendChild(createStatusSummaryIcon(status, counts[status] || 0));
  });

  container.appendChild(summaryRow);
}

// Create a small clickable status image for listings
function createStatusButton(statusText, pickId, currentStatus, onStatusChange) {
  const img = document.createElement('img');
  img.src = statusIcons[statusText];
  img.alt = statusText;
  img.title = statusText;
  img.style.width = '30px';
  img.style.height = '30px';
  img.style.cursor = 'pointer';
  img.style.borderRadius = '6px';
  img.style.objectFit = 'contain';
  img.style.marginRight = '6px';
  img.style.opacity = statusText === currentStatus ? '1' : '0.4';

  img.addEventListener('click', async () => {
    if (currentStatus === statusText) {
      const pw = prompt('Password required to reset status:');
      if (pw !== 'super123') {
        alert('Incorrect password. Status not changed.');
        return;
      }
      // Reset status
      try {
        const docRef = doc(db, 'OfficialPicks', pickId);
        await updateDoc(docRef, { gameWinLossDraw: '' });
        onStatusChange('');
      } catch (error) {
        console.error('Error resetting status:', error);
        alert('Failed to reset status.');
      }
      return;
    }

    // Set new status
    try {
      const docRef = doc(db, 'OfficialPicks', pickId);
      await updateDoc(docRef, { gameWinLossDraw: statusText });
      onStatusChange(statusText);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    }
  });

  return img;
}

// Render a compact listing for picks
function renderPickListing(picks, container) {
  container.innerHTML = ''; // clear

  picks.forEach(({ id, data }) => {
    const listingDiv = document.createElement('div');
    listingDiv.style.display = 'flex';
    listingDiv.style.alignItems = 'center';
    listingDiv.style.justifyContent = 'space-between';
    listingDiv.style.padding = '6px 12px';
    listingDiv.style.borderBottom = '1px solid #ccc';
    listingDiv.style.fontSize = '13px';
    listingDiv.style.fontFamily = 'Arial, sans-serif';
    listingDiv.style.color = '#222';

    // Left text block: team, wager, units
    const leftBlock = document.createElement('div');
    leftBlock.style.flex = '1 1 auto';
    leftBlock.style.textAlign = 'left';

    const teamEl = document.createElement('div');
    teamEl.textContent = data.teamSelected || 'N/A';
    teamEl.style.fontWeight = '600';
    leftBlock.appendChild(teamEl);

    const wagerEl = document.createElement('div');
    wagerEl.textContent = data.wagerType || 'N/A';
    wagerEl.style.fontSize = '12px';
    wagerEl.style.color = '#555';
    leftBlock.appendChild(wagerEl);

    const unitsEl = document.createElement('div');
    unitsEl.textContent = data.unit || 'N/A';
    unitsEl.style.fontSize = '12px';
    unitsEl.style.color = '#555';
    leftBlock.appendChild(unitsEl);

    listingDiv.appendChild(leftBlock);

    // Right buttons block: Win, Push, Lost, Pending (gray)
    const rightBlock = document.createElement('div');
    rightBlock.style.display = 'flex';
    rightBlock.style.alignItems = 'center';

    // Current status or pending if empty
    let currentStatus = data.gameWinLossDraw;
    if (currentStatus === null || currentStatus === undefined || currentStatus === '' || currentStatus === 'null') {
      currentStatus = 'Pending';
    }

    STATUS_VALUES.forEach(status => {
      rightBlock.appendChild(createStatusButton(status, id, currentStatus, (newStatus) => {
        // Update UI on status change
        currentStatus = newStatus;
        // Re-render this pick's buttons to reflect change:
        rightBlock.innerHTML = '';
        STATUS_VALUES.forEach(s => rightBlock.appendChild(createStatusButton(s, id, currentStatus, arguments.callee)));
      }));
    });

    listingDiv.appendChild(rightBlock);

    container.appendChild(listingDiv);
  });

  if (picks.length === 0) {
    container.textContent = 'No picks found for selected date.';
  }
}

// Main function to load stats UI for given day filter ('today' or 'yesterday')
export async function loadStatsForDay(day) {
  if (!statsContainer) {
    console.error('Stats container element not found!');
    return;
  }

  statsContainer.innerHTML = '';

  // Create tabs UI
  const tabsDiv = document.createElement('div');
  tabsDiv.style.marginBottom = '12px';

  ['today', 'yesterday'].forEach(d => {
    const tab = document.createElement('button');
    tab.textContent = d.charAt(0).toUpperCase() + d.slice(1);
    tab.style.marginRight = '10px';
    tab.style.padding = '6px 12px';
    tab.style.borderRadius = '6px';
    tab.style.border = '1px solid #ccc';
    tab.style.cursor = 'pointer';
    tab.style.backgroundColor = d === day ? '#4CAF50' : '#fff';
    tab.style.color = d === day ? '#fff' : '#000';

    tab.addEventListener('click', () => {
      loadStatsForDay(d);
    });

    tabsDiv.appendChild(tab);
  });

  statsContainer.appendChild(tabsDiv);

  // Loading message
  const loadingMsg = document.createElement('div');
  loadingMsg.textContent = 'Loading stats...';
  loadingMsg.style.marginBottom = '10px';
  statsContainer.appendChild(loadingMsg);

  // Fetch picks for selected day
  let picks = [];
  try {
    picks = await fetchPicksByDate(day);
  } catch (error) {
    loadingMsg.textContent = 'Failed to load picks.';
    console.error('Error fetching picks:', error);
    return;
  }

  // Remove loading message
  statsContainer.removeChild(loadingMsg);

  // Compute and render stats summary
  const counts = computeStats(picks);
  const summaryDiv = document.createElement('div');
  statsContainer.appendChild(summaryDiv);
  renderStatsSummary(counts, summaryDiv);

  // Render picks listing
  const picksDiv = document.createElement('div');
  picksDiv.style.maxHeight = '400px';
  picksDiv.style.overflowY = 'auto';
  picksDiv.style.border = '1px solid #ddd';
  picksDiv.style.borderRadius = '6px';
  picksDiv.style.padding = '8px';
  statsContainer.appendChild(picksDiv);

  renderPickListing(picks, picksDiv);
}
