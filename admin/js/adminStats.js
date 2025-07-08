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
    UnitsPending: 0
  };

  picks.forEach(({ data }) => {
    const val = data.gameWinLossDraw;
    const units = parseFloat(data.unit) || 0;

    if (val === null || val === undefined || val === '' || val === 'null') {
      counts.Pending++;
      counts.UnitsPending += units;
    } else if (STATUS_VALUES.includes(val)) {
      counts[val]++;
      if(val === 'Win') counts.UnitsWin += units;
      else if(val === 'Lost') counts.UnitsLost += units;
      else if(val === 'Push') counts.UnitsPush += units;
    }
  });

  counts.TotalUnits = counts.UnitsWin - counts.UnitsLost;
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

  // Container for first line: win % left, total picks right
  const line1 = document.createElement('div');
  line1.style.display = 'flex';
  line1.style.justifyContent = 'space-between';
  line1.style.marginBottom = '4px';

  const winPercentDiv = document.createElement('div');
  winPercentDiv.textContent = `Win %: ${winPercent}%`;
  winPercentDiv.style.fontWeight = '800';
  winPercentDiv.style.fontSize = '14px';
  winPercentDiv.style.flex = '1';
  winPercentDiv.style.textAlign = 'left';

  const totalPicksDiv = document.createElement('div');
  totalPicksDiv.textContent = `Total Picks: ${counts.Total}`;
  totalPicksDiv.style.fontWeight = '800';
  totalPicksDiv.style.fontSize = '14px';
  totalPicksDiv.style.flex = '1';
  totalPicksDiv.style.textAlign = 'right';

  line1.appendChild(winPercentDiv);
  line1.appendChild(totalPicksDiv);
  container.appendChild(line1);

  // Container for second line: total units center (smaller font now)
  const line2 = document.createElement('div');
  line2.style.textAlign = 'center';
  line2.style.fontWeight = '800';
  line2.style.fontSize = '16px';
  line2.style.marginBottom = '16px';

  const unitsSignImg = document.createElement('img');
  unitsSignImg.style.width = '20px';
  unitsSignImg.style.height = '20px';
  unitsSignImg.style.verticalAlign = 'middle';
  unitsSignImg.style.marginRight = '6px';

  if(counts.TotalUnits > 0) {
    unitsSignImg.src = 'https://capper.ogcapperbets.com/admin/images/plus.png';
  } else if(counts.TotalUnits < 0) {
    unitsSignImg.src = 'https://capper.ogcapperbets.com/admin/images/minus.png';
  } else {
    unitsSignImg.src = 'https://capper.ogcapperbets.com/admin/images/grayPending.png';
  }

  const unitsText = document.createElement('span');
  unitsText.textContent = `${counts.TotalUnits.toFixed(2)} Unit(s)`;
  unitsText.style.verticalAlign = 'middle';

  line2.appendChild(unitsSignImg);
  line2.appendChild(unitsText);
  container.appendChild(line2);

  // Container for bottom status summary icons (without label text)
  const totalsRow = document.createElement('div');
  totalsRow.style.display = 'flex';
  totalsRow.style.justifyContent = 'center';
  totalsRow.style.marginBottom = '20px';

  STATUS_VALUES.forEach(status => {
    totalsRow.appendChild(createStatusSummaryIcon(status, counts[status] || 0));
  });

  container.appendChild(totalsRow);
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

  return `
═══════════════════════
######## OFFICIAL STATS
═══════════════════════
Date: ${formatLongDateEST(day)}

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
Created: ${formatLongDateTimeEST()}
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
        generateImageFromStatsContainer(currentDay);
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
    dateLabel.style.textAlign = 'center';
    dateLabel.style.marginBottom = '4px';  // Reduced margin bottom to shrink gap
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
  picksDiv.style.maxHeight = 'none'; // allow to grow indefinitely, no scroll
  picksDiv.style.overflowY = 'visible';
  picksDiv.style.border = '1px solid #ddd';
  picksDiv.style.borderRadius = '6px';
  picksDiv.style.padding = '8px';
  picksDiv.style.position = 'relative'; // needed for watermarks
  picksDiv.style.backgroundColor = 'transparent'; // make transparent for watermark visibility
  statsContainer.appendChild(picksDiv);

  renderPickListing(picks, picksDiv);
}

// FULLY IMPLEMENTED, FIXED IMAGE GENERATION FUNCTION:
function loadHtml2Canvas(callback) {
  if (window.html2canvas) {
    callback();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
  script.onload = callback;
  document.head.appendChild(script);
}

function generateImageFromStatsContainer(day) {
  loadHtml2Canvas(async () => {
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

    const finalWidth = 384;
    const watermarkUrl = 'https://capper.ogcapperbets.com/admin/images/imageWaterSingle.png';

    const offscreen = document.createElement('div');
    offscreen.style.width = `${finalWidth}px`;
    offscreen.style.backgroundColor = '#fff';
    offscreen.style.fontFamily = 'Arial, sans-serif';
    offscreen.style.fontSize = '14px';
    offscreen.style.padding = '0 10px 10px';
    offscreen.style.position = 'relative';
    offscreen.style.boxSizing = 'border-box';

    // Header image with natural height and max width 100%
    const headerImg = document.createElement('img');
    headerImg.src = 'https://capper.ogcapperbets.com/admin/images/imageHeader.png';
    headerImg.style.display = 'block';
    headerImg.style.margin = '0 auto 8px';
    headerImg.style.maxWidth = '100%';  // scale to container width max
    headerImg.style.height = 'auto';   // keep aspect ratio
    offscreen.appendChild(headerImg);

    // Hide top buttons area as before
    const topButtonsDiv = document.createElement('div');
topButtonsDiv.style.height = '65px';
topButtonsDiv.style.display = 'none';  // hide and remove space
offscreen.appendChild(topButtonsDiv);


    const longDateStr = formatLongDateEST(day);
    if (longDateStr) {
      const dateLabel = document.createElement('div');
      dateLabel.textContent = longDateStr;
      dateLabel.style.color = '#666';
      dateLabel.style.fontSize = '12px';
      dateLabel.style.textAlign = 'center';
      dateLabel.style.marginBottom = '4px';  // tight gap
      offscreen.appendChild(dateLabel);
    }

    const counts = computeStats(picks);
    const summaryDiv = document.createElement('div');
    offscreen.appendChild(summaryDiv);
    renderStatsSummary(counts, summaryDiv);

    const picksDiv = document.createElement('div');
    picksDiv.style.border = '1px solid #ddd';
    picksDiv.style.borderRadius = '6px';
    picksDiv.style.padding = '5px';
    picksDiv.style.marginTop = '10px';
    picksDiv.style.position = 'relative'; // for absolute watermarks
    picksDiv.style.backgroundColor = 'transparent'; // transparent to show watermark
    picksDiv.style.zIndex = '1'; // put picks on top
    picksDiv.style.overflow = 'visible'; // make sure watermarks show outside if needed
    offscreen.appendChild(picksDiv);
    renderPickListing(picks, picksDiv);

// Watermark settings
renderPickListing(picks, picksDiv);

// Watermark settings
// Remove previous image watermark loop and replace with CSS text watermark:
const picksHeight = picksDiv.offsetHeight || 300;
const watermarkCount = Math.floor((picksHeight / 65) * (finalWidth / 125)); // Adjust density

for (let i = 0; i < watermarkCount; i++) {
  const watermark = document.createElement('div');
  watermark.textContent = '© ogcapperbets.com ©';
  watermark.style.position = 'absolute';
  watermark.style.color = '#000';
  watermark.style.opacity = '0.15';
  watermark.style.fontSize = '20px';
  watermark.style.fontWeight = '700';
  watermark.style.userSelect = 'none';
  watermark.style.pointerEvents = 'none';
  watermark.style.whiteSpace = 'nowrap';
  watermark.style.transform = 'rotate(300deg)';
  watermark.style.zIndex = '0';

  watermark.style.left = `${10 + Math.random() * (finalWidth - 150)}px`;
  watermark.style.top = `${headerImg.offsetHeight + 65 + Math.random() * (picksHeight - 20)}px`;

  offscreen.appendChild(watermark);
}
    // bottom spacing
    const bottomSpacing = document.createElement('div');
    bottomSpacing.style.height = '10px';
    offscreen.appendChild(bottomSpacing);

    // Footer image
    const footerImg = document.createElement('img');
    footerImg.src = 'https://capper.ogcapperbets.com/admin/images/imageFooter.png';
    footerImg.style.display = 'block';
    footerImg.style.marginTop = '10px';
    footerImg.style.maxWidth = '100%';
    footerImg.style.height = 'auto';
    offscreen.appendChild(footerImg);

    offscreen.style.position = 'fixed';
    offscreen.style.left = '-9999px';
    offscreen.style.top = '-9999px';
    document.body.appendChild(offscreen);

    html2canvas(offscreen, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      width: finalWidth,
      windowWidth: finalWidth
    }).then(canvas => {
      document.body.removeChild(offscreen);

      const margin = 40;
      const maxWidth = window.innerWidth - margin * 2;
      const maxHeight = window.innerHeight - margin * 2 - 50;
      let scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      if (scale > 1) scale = 1;

      let modal = document.getElementById('imageOutputModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageOutputModal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';  // vertical center
        modal.style.justifyContent = 'center'; // horizontal center
        modal.style.zIndex = '100000';
        modal.style.padding = '0'; // remove padding to avoid top gap

        const content = document.createElement('div');
        content.style.position = 'relative';
        content.style.backgroundColor = '#fff';
        content.style.borderRadius = '12px';
        content.style.boxShadow = '0 0 15px rgba(0,0,0,0.5)';
        content.style.overflow = 'auto';
        content.style.maxHeight = 'calc(100vh - 20px)'; // some vertical padding
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.alignItems = 'center';
        content.style.padding = '0'; // remove padding

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.backgroundColor = '#4CAF50';
        closeBtn.style.color = '#fff';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '6px';
        closeBtn.style.padding = '8px 16px';
        closeBtn.style.fontWeight = '700';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.margin = '0'; // remove margin
        closeBtn.style.alignSelf = 'stretch';

        closeBtn.addEventListener('click', () => {
          modal.style.display = 'none';
        });

        content.appendChild(closeBtn);

        const img = document.createElement('img');
        img.id = 'modalGeneratedImage';
        content.appendChild(img);

        modal.appendChild(content);
        document.body.appendChild(modal);

        modal.addEventListener('click', e => {
          if (e.target === modal) modal.style.display = 'none';
        });
      }

      const img = document.getElementById('modalGeneratedImage');
      img.src = canvas.toDataURL('image/png');
      img.style.width = canvas.width * scale + 'px';
      img.style.height = 'auto';
      img.style.borderRadius = '12px';
      img.style.userSelect = 'none';
      img.style.display = 'block';

      modal.style.display = 'flex';
    }).catch(err => {
      document.body.removeChild(offscreen);
      console.error('Failed to generate image:', err);
      alert('Failed to generate image.');
    });
  });
}


export { generateImageFromStatsContainer };
