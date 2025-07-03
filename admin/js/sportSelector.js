// admin/js/sportSelector.js
import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadLeagues } from './leagueSelector.js';

let selectedSport = null;
let sportButtonsContainer = null;

/**
 * Resets any previous state for sport selection
 */
export function resetSportSelectorState() {
  selectedSport = null;
  if (sportButtonsContainer) {
    sportButtonsContainer.innerHTML = '';
  }
}

/**
 * Load sports from Firestore and render buttons inside the container element.
 * @param {HTMLElement} container - The container element to render sport buttons in.
 */
export async function loadSports(container) {
  // Clear container and create sportButtonsContainer div if not exists
  container.innerHTML = '';
  sportButtonsContainer = document.createElement('div');
  sportButtonsContainer.id = 'sportButtonsContainer';
  container.appendChild(sportButtonsContainer);

  selectedSport = null;

  try {
    const sportsCol = collection(db, 'sports');
    const sportsSnapshot = await getDocs(sportsCol);

    if (sportsSnapshot.empty) {
      sportButtonsContainer.innerHTML = '<p>No sports found.</p>';
      return;
    }

    // Create a button for each sport
    sportsSnapshot.forEach(doc => {
      const sportData = doc.data();
      const btn = document.createElement('button');
      btn.textContent = sportData.name || doc.id;
      btn.type = 'button';
      btn.className = 'pick-btn blue';
      btn.style.margin = '4px';
      btn.style.minWidth = '120px';

      btn.addEventListener('click', () => {
        selectedSport = doc.id; // Store selected sport ID
        // Disable all buttons after selection
        Array.from(sportButtonsContainer.children).forEach(b => b.disabled = true);
        btn.classList.add('selected');

        // Proceed to next step: load leagues
        loadLeagues(container, selectedSport);
      });

      sportButtonsContainer.appendChild(btn);
    });

  } catch (error) {
    console.error('[sportSelector.js] Error loading sports:', error);
    sportButtonsContainer.innerHTML = '<p>Error loading sports data.</p>';
  }
}
