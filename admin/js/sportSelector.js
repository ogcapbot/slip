// admin/js/sportSelector.js
import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadLeagues } from './leagueSelector.js';

const originalSportSelect = document.getElementById('sportSelect');

let sportButtonsContainer;
let hiddenSelect;
let selectedSport = null;

if (originalSportSelect) {
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

export async function loadSports() {
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

      sportButtonsContainer.style.display = 'none';  // Hide sport buttons

      hiddenSelect.value = selectedSport;

      updateSummary('Sport', sport.name || doc.id);

      loadLeagues(null, selectedSport);  // Show leagues
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
