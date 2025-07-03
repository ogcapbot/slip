// admin/js/leagueSelector.js
import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

let selectedLeague = null;

/**
 * Load leagues for the given sport from Firestore and render buttons.
 * @param {HTMLElement} container - Container to render league buttons in.
 * @param {string} sportId - The selected sport ID.
 */
export async function loadLeagues(container, sportId) {
  container.innerHTML = '';  // Clear container

  const leagueButtonsContainer = document.createElement('div');
  leagueButtonsContainer.id = 'leagueButtonsContainer';
  container.appendChild(leagueButtonsContainer);

  selectedLeague = null;

  try {
    const leaguesCol = collection(db, 'leagues');
    const q = query(leaguesCol, where('sportId', '==', sportId));
    const leaguesSnapshot = await getDocs(q);

    if (leaguesSnapshot.empty) {
      leagueButtonsContainer.innerHTML = '<p>No leagues found for this sport.</p>';
      return;
    }

    leaguesSnapshot.forEach(doc => {
      const leagueData = doc.data();
      const btn = document.createElement('button');
      btn.textContent = leagueData.name || doc.id;
      btn.type = 'button';
      btn.className = 'pick-btn blue';
      btn.style.margin = '4px';
      btn.style.minWidth = '120px';

      btn.addEventListener('click', () => {
        selectedLeague = doc.id;
        Array.from(leagueButtonsContainer.children).forEach(b => b.disabled = true);
        btn.classList.add('selected');

        // TODO: Proceed to next step: load next pick question (e.g. teamSelector)
        // For now, just log the selection:
        console.log('[leagueSelector.js] Selected league:', selectedLeague);
      });

      leagueButtonsContainer.appendChild(btn);
    });
  } catch (error) {
    console.error('[leagueSelector.js] Error loading leagues:', error);
    leagueButtonsContainer.innerHTML = '<p>Error loading leagues data.</p>';
  }
}
