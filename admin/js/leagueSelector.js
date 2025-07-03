// admin/js/leagueSelector.js
// --- your original full content starts here ---
import { db } from '../firebaseInit.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

let leagueButtonsContainer = document.getElementById('leagueButtonsContainer');
let leagueSelect = document.getElementById('leagueSelect');
let selectedLeague = null;

if (!leagueButtonsContainer) {
  leagueButtonsContainer = document.createElement('div');
  leagueButtonsContainer.id = 'leagueButtonsContainer';

  const leagueLabel = document.querySelector('label[for="leagueSelect"]');
  if (leagueLabel) {
    leagueLabel.parentNode.insertBefore(leagueButtonsContainer, leagueLabel.nextSibling);
  } else if (leagueSelect && leagueSelect.parentNode) {
    leagueSelect.parentNode.insertBefore(leagueButtonsContainer, leagueSelect.nextSibling);
  } else {
    document.body.appendChild(leagueButtonsContainer);
  }
}

if (leagueSelect) {
  leagueSelect.style.display = 'none';
}

async function loadLeagues(container = null, selectedSport = null) {
  if (!container) {
    container = leagueButtonsContainer;
  }

  container.innerHTML = '';
  selectedLeague = null;

  if (!selectedSport) {
    console.warn('[LeagueSelector] No sport selected, cannot load leagues.');
    return;
  }

  const leaguesRef = collection(db, 'leagues');
  const q = query(leaguesRef, where('sport', '==', selectedSport));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    container.innerHTML = '<p>No leagues available for selected sport.</p>';
    return;
  }

  querySnapshot.forEach(doc => {
    const league = doc.data();
    const button = document.createElement('button');
    button.textContent = league.name || doc.id;
    button.classList.add('btn', 'btn-primary', 'm-1');
    button.dataset.leagueId = doc.id;

    button.addEventListener('click', () => {
      selectedLeague = doc.id;

      // === Minimal patch to hide buttons on selection ===
      container.style.display = 'none';

      updateSummary('League', league.name || doc.id);

      import('./gameSelector.js').then(module => {
        module.loadGames(null, selectedLeague);
      });
    });

    container.appendChild(button);
  });

  container.style.display = 'block';
}

function updateSummary(field, value) {
  const summaryElement = document.getElementById('summary');
  if (!summaryElement) return;

  const line = document.createElement('div');
  line.textContent = `${field}: ${value}`;
  summaryElement.appendChild(line);
}

export { loadLeagues, selectedLeague };
