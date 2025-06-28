// gameSelector.js
import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');
const leagueSelect = document.getElementById('leagueSelect');
const gameSelect = document.getElementById('gameSelect');
const pickInput = document.getElementById('pickInput');
const submitButton = document.querySelector('form#pickForm button[type="submit"]');
const pickButtonsContainerId = 'pickButtonsContainer';

leagueSelect.addEventListener('change', async () => {
  const selectedSport = sportSelect.value;
  const selectedLeague = leagueSelect.value;

  // Reset game select and pick input/buttons
  gameSelect.innerHTML = '<option>Loading...</option>';
  gameSelect.disabled = true;

  clearPickButtons();
  pickInput.value = '';
  pickInput.disabled = true;
  submitButton.disabled = true;

  if (!selectedSport || !selectedLeague) {
    gameSelect.innerHTML = '<option>Select a league first</option>';
    gameSelect.disabled = true;
    return;
  }

  try {
    // Query GameCache for games with the chosen sport AND league
    const q = query(
      collection(db, 'GameCache'),
      where('Sport', '==', selectedSport),
      where('League', '==', selectedLeague)
    );
    const querySnapshot = await getDocs(q);

    gameSelect.innerHTML = '';

    if (querySnapshot.empty) {
      gameSelect.innerHTML = '<option>No games found</option>';
      gameSelect.disabled = true;
    } else {
      gameSelect.disabled = false;
      gameSelect.innerHTML = '<option value="">Select a game</option>';
      querySnapshot.forEach(doc => {
        const game = doc.data();
        const option = document.createElement('option');
        option.value = doc.id; // use document ID as value
        option.textContent = `${game.HomeTeam} vs ${game.AwayTeam} (${new Date(game.StartTimeUTC.seconds * 1000).toLocaleString()})`;
        // Save HomeTeam and AwayTeam data as dataset attributes for later use
        option.dataset.homeTeam = game.HomeTeam;
        option.dataset.awayTeam = game.AwayTeam;
        gameSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading games:', error);
    gameSelect.innerHTML = '<option>Error loading games</option>';
    gameSelect.disabled = true;
  }
});

// Clear any existing pick buttons container
function clearPickButtons() {
  const existing = document.getElementById(pickButtonsContainerId);
  if (existing) {
    existing.remove();
  }
}

// Create pick buttons dynamically for selected game teams
function createPickButtons(homeTeam, awayTeam) {
  clearPickButtons();

  const container = document.createElement('div');
  container.id = pickButtonsContainerId;
  container.style.display = 'flex';
  container.style.justifyContent = 'space-between';
  container.style.margin = '10px 0';

  const buttonStyle = `
    flex: 1;
    padding: 8px 12px;
    font-size: 0.9rem;
    font-weight: bold;
    border: none;
    cursor: pointer;
    color: white;
    background-color: #4285f4; /* blue */
    border-radius: 4px;
    transition: background-color 0.3s ease;
  `;

  const buttonSpacing = '8px';

  // Home Team Button
  const homeBtn = document.createElement('button');
  homeBtn.textContent = homeTeam;
  homeBtn.style.cssText = buttonStyle + `margin-right: ${buttonSpacing};`;
  homeBtn.dataset.team = homeTeam;

  // Away Team Button
  const awayBtn = document.createElement('button');
  awayBtn.textContent = awayTeam;
  awayBtn.style.cssText = buttonStyle + `margin-left: ${buttonSpacing};`;
  awayBtn.dataset.team = awayTeam;

  // Append buttons to container
  container.appendChild(homeBtn);
  container.appendChild(awayBtn);

  // Insert container right after gameSelect
  gameSelect.parentNode.insertBefore(container, pickInput);

  // Disable original pick input and submit button until selection
  pickInput.style.display = 'none';
  submitButton.disabled = true;

  // Handle button clicks to toggle selection
  let selectedTeam = null;

  function selectTeam(button) {
    if (selectedTeam === button) return; // no change

    // Reset buttons to blue
    homeBtn.style.backgroundColor = '#4285f4';
    awayBtn.style.backgroundColor = '#4285f4';

    // Set clicked button green
    button.style.backgroundColor = '#0f9d58'; // green

    selectedTeam = button;
