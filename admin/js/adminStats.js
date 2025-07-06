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
    // DISABLE internal scrolling here:
    statsContainer.style.maxHeight = 'none';
    statsContainer.style.height = 'auto';
    statsContainer.style.overflowY = 'visible';
    mainContent.appendChild(statsContainer);
  } else {
    statsContainer.innerHTML = '';
    // Make sure to keep scroll disabled on reload:
    statsContainer.style.maxHeight = 'none';
    statsContainer.style.height = 'auto';
    statsContainer.style.overflowY = 'visible';
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
      picks = snapshot.docs.map(doc => ({
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
  picksDiv.style.border = '1px solid #ddd';
  picksDiv.style.borderRadius = '6px';
  picksDiv.style.padding = '5px'; // added 5px spacing around picks container
  picksDiv.style.marginTop = '10px'; // add white space between header and picks container
  statsContainer.appendChild(picksDiv);

  renderPickListing(picks, picksDiv);
}

// Watermark image url
const watermarkUrl = 'https://capper.ogcapperbets.com/admin/images/imageWaterSingle.png';

// Generate image modal & canvas
function generateImageFromStatsContainer() {
  loadHtml2Canvas(async () => {
    const finalWidth = 384; // match header/footer width
    const finalHeight = 720; // estimated, will adjust below

    // Grab fresh data for all picks (no screen snapshot limitation)
    const officialPicksRef = collection(db, 'OfficialPicks');
    const q = query(officialPicksRef);
    const snapshot = await getDocs(q);
    const picks = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    // Create offscreen container for full content render
    const offscreen = document.createElement('div');
    offscreen.style.width = `${finalWidth}px`;
    offscreen.style.backgroundColor = '#fff';
    offscreen.style.fontFamily = 'Arial, sans-serif';
    offscreen.style.fontSize = '14px';
    offscreen.style.padding = '0 10px 10px';
    offscreen.style.position = 'relative';
    offscreen.style.boxSizing = 'border-box';

    // Add Header image (natural size, 60px height)
    const headerImg = document.createElement('img');
    headerImg.src = 'https://capper.ogcapperbets.com/admin/images/imageHeader.png';
    headerImg.style.width = 'auto';
    headerImg.style.height = '60px';
    headerImg.style.display = 'block';
    headerImg.style.margin = '0 auto 10px';
    offscreen.appendChild(headerImg);

    // Add top buttons container (but hidden, we just want to crop its height)
    const topButtonsDiv = document.createElement('div');
    topButtonsDiv.style.height = '65px'; // to crop this height from content below
    topButtonsDiv.style.overflow = 'hidden';
    topButtonsDiv.style.visibility = 'hidden';
    topButtonsDiv.style.marginBottom = '-65px';
    offscreen.appendChild(topButtonsDiv);

    // Add date text
    const longDateStr = formatLongDateEST('today');
    if (longDateStr) {
      const dateLabel = document.createElement('div');
      dateLabel.textContent = longDateStr;
      dateLabel.style.color = '#666';
      dateLabel.style.fontSize = '12px';
      dateLabel.style.textAlign = 'center';
      dateLabel.style.marginBottom = '8px';
      offscreen.appendChild(dateLabel);
    }

    // Compute stats and render summary
    const counts = computeStats(picks);
    const summaryDiv = document.createElement('div');
    offscreen.appendChild(summaryDiv);
    renderStatsSummary(counts, summaryDiv);

    // Picks container with border and padding + margin top
    const picksDiv = document.createElement('div');
    picksDiv.style.border = '1px solid #ddd';
    picksDiv.style.borderRadius = '6px';
    picksDiv.style.padding = '5px';
    picksDiv.style.marginTop = '10px';
    picksDiv.style.backgroundColor = 'transparent'; // transparent for watermark to show behind
    offscreen.appendChild(picksDiv);

    renderPickListing(picks, picksDiv);

    // Add white spacing below picks container, above footer
    const bottomSpacing = document.createElement('div');
    bottomSpacing.style.height = '10px';
    offscreen.appendChild(bottomSpacing);

    // Add footer image (natural width, scale with container width)
    const footerImg = document.createElement('img');
    footerImg.src = 'https://capper.ogcapperbets.com/admin/images/imageFooter.png';
    footerImg.style.width = '100%';
    footerImg.style.height = 'auto';
    footerImg.style.display = 'block';
    footerImg.style.marginTop = '10px';
    offscreen.appendChild(footerImg);

    // Append watermark images randomly behind picksDiv content
    const watermarkCount = Math.floor((picksDiv.offsetHeight / 50) * (finalWidth / 50));
    for (let i = 0; i < watermarkCount; i++) {
      const watermark = document.createElement('img');
      watermark.src = watermarkUrl;
      watermark.style.width = '50px';
      watermark.style.height = '50px';
      watermark.style.position = 'absolute';
      watermark.style.opacity = '0.1';
      watermark.style.pointerEvents = 'none';
      watermark.style.userSelect = 'none';
      watermark.style.zIndex = '0';

      // Random positions within picksDiv area (but picksDiv background is transparent, so watermarks behind content)
      watermark.style.left = `${10 + Math.random() * (finalWidth - 70)}px`;
      watermark.style.top = `${headerImg.offsetHeight + 65 + Math.random() * (picksDiv.offsetHeight - 50)}px`;

      // Insert watermark into offscreen container but behind picksDiv content
      offscreen.appendChild(watermark);
    }

    // Append offscreen container to body hidden to allow html2canvas to render
    offscreen.style.position = 'fixed';
    offscreen.style.left = '-9999px';
    offscreen.style.top = '-9999px';
    document.body.appendChild(offscreen);

    // Use html2canvas to render offscreen container with header/footer and watermark
    html2canvas(offscreen, {
      scale: 2,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      useCORS: true,
      backgroundColor: null,
      width: finalWidth,
      windowWidth: finalWidth
    }).then(canvas => {
      // Crop top 60px of main content area (below header and buttons area)
      const croppedCanvas = document.createElement('canvas');
      const ctx = croppedCanvas.getContext('2d');
      croppedCanvas.width = finalWidth;
      croppedCanvas.height = canvas.height - 60; // crop 60px from top

      ctx.drawImage(canvas, 0, 60, finalWidth, canvas.height - 60, 0, 0, finalWidth, canvas.height - 60);

      // Remove offscreen container after capture
      document.body.removeChild(offscreen);

      // Convert cropped canvas to image data URL
      const dataURL = croppedCanvas.toDataURL('image/png');

      // Show modal with final image
      showImageModal(dataURL, finalWidth);
    }).catch(err => {
      console.error('html2canvas error:', err);
      document.body.removeChild(offscreen);
      alert('Failed to generate image.');
    });
  });
}

function showImageModal(dataUrl, width) {
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
    content.style.position = 'relative';
    content.style.backgroundColor = '#fff';
    content.style.borderRadius = '10px';
    content.style.padding = '10px';
    content.style.maxWidth = `${width}px`;
    content.style.maxHeight = '90vh';
    content.style.overflowY = 'auto';

    const img = document.createElement('img');
    img.id = 'modalImage';
    img.alt = 'Stats Image';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.padding = '6px 12px';
    closeBtn.style.cursor = 'pointer';

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', e => {
      if (e.target === modal) modal.style.display = 'none';
    });

    content.appendChild(img);
    content.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
  }

  const modalImg = document.getElementById('modalImage');
  modalImg.src = dataUrl;
  modal.style.display = 'flex';
}

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
