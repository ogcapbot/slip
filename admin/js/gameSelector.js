// admin/js/gameSelector.js

import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

/**
 * Displays a vertical list of game buttons filtered by selected league with pagination.
 * Each button shows "AwayTeam @ HomeTeam" on first line, then "Date Time (EST)" on second line.
 * @param {HTMLElement} container - DOM element to append buttons container into.
 * @param {string} selectedLeague - The leagueShortname selected by user.
 * @param {Function} onGameSelect - Callback with selected game document data when clicked.
 */
export async function showGameSelector(container, selectedLeague, onGameSelect) {
  console.log(`[gameSelector] Loading games for league: ${selectedLeague}`);

  if (!container) {
    console.error("[gameSelector] No container element provided.");
    return;
  }
  if (!selectedLeague) {
    console.error("[gameSelector] No selectedLeague provided.");
    container.textContent = "Error: No league selected.";
    return;
  }
  if (typeof onGameSelect !== "function") {
    console.error("[gameSelector] No onGameSelect callback provided.");
    container.textContent = "Error: Missing game selection handler.";
    return;
  }

  try {
    const db = getFirestore();

    // Query GameEventsData where leagueShortname == selectedLeague
    const gameEventsRef = collection(db, 'GameEventsData');
    const q = query(gameEventsRef, where('leagueShortname', '==', selectedLeague));
    const snapshot = await getDocs(q);

    // Collect all game docs data
    const games = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Make sure required fields exist to avoid display issues
      if (data.homeTeam && data.awayTeam && data.startTime) {
        games.push({
          id: doc.id,
          homeTeam: data.homeTeam,
          awayTeam: data.awayTeam,
          startTime: data.startTime,
          rawData: data // keep all data in case needed later
        });
      }
    });

    // Sort games by startTime ascending
    games.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    console.log(`[gameSelector] Found ${games.length} games for league ${selectedLeague}`);

    const pageSize = 15;
    let currentIndex = 0;

    container.innerHTML = '';

    const listContainer = document.createElement('div');
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.gap = '10px';
    listContainer.style.maxWidth = '400px';
    listContainer.style.margin = '0 auto';

    // Create Load More button
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.textContent = '';
    loadMoreBtn.style.display = 'none';
    loadMoreBtn.classList.add('admin-button');
    loadMoreBtn.style.alignSelf = 'center';
    loadMoreBtn.style.width = 'auto';

    // Format startTime to "MMM dd yyyy HH:mm EST"
    function formatStartTime(dateStr) {
      const utcDate = new Date(dateStr);
      return utcDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) + ' EST';
    }

    function renderNextPage() {
      const nextSlice = games.slice(currentIndex, currentIndex + pageSize);

      nextSlice.forEach(game => {
        const btn = document.createElement('button');
        btn.classList.add('admin-button');
        btn.style.width = '100%';
        btn.style.textAlign = 'left';
        btn.style.whiteSpace = 'normal';
        btn.style.lineHeight = '1.2';
        btn.style.padding = '8px 12px';
        btn.style.fontSize = '11px';
        btn.style.display = 'flex';
        btn.style.flexDirection = 'column';

        const line1 = document.createElement('span');
        line1.textContent = `${game.awayTeam} @ ${game.homeTeam}`;
        line1.style.fontWeight = 'bold';

        const line2 = document.createElement('span');
        line2.textContent = formatStartTime(game.startTime);
        line2.style.fontSize = '10px';
        line2.style.color = '#555';

        btn.appendChild(line1);
        btn.appendChild(line2);

        btn.addEventListener('click', () => {
          console.log(`[gameSelector] Game selected: ${game.id}`);
          container.innerHTML = '';
          onGameSelect(game.rawData);
        });

        listContainer.appendChild(btn);
      });

      currentIndex += pageSize;

      const remaining = games.length - currentIndex;
      if (remaining > 0) {
        loadMoreBtn.style.display = 'inline-block';
        loadMoreBtn.textContent = `Load 15 More (${remaining} left)`;
      } else {
        loadMoreBtn.style.display = 'none';
      }
    }

    loadMoreBtn.addEventListener('click', () => renderNextPage());

    container.appendChild(listContainer);
    container.appendChild(loadMoreBtn);

    renderNextPage();

  } catch (error) {
    console.error("[gameSelector] Error loading games:", error);
    container.textContent = "Failed to load games.";
  }
}
