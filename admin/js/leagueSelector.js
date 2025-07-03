// admin/js/leagueSelector.js

import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

/**
 * Shows league buttons filtered by selected sport with pagination.
 * @param {HTMLElement} container - The DOM element to render league buttons inside.
 * @param {string} selectedSport - The sportName to filter leagues by.
 * @param {Function} onLeagueSelect - Callback invoked with the selected leagueShortname.
 */
export async function showLeagueSelector(container, selectedSport, onLeagueSelect) {
  console.log(`[leagueSelector] Loading leagues for sport: ${selectedSport}`);

  if (!container) {
    console.error("[leagueSelector] No container element provided.");
    return;
  }
  if (!selectedSport) {
    console.error("[leagueSelector] No selectedSport provided.");
    container.textContent = "Error: No sport selected.";
    return;
  }
  if (typeof onLeagueSelect !== "function") {
    console.error("[leagueSelector] No onLeagueSelect callback provided.");
    container.textContent = "Error: Missing league selection handler.";
    return;
  }

  try {
    const db = getFirestore();

    // Query GameEventsData where sportName == selectedSport
    const gameEventsRef = collection(db, 'GameEventsData');
    const q = query(gameEventsRef, where('sportName', '==', selectedSport));
    const snapshot = await getDocs(q);

    // Collect unique leagueShortnames
    const leagueSet = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.leagueShortname) {
        leagueSet.add(data.leagueShortname);
      }
    });

    const leagues = Array.from(leagueSet).sort((a, b) => a.localeCompare(b));

    console.log(`[leagueSelector] Found ${leagues.length} leagues for sport ${selectedSport}`);

    const pageSize = 15;
    let currentIndex = 0;

    // Clear container
    container.innerHTML = '';

    // Create buttons container (3 columns grid)
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('button-grid'); // assuming your CSS has this for 3 cols grid

    // Load More button setup
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.classList.add('admin-button');
    loadMoreBtn.style.display = 'none';

    // Render next page function
    function renderNextPage() {
      const nextSlice = leagues.slice(currentIndex, currentIndex + pageSize);

      nextSlice.forEach(league => {
        const btn = document.createElement('button');
        btn.textContent = league;
        btn.classList.add('admin-button');
        btn.addEventListener('click', () => {
          console.log(`[leagueSelector] League selected: ${league}`);
          // Clear container for next step
          container.innerHTML = '';
          onLeagueSelect(league);
        });
        buttonsContainer.appendChild(btn);
      });

      currentIndex += pageSize;

      const remaining = leagues.length - currentIndex;
      if (remaining > 0) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.textContent = `Load 15 More (${remaining} left)`;
      } else {
        loadMoreBtn.style.display = 'none';
      }
    }

    loadMoreBtn.addEventListener('click', renderNextPage);

    container.appendChild(buttonsContainer);
    container.appendChild(loadMoreBtn);

    renderNextPage();

  } catch (error) {
    console.error("[leagueSelector] Error loading leagues:", error);
    container.textContent = "Failed to load leagues.";
  }
}
