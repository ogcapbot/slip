// admin/js/sportSelector.js
import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadLeagues } from './leagueSelector.js';

const originalSportSelect = document.getElementById('sportSelect');

let sportButtonsContainer;
let hiddenSelect;
let selectedSport = null;

if (originalSportSelect) {
  console.log('[SportSelector] Original sportSelect found, replacing with hidden select and button container.');
  const parent = originalSportSelect.parentNode;
  parent.removeChild(originalSportSelect);

  hiddenSelect = document.createElement('select');
  hiddenSelect.id = 'sportSelect';
  hiddenSelect.style.display = 'none';
  parent.appendChild(hiddenSelect);

  sportButtonsContainer = document.createElement('div');
  sportButtonsContainer.id = 'sportButtonsContainer';

  const sportLabel = parent.querySelector('label[for="sportSelect"]');
  if (sportLabel) {
    sportLabel.parentNode.insertBefore(sportButtonsContainer, sportLabel.nextSibling);
  } else {
    parent.appendChild(sportButtonsContainer);
  }

  loadSports();
}

async function loadSports() {
  sportButtonsContainer.innerHTML = '';
  selectedSport = null;

  const sportsRef = collection(db, 'sports');
  const snapshot = await getDocs(sportsRef);

  snapshot.forEach(doc => {
    const sport = doc.data();
    const button = document.createElement('button');
    button.textContent = sport.name || doc.id;
    button.classList.add('btn', 'btn-success', 'm-1');
    button.dataset.sportId = doc.id;

    button.addEventListener('click', () => {
      selectedSport = doc.id;

      // Hide sport buttons on selection
      sportButtonsContainer.style.display = 'none';

      // Update hidden select value
      hiddenSelect.value = selectedSport;

      // Update summary
      updateSummary('Sport', sport.name || doc.id);

      // Load leagues for selected sport
      loadLeagues(null, selectedSport);
    });

    sportButtonsContainer.appendChild(button);
  });

  sportButtonsContainer.style.display = 'block';
}

function updateSummary(field, value) {
  const summaryElement = document.getElementById('summary');
  if (!summaryElement) return;

  const line = document.createElement('div');
  line.textContent = `${field}: ${value}`;
  summaryElement.appendChild(line);
}

export { loadSports, selectedSport };
