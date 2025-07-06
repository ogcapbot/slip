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

  const winPercentDiv = document.createElement('div');
  winPercentDiv.textContent = `Win Percentage: ${winPercent}%`;
  winPercentDiv.style.fontWeight = '800';
  winPercentDiv.style.fontSize = '18px';
  winPercentDiv.style.marginBottom = '15px';
  winPercentDiv.style.textAlign = 'center';
  container.appendChild(winPercentDiv);

  const totalText = document.createElement('div');
  totalText.textContent = `Total Picks: ${counts.Total}`;
  totalText.style.fontWeight = '700';
  totalText.style.fontSize = '16px';
  totalText.style.marginBottom = '10px';
  totalText.style.textAlign = 'center';
  container.appendChild(totalText);

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
    case 'Win': return '✅';
    case 'Lost': return '❌';
    case 'Push': return '🟦';
    default: return '⚙️';
  }
}

function generateTextStatsOutput(day, picks) {
  const counts = computeStats(picks);
  const completed = counts.Win + counts.Lost + counts.Push;
  const winPercent = completed ? ((counts.Win / completed) * 100).toFixed(1) : '0.0';

  const longDateStr = formatLongDateEST(day);
  const longDateTimeStr = formatLongDateTimeEST();

  let output = '';
  output += `═══════════════════════\n######## OFFICIAL STATS\n═══════════════════════\n`;
  output += `Date: ${longDateStr}\n`;
  output += `∑ - Official Picks Total: ${counts.Total}\n`;
  output += `✅ - Official Pick Winners: ${counts.Win} - ${winPercent}%\n`;
  output += `❌ - Official Picks Lost: ${counts.Lost} - ${counts.Lost && completed ? ((counts.Lost / completed) * 100).toFixed(1) : '0.0'}%\n`;
  output += `🟦 - Official Picks Pushed: ${counts.Push} - ${counts.Push && completed ? ((counts.Push / completed) * 100).toFixed(1) : '0.0'}%\n`;
  output += `⚙️ - Official Picks Pending : ${counts.Pending}\n\n`;

  output += `═══════════════════════\n######## OFFICIAL PICKS\n═══════════════════════\n`;

  picks.forEach(({ data }) => {
    const emoji = getStatusEmoji(data.gameWinLossDraw);
    output += `═══════════════════════\n`;
    output += `${data.teamSelected || 'N/A'}\n`;
    output += `${data.wagerType || 'N/A'}\n`;
    output += `${emoji} - ${data.unit || 'N/A'}\n`;
  });

  output += `═══════════════════════\n######## THANK YOU FOR TRUSTING OGCB\n═══════════════════════\n\n`;
  output += `═══════════════════════\n######## STRICT CONFIDENTIALITY NOTICE\n═══════════════════════\n`;
  output += `All OG Capper Bets Content is PRIVATE. Leaking, Stealing or Sharing ANY Content is STRICTLY PROHIBITED. Violation = Termination. No Refund. No Appeal. Lifetime Ban.\n\n`;
  output += `Created: ${longDateTimeStr}\n`;

  return output;
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
    content.style.width = '90vw';
    content.style.maxWidth = '600px';
    content.style.maxHeight = '80vh'; // Tweak here for 80% viewport height
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
    textarea.style.minHeight = '70vh'; // Fill most of modal height
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

    copyBtn.addEventListener('click', () => {
      textarea.select();
      document.execCommand('copy');
      alert('Text copied to clipboard!');
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
        generateImageFromStatsContainer();
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

// === ADDITION: Load html2canvas dynamically & generate image ===

function loadHtml2Canvas(callback) {
  if (window.html2canvas) {
    callback();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  script.onload = () => callback();
  document.head.appendChild(script);
}

function generateImageFromStatsContainer() {
  loadHtml2Canvas(() => {
    const container = document.getElementById('statsContainer');
    if (!container) {
      alert('Stats container not found!');
      return;
    }

    html2canvas(container, {
      scrollY: -window.scrollY,
      scrollX: -window.scrollX,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      scale: 1
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const imgWindow = window.open('');
      if (!imgWindow) {
        alert('Popup blocked! Please allow popups to view the image.');
        return;
      }
      imgWindow.document.write(`<title>Stats Image</title><img src="${imgData}" style="width:100%; height:auto;" alt="Stats Image"/>`);
    }).catch(err => {
      console.error('Failed to generate image:', err);
      alert('Failed to generate image.');
    });
  });
}
