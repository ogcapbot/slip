import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');
const leagueSelect = document.getElementById('leagueSelect');
const gameSelect = document.getElementById('gameSelect');
const pickOptionsContainer = document.getElementById('pickOptionsContainer'); // new
const submitButton = document.querySelector('form#pickForm button[type="submit"]');

leagueSelect.addEventListener('change', async () => {
  // existing code to load games ...

  // Clear pick options on league change
  pickOptionsContainer.innerHTML = '';
  submitButton.disabled = true;
});

gameSelect.addEventListener('change', async () => {
  if (!gameSelect.value) {
    pickOptionsContainer.innerHTML = '';
    submitButton.disabled = true;
    return;
  }

  try {
    const docRef = doc(db, 'GameCache', gameSelect.value);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      pickOptionsContainer.innerHTML = 'Game data not found.';
      submitButton.disabled = true;
      return;
    }

    const game = docSnap.data();
    const homeTeam = game.HomeTeam;
    const awayTeam = game.AwayTeam;

    // Build buttons for picks
    pickOptionsContainer.innerHTML = `
      <button type="button" class="pick-btn" data-pick="${homeTeam}">${homeTeam}</button>
      <button type="button" class="pick-btn" data-pick="${awayTeam}">${awayTeam}</button>
    `;

    // Add event listeners to buttons for toggle effect
    const buttons = pickOptionsContainer.querySelectorAll('.pick-btn');
    buttons.forEach(btn => {
      btn.style.flex = '1 1 45%';  // roughly half width with some space
      btn.style.margin = '0 5px';  // horizontal spacing
      btn.style.fontSize = '0.9rem'; // slightly smaller font
      btn.style.padding = '8px 12px';
      btn.style.border = 'none';
      btn.style.borderRadius = '6px';
      btn.style.backgroundColor = '#007BFF'; // default blue
      btn.style.color = 'white';
      btn.style.cursor = 'pointer';
      btn.style.transition = 'background-color 0.3s ease';

      btn.addEventListener('click', () => {
        // Reset all buttons to blue
        buttons.forEach(b => {
          b.style.backgroundColor = '#007BFF';
        });
        // Highlight clicked button green
        btn.style.backgroundColor = '#28a745';
        // Store selection in dataset for submission use
        pickOptionsContainer.dataset.selectedPick = btn.getAttribute('data-pick');
      });
    });

    pickOptionsContainer.style.display = 'flex';
    pickOptionsContainer.style.justifyContent = 'space-between';
    submitButton.disabled = true;

    // Enable submit button once user picks
    pickOptionsContainer.addEventListener('click', () => {
      if (pickOptionsContainer.dataset.selectedPick) {
        submitButton.disabled = false;
      }
    });

  } catch (error) {
    console.error('Error loading game data for picks:', error);
    pickOptionsContainer.innerHTML = 'Error loading pick options.';
    submitButton.disabled = true;
  }
});
