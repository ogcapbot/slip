import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const statusIcons = {
  Win: '/admin/images/greenWinner.png',
  Lost: '/admin/images/redLost.png',
  Push: '/admin/images/bluePush.png',
  Pending: '/admin/images/grayPending.png'
};

const STATUS_VALUES = ['Win', 'Lost', 'Push', 'Pending'];

function getESTDate(d) {
  const estOffsetMs = 5 * 60 * 60 * 1000;
  return new Date(d.getTime() - estOffsetMs);
}

function estMidnightDate(date) {
  const estDate = getESTDate(date);
  return new Date(estDate.getFullYear(), estDate.getMonth(), estDate.getDate());
}

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

async function fetchPicksByDate(day) {
  const { start, end } = getDateRange(day);
  const officialPicksRef = collection(db, 'OfficialPicks');
  const q = query(
    officialPicksRef,
    where('timestamp', '>=', start),
    where('timestamp', '<', end)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    data: doc.data()
  }));
}

function computeStats(picks) {
  const counts = {
    Win: 0,
    Lost: 0,
    Push: 0,
    Pending: 0,
    Total: picks.length,
    UnitsWin: 0,
    UnitsLost: 0,
    UnitsPush: 0,
    UnitsPending: 0,
  };

  picks.forEach(({ data }) => {
    const val = data.gameWinLossDraw;
    const unitValue = parseFloat(data.unit) || 0;
    if (val === null || val === undefined || val === '' || val === 'null') {
      counts.Pending++;
      counts.UnitsPending += unitValue;
    } else if (STATUS_VALUES.includes(val)) {
      counts[val]++;
      if (val === 'Win') counts.UnitsWin += unitValue;
      else if (val === 'Lost') counts.UnitsLost += unitValue;
      else if (val === 'Push') counts.UnitsPush += unitValue;
    }
  });

  // Fix float precision (round to 2 decimals)
  counts.UnitsWin = Math.round(counts.UnitsWin * 100) / 100;
  counts.UnitsLost = Math.round(counts.UnitsLost * 100) / 100;
  counts.UnitsPush = Math.round(counts.UnitsPush * 100) / 100;
  counts.UnitsPending = Math.round(counts.UnitsPending * 100) / 100;

  return counts;
}

function formatLongDateEST(day) {
  const now = new Date();
  const estDate = new Date(now.getTime() - 5 * 3600 * 1000);
  let dateToFormat;

  if (day === 'today') {
    dateToFormat = estDate;
  } else if (day === 'yesterday') {
    dateToFormat = new Date(estDate);
    dateToFormat.setDate(dateToFormat.getDate() - 1);
  } else if (day === 'all') {
    dateToFormat = null;
  }

  if (!dateToFormat) return '';

  return dateToFormat.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function createStatusSummaryIcon(status, count) {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.margin = '0 20px';
  container.style.cursor = 'default';

  const img = document.createElement('img');
  img.src = statusIcons[status];
  img.alt = status;
  img.title = `${status}: ${count}`;
  img.style.width = '50px';
  img.style.height = '50px';
  img.style.marginBottom = '6px';

  const text = document.createElement('span');
  text.textContent = count;
  text.style.fontWeight = '700';
  text.style.fontSize = '16px';

  container.appendChild(img);
  container.appendChild(text);

  return container;
}

function renderStatsSummary(counts, container) {
  container.innerHTML = '';

  const completed = counts.Win + counts.Lost + counts.Push;
  const winPercent = completed ? ((counts.Win / completed) * 100).toFixed(1) : '0.0';

  // Create container div to hold the top stats horizontally with spacing
  const topStatsDiv = document.createElement('div');
  topStatsDiv.style.display = 'flex';
  topStatsDiv.style.justifyContent = 'space-between';
  topStatsDiv.style.alignItems = 'center';
  topStatsDiv.style.marginBottom = '10px';

  // Win Percentage
  const winPercentDiv = document.createElement('div');
  winPercentDiv.textContent = `Win Percentage: ${winPercent}%`;
  winPercentDiv.style.fontWeight = '700';
  winPercentDiv.style.fontSize = '20px';
  winPercentDiv.style.flex = '1';
  winPercentDiv.style.textAlign = 'left';
  topStatsDiv.appendChild(winPercentDiv);

  // Total Units with icon and text
  const totalUnitsDiv = document.createElement('div');
  totalUnitsDiv.style.display = 'flex';
  totalUnitsDiv.style.alignItems = 'center';
  totalUnitsDiv.style.justifyContent = 'center';
  totalUnitsDiv.style.flex = '1';
  totalUnitsDiv.style.fontWeight = '900';
  totalUnitsDiv.style.fontSize = '20px';

  // Decide plus or minus or pending image
  const netUnits = counts.UnitsWin - counts.UnitsLost;
  const plusMinusImg = document.createElement('img');
  plusMinusImg.style.width = '24px';
  plusMinusImg.style.height = '24px';
  plusMinusImg.style.marginRight = '6px';
  plusMinusImg.style.userSelect = 'none';
  if (netUnits > 0) {
    plusMinusImg.src = 'https://capper.ogcapperbets.com/admin/images/plus.png';
    plusMinusImg.alt = 'Positive Units';
  } else if (netUnits < 0) {
    plusMinusImg.src = 'https://capper.ogcapperbets.com/admin/images/minus.png';
    plusMinusImg.alt = 'Negative Units';
  } else {
    plusMinusImg.src = 'https://capper.ogcapperbets.com/admin/images/grayPending.png';
    plusMinusImg.alt = 'Pending Units';
  }
  totalUnitsDiv.appendChild(plusMinusImg);

  const unitsTextSpan = document.createElement('span');
  unitsTextSpan.textContent = `${Math.abs(netUnits).toFixed(2)} Unit(s)`;
  totalUnitsDiv.appendChild(unitsTextSpan);
  topStatsDiv.appendChild(totalUnitsDiv);

  // Total Picks
  const totalPicksDiv = document.createElement('div');
  totalPicksDiv.textContent = `Total Picks: ${counts.Total}`;
  totalPicksDiv.style.fontWeight = '700';
  totalPicksDiv.style.fontSize = '20px';
  totalPicksDiv.style.flex = '1';
  totalPicksDiv.style.textAlign = 'right';
  topStatsDiv.appendChild(totalPicksDiv);

  container.appendChild(topStatsDiv);

  // Below that, the four status blocks with units and counts, aligned evenly:
  const statusRow = document.createElement('div');
  statusRow.style.display = 'flex';
  statusRow.style.justifyContent = 'space-around';
  statusRow.style.marginTop = '15px';
  statusRow.style.fontFamily = 'Arial, sans-serif';

  // Helper to create each block
  function createStatusBlock(name, units, count, iconSrc, iconAlt) {
    const block = document.createElement('div');
    block.style.textAlign = 'center';

    const unitsEl = document.createElement('div');
    unitsEl.textContent = `${units.toFixed(2)} Unit(s)`;
    unitsEl.style.fontWeight = '700';
    unitsEl.style.fontSize = '16px';
    unitsEl.style.marginBottom = '4px';
    block.appendChild(unitsEl);

    const iconImg = document.createElement('img');
    iconImg.src = iconSrc;
    iconImg.alt = iconAlt;
    iconImg.style.width = '50px';
    iconImg.style.height = '50px';
    iconImg.style.userSelect = 'none';
    block.appendChild(iconImg);

    const countEl = document.createElement('div');
    countEl.textContent = count;
    countEl.style.fontWeight = '700';
    countEl.style.fontSize = '18px';
    countEl.style.marginTop = '6px';
    block.appendChild(countEl);

    // No label text as per latest request

    return block;
  }

  statusRow.appendChild(createStatusBlock('Winner', counts.UnitsWin, counts.Win, statusIcons.Win, 'Winner'));
  statusRow.appendChild(createStatusBlock('Lost', counts.UnitsLost, counts.Lost, statusIcons.Lost, 'Lost'));
  statusRow.appendChild(createStatusBlock('Push', counts.UnitsPush, counts.Push, statusIcons.Push, 'Push'));
  statusRow.appendChild(createStatusBlock('Pending', counts.UnitsPending, counts.Pending, statusIcons.Pending, 'Pending'));

  container.appendChild(statusRow);
}

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

function renderPickListing(picks, container) {
  container.innerHTML = '';

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

    const rightBlock = document.createElement('div');
    rightBlock.style.display = 'flex';
    rightBlock.style.alignItems = 'center';

    let currentStatus = data.gameWinLossDraw;
    if (currentStatus === null || currentStatus === undefined || currentStatus === '' || currentStatus === 'null') {
      currentStatus = 'Pending';
    }

    rightBlock.appendChild(createStatusButton(currentStatus, id, currentStatus, (newStatus) => {
      currentStatus = newStatus;
      rightBlock.innerHTML = '';
      rightBlock.appendChild(createStatusButton(currentStatus, id, currentStatus, arguments.callee));
    }));

    listingDiv.appendChild(rightBlock);
    container.appendChild(listingDiv);
  });

  if (picks.length === 0) {
    container.textContent = 'No picks found for selected date.';
  }
}

function formatLongDateTimeEST() {
  const now = new Date(new Date().getTime() - 5 * 3600 * 1000);
  return now.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
}

function getStatusEmoji(status) {
  switch (status) {
    case 'Win': return '✅ - Win';
    case 'Lost': return '❌ - Lost';
    case 'Push': return '🟦 - Push';
    default: return '⚙️ - Pending';
  }
}

function generateTextStatsOutput(day, picks) {
  const counts = computeStats(picks);
  const completed = counts.Win + counts.Lost + counts.Push;
  const winPercent = completed ? ((counts.Win / completed) * 100).toFixed(1) : '0.0';

  const longDateStr = formatLongDateEST(day);
  const longDateTimeStr = formatLongDateTimeEST();

  return `
═══════════════════════
######## OFFICIAL STATS
═══════════════════════
Date: ${longDateStr}

🟧 - Official Picks Total:   ${counts.Total}
✅ - Official Pick Winners:  ${counts.Win} - ${winPercent}%
❌ - Official Picks Lost:    ${counts.Lost} - ${counts.Lost && completed ? ((counts.Lost / completed) * 100).toFixed(1) : '0.0'}%
🟦 - Official Picks Pushed:  ${counts.Push} - ${counts.Push && completed ? ((counts.Push / completed) * 100).toFixed(1) : '0.0'}%
⚙️ - Official Picks Pending: ${counts.Pending}

═══════════════════════
######## OFFICIAL PICKS
═══════════════════════
${picks.map(({ data }) => `
═══════════════════════
${data.teamSelected}
${data.wagerType}
${data.unit}
Status: ${getStatusEmoji(data.gameWinLossDraw)}
`).join('')}

═══════════════════════
######## THANK YOU FOR TRUSTING OGCB
═══════════════════════
######## STRICT CONFIDENTIALITY NOTICE
═══════════════════════
All OG Capper Bets Content is PRIVATE. Leaking, Stealing or Sharing ANY Content is STRICTLY PROHIBITED. Violation = Termination. No Refund. No Appeal. Lifetime Ban.
Created: ${longDateTimeStr}
`.trim();
}

// New clean text function to fix spacing issues on paste
function cleanOutputText(text) {
  return text
    // Normalize line Endings to \n
    .replace(/\r\n?/g, '\n')
    // Remove zero-width and other invisible Unicode chars
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Collapse multiple blank lines to a single blank line
    .replace(/\n{3,}/g, '\n\n')
    // Trim trailing spaces on each line
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');
}

function showTextOutputModal(textOutput) {
  let modal = document.getElementById('textOutputModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'textOutputModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '100000';

    const content = document.createElement('div');
    content.style.backgroundColor = '#222';
    content.style.color = '#eee';
    content.style.padding = '20px';
    content.style.borderRadius = '10px';
    content.style.width = '85vw';
    content.style.maxWidth = '500px';
    content.style.maxHeight = '80vh';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    const textarea = document.createElement('textarea');
    textarea.style.flex = '1';
    textarea.style.width = '100%';
    textarea.style.resize = 'none';
    textarea.style.backgroundColor = '#111';
    textarea.style.color = '#eee';
    textarea.style.fontFamily = 'monospace';
    textarea.style.fontSize = '14px';
    textarea.style.padding = '10px';
    textarea.style.minHeight = '50vh';
    textarea.style.whiteSpace = 'pre'; // preserve formatting exactly
    textarea.id = 'textOutputArea';

    const btnContainer = document.createElement('div');
    btnContainer.style.marginTop = '12px';
    btnContainer.style.textAlign = 'right';

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy All';
    copyBtn.style.marginRight = '12px';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';

    btnContainer.appendChild(copyBtn);
    btnContainer.appendChild(closeBtn);

    content.appendChild(textarea);
    content.appendChild(btnContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);

    copyBtn.addEventListener('click', async () => {
      const textarea = document.getElementById('textOutputArea');
      if (!textarea) return;
      const rawText = textarea.value;

      // Convert line breaks to <br> for HTML clipboard
      const htmlText = rawText.replace(/\n/g, '<br>');

      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlText], { type: 'text/html' }),
            'text/plain': new Blob([rawText], { type: 'text/plain' }),
          })
        ]);
        alert('Copied text with HTML line breaks to clipboard!');
      } catch (err) {
        console.error('Clipboard write failed:', err);
        alert('Failed to copy.');
      }
    });

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', e => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  const textarea = document.getElementById('textOutputArea');
  textarea.value = textOutput;
  modal.style.display = 'flex';
}

async function showStatsAsText(day) {
  try {
    let picks = [];
    if (day === 'all') {
      const officialPicksRef = collection(db, 'OfficialPicks');
      const q = query(officialPicksRef);
      const snapshot = await getDocs(q);
      picks = snapshot.docs.slice(0, 25).map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
    } else {
      picks = await fetchPicksByDate(day);
    }

    const textOutput = generateTextStatsOutput(day, picks);
    showTextOutputModal(textOutput);
  } catch (error) {
    console.error('Failed to show stats as text:', error);
    alert('Error loading stats as text.');
  }
}

export async function loadStatsForDay(day) {
  const mainContent = document.getElementById('adminMainContent');
  if (!mainContent) {
    console.error('Main content container not found!');
    return;
  }
  mainContent.innerHTML = '';

  let statsContainer = document.getElementById('statsContainer');
  if (!statsContainer) {
    statsContainer = document.createElement('div');
    statsContainer.id = 'statsContainer';
    mainContent.appendChild(statsContainer);
  } else {
    statsContainer.innerHTML = '';
  }

  const tabsDiv = document.createElement('div');
  tabsDiv.style.marginBottom = '12px';
  tabsDiv.style.display = 'flex';
  tabsDiv.style.gap = '12px';

  const tabNames = ['today', 'yesterday', 'all', 'text', 'image'];
  let currentDay = day;
  let imageBtn = null;
  let textBtn = null;

  tabNames.forEach(d => {
    const btn = document.createElement('button');
    btn.textContent = d.charAt(0).toUpperCase() + d.slice(1);
    btn.style.padding = '6px 14px';
    btn.style.borderRadius = '6px';
    btn.style.border = '1px solid #ccc';
    btn.style.cursor = 'pointer';

    if (d === day) {
      btn.style.backgroundColor = '#4CAF50';
      btn.style.color = '#fff';
    } else {
      btn.style.backgroundColor = '#fff';
      btn.style.color = '#000';
    }

    if (d === 'image') {
      imageBtn = btn;
      imageBtn.disabled = day === 'all';
      if (imageBtn.disabled) {
        imageBtn.style.opacity = '0.5';
        imageBtn.style.cursor = 'not-allowed';
      }
    }

    if (d === 'text') {
      textBtn = btn;
    }

    btn.addEventListener('click', () => {
      if (d === 'image') {
        if (imageBtn.disabled) {
          alert("Image generation disabled on 'All' filter.");
          return;
        }
        generateImageModal(currentDay);
        return;
      }

      if (d === 'text') {
        showStatsAsText(currentDay);
        return;
      }

      currentDay = d;
      loadStatsForDay(currentDay);

      if (imageBtn) {
        imageBtn.disabled = currentDay === 'all';
        if (imageBtn.disabled) {
          imageBtn.style.opacity = '0.5';
          imageBtn.style.cursor = 'not-allowed';
        } else {
          imageBtn.style.opacity = '1';
          imageBtn.style.cursor = 'pointer';
        }
      }
    });

    tabsDiv.appendChild(btn);
  });

  statsContainer.appendChild(tabsDiv);

  const longDateStr = formatLongDateEST(day);
  if (longDateStr) {
    const dateLabel = document.createElement('div');
    dateLabel.textContent = longDateStr;
    dateLabel.style.color = '#666';
    dateLabel.style.fontSize = '12px';
    dateLabel.style.marginBottom = '8px';
    dateLabel.style.textAlign = 'center';
    statsContainer.appendChild(dateLabel);
  }

  const loadingMsg = document.createElement('div');
  loadingMsg.textContent = 'Loading stats...';
  loadingMsg.style.marginBottom = '10px';
  statsContainer.appendChild(loadingMsg);

  let picks = [];
  try {
    if (day === 'all') {
      const officialPicksRef = collection(db, 'OfficialPicks');
      const q = query(officialPicksRef);
      const snapshot = await getDocs(q);
      picks = snapshot.docs.slice(0, 25).map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
    } else {
      picks = await fetchPicksByDate(day);
    }
  } catch (error) {
    loadingMsg.textContent = 'Failed to load picks.';
    console.error('Error fetching picks:', error);
    return;
  }

  statsContainer.removeChild(loadingMsg);

  const counts = computeStats(picks);
  const summaryDiv = document.createElement('div');
  statsContainer.appendChild(summaryDiv);
  renderStatsSummary(counts, summaryDiv);

  const picksDiv = document.createElement('div');
  picksDiv.style.maxHeight = '400px';
  picksDiv.style.overflowY = 'auto';
  picksDiv.style.border = '1px solid #ddd';
  picksDiv.style.borderRadius = '6px';
  picksDiv.style.padding = '8px';
  statsContainer.appendChild(picksDiv);

  renderPickListing(picks, picksDiv);
}

// Generate modal with rendered HTML for image output (instead of canvas snapshot)
async function generateImageModal(day) {
  let picks = [];
  try {
    if (day === 'all') {
      const officialPicksRef = collection(db, 'OfficialPicks');
      const q = query(officialPicksRef);
      const snapshot = await getDocs(q);
      picks = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    } else {
      picks = await fetchPicksByDate(day);
    }
  } catch (error) {
    alert('Failed to fetch picks for image generation.');
    return;
  }

  const counts = computeStats(picks);
  const longDateStr = formatLongDateEST(day);

  // Create modal
  let modal = document.getElementById('imageModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '100000';

    const content = document.createElement('div');
    content.style.backgroundColor = '#fff';
    content.style.color = '#000';
    content.style.padding = '20px';
    content.style.borderRadius = '10px';
    content.style.width = '90vw';
    content.style.maxWidth = '600px';
    content.style.maxHeight = '90vh';
    content.style.overflowY = 'auto';
    content.style.fontFamily = 'Arial, sans-serif';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.width = '100%';
    closeBtn.style.backgroundColor = '#4CAF50';
    closeBtn.style.color = '#fff';
    closeBtn.style.fontWeight = '700';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.padding = '12px';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '6px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.marginBottom = '10px';

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);

    modal.addEventListener('click', e => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  const content = modal.querySelector('div:nth-child(2)');
  content.innerHTML = '';

  // Add content to modal similar to stats summary but as plain HTML:

  // Date
  if (longDateStr) {
    const dateDiv = document.createElement('div');
    dateDiv.textContent = longDateStr;
    dateDiv.style.textAlign = 'center';
    dateDiv.style.fontSize = '14px';
    dateDiv.style.color = '#666';
    dateDiv.style.marginBottom = '10px';
    content.appendChild(dateDiv);
  }

  // Top stats row
  const topStatsDiv = document.createElement('div');
  topStatsDiv.style.display = 'flex';
  topStatsDiv.style.justifyContent = 'space-between';
  topStatsDiv.style.alignItems = 'center';
  topStatsDiv.style.marginBottom = '10px';
  topStatsDiv.style.fontWeight = '700';
  topStatsDiv.style.fontSize = '18px';

  const winPercentDiv = document.createElement('div');
  winPercentDiv.textContent = `Win Percentage: ${((counts.Win + counts.Lost + counts.Push) ? ((counts.Win / (counts.Win + counts.Lost + counts.Push)) * 100).toFixed(1) : '0.0')}%`;
  winPercentDiv.style.flex = '1';
  winPercentDiv.style.textAlign = 'left';
  topStatsDiv.appendChild(winPercentDiv);

  const netUnits = counts.UnitsWin - counts.UnitsLost;
  const totalUnitsDiv = document.createElement('div');
  totalUnitsDiv.style.display = 'flex';
  totalUnitsDiv.style.alignItems = 'center';
  totalUnitsDiv.style.justifyContent = 'center';
  totalUnitsDiv.style.flex = '1';

  const plusMinusImg = document.createElement('img');
  plusMinusImg.style.width = '20px';
  plusMinusImg.style.height = '20px';
  plusMinusImg.style.marginRight = '6px';
  plusMinusImg.style.userSelect = 'none';

  if (netUnits > 0) {
    plusMinusImg.src = 'https://capper.ogcapperbets.com/admin/images/plus.png';
    plusMinusImg.alt = 'Positive Units';
  } else if (netUnits < 0) {
    plusMinusImg.src = 'https://capper.ogcapperbets.com/admin/images/minus.png';
    plusMinusImg.alt = 'Negative Units';
  } else {
    plusMinusImg.src = 'https://capper.ogcapperbets.com/admin/images/grayPending.png';
    plusMinusImg.alt = 'Pending Units';
  }
  totalUnitsDiv.appendChild(plusMinusImg);

  const unitsTextSpan = document.createElement('span');
  unitsTextSpan.textContent = `${Math.abs(netUnits).toFixed(2)} Unit(s)`;
  totalUnitsDiv.appendChild(unitsTextSpan);
  topStatsDiv.appendChild(totalUnitsDiv);

  const totalPicksDiv = document.createElement('div');
  totalPicksDiv.textContent = `Total Picks: ${counts.Total}`;
  totalPicksDiv.style.flex = '1';
  totalPicksDiv.style.textAlign = 'right';
  topStatsDiv.appendChild(totalPicksDiv);

  content.appendChild(topStatsDiv);

  // Status blocks
  const statusRow = document.createElement('div');
  statusRow.style.display = 'flex';
  statusRow.style.justifyContent = 'space-around';
  statusRow.style.marginTop = '15px';
  statusRow.style.fontFamily = 'Arial, sans-serif';

  function createStatusBlock(name, units, count, iconSrc, iconAlt) {
    const block = document.createElement('div');
    block.style.textAlign = 'center';

    const unitsEl = document.createElement('div');
    unitsEl.textContent = `${units.toFixed(2)} Unit(s)`;
    unitsEl.style.fontWeight = '700';
    unitsEl.style.fontSize = '16px';
    unitsEl.style.marginBottom = '4px';
    block.appendChild(unitsEl);

    const iconImg = document.createElement('img');
    iconImg.src = iconSrc;
    iconImg.alt = iconAlt;
    iconImg.style.width = '50px';
    iconImg.style.height = '50px';
    iconImg.style.userSelect = 'none';
    block.appendChild(iconImg);

    const countEl = document.createElement('div');
    countEl.textContent = count;
    countEl.style.fontWeight = '700';
    countEl.style.fontSize = '18px';
    countEl.style.marginTop = '6px';
    block.appendChild(countEl);

    return block;
  }

  statusRow.appendChild(createStatusBlock('Winner', counts.UnitsWin, counts.Win, statusIcons.Win, 'Winner'));
  statusRow.appendChild(createStatusBlock('Lost', counts.UnitsLost, counts.Lost, statusIcons.Lost, 'Lost'));
  statusRow.appendChild(createStatusBlock('Push', counts.UnitsPush, counts.Push, statusIcons.Push, 'Push'));
  statusRow.appendChild(createStatusBlock('Pending', counts.UnitsPending, counts.Pending, statusIcons.Pending, 'Pending'));

  content.appendChild(statusRow);

  // Listing picks
  const picksList = document.createElement('div');
  picksList.style.marginTop = '15px';

  picks.forEach(({ data }) => {
    const pickDiv = document.createElement('div');
    pickDiv.style.border = '1px solid #ddd';
    pickDiv.style.borderRadius = '6px';
    pickDiv.style.padding = '8px';
    pickDiv.style.marginBottom = '8px';
    pickDiv.style.fontFamily = 'Arial, sans-serif';
    pickDiv.style.color = '#333';

    const teamDiv = document.createElement('div');
    teamDiv.textContent = data.teamSelected || 'N/A';
    teamDiv.style.fontWeight = '700';
    pickDiv.appendChild(teamDiv);

    const wagerDiv = document.createElement('div');
    wagerDiv.textContent = data.wagerType || 'N/A';
    wagerDiv.style.fontSize = '14px';
    wagerDiv.style.color = '#555';
    pickDiv.appendChild(wagerDiv);

    const unitDiv = document.createElement('div');
    unitDiv.style.fontSize = '14px';
    unitDiv.style.color = '#555';
    unitDiv.innerHTML = `${data.unit || 'N/A'} <br>(${data.unitUnicode || ''})`;
    pickDiv.appendChild(unitDiv);

    // Status icon on the right
    const statusImg = document.createElement('img');
    let status = data.gameWinLossDraw;
    if (status === null || status === undefined || status === '' || status === 'null') {
      status = 'Pending';
    }
    statusImg.src = statusIcons[status] || statusIcons.Pending;
    statusImg.alt = status;
    statusImg.style.width = '40px';
    statusImg.style.height = '40px';
    statusImg.style.float = 'right';

    pickDiv.appendChild(statusImg);

    picksList.appendChild(pickDiv);
  });

  content.appendChild(picksList);

  modal.style.display = 'flex';
}

export { generateImageModal };
