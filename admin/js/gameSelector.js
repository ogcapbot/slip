// admin/js/gameSelector.js
import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');
const leagueSelect = document.getElementById('leagueSelect');
const gameSelect = document.getElementById('gameSelect');
const pickOptionsContainer = document.getElementById('pickOptionsContainer');
const submitButton = document.querySelector('form#pickForm button[type="submit"]');

// Load games when league changes
leagueSelect.addEventListener('change', async () => {
  const selectedSport = sportSelect.value;
  const selectedLeague = leagueSelect.value;

  // Reset game select and pick buttons
  gameSelect.innerHTML = '<option>Loading...</option>';
  gameSelect.disabled = true;
  pickOptionsContainer.innerHTML = '';
  submitButton.disabled = true;

  if (!selectedSport || !selectedLeague) {
    gameSelect.innerHTML = '<option>Select a league first</option>';
    gameSelect.disabled = true;
    return;
  }

  try {
    const q = query(
      collection(db, 'GameCache'),
      where('Sport', '==', selectedSport),
      where('League', '==', selectedLeague)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      gameSelect.innerHTML = '<option>No games found</option>';
      gameSelect.disabled = true;
      return;
    }

    gameSelect.innerHTML = '<option value="">Select a game</option>';
    gameSelect.disabled = false;

    querySnapshot.forEach(doc => {
      const game = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${game.HomeTeam} vs ${game.AwayTeam} (${new Date(game.StartTimeUTC.seconds * 1000).toLocaleString()})`;
      option.dataset.homeTeam = game.HomeTeam;
      option.dataset.awayTeam = game.AwayTeam;
      gameSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading games:', error);
    gameSelect.innerHTML = '<option>Error loading games</option>';
    gameSelect.disabled = true;
  }
});

// Manage pick buttons and enable submit button when a pick is selected
gameSelect.addEventListener('change', () => {
  pickOptionsContainer.innerHTML = '';
  submitButton.disabled = true;

  if (!gameSelect.value) return;

  const selectedOption = gameSelect.options[gameSelect.selectedIndex];
  if (!selectedOption) return;

  const homeTeam = selectedOption.dataset.homeTeam || 'Home';
  const awayTeam = selectedOption.dataset.awayTeam || 'Away';

  // Create pick buttons for home and away teams
  const homeBtn = document.createElement('button');
  homeBtn.type = 'button';
  homeBtn.textContent = homeTeam;
  homeBtn.style.flex = '1';
  homeBtn.className = 'pick-btn blue';

  const awayBtn = document.createElement('button');
  awayBtn.type = 'button';
  awayBtn.textContent = awayTeam;
  awayBtn.style.flex = '1';
  awayBtn.className = 'pick-btn blue';

  let selectedPick = null;

  function selectButton(btn) {
    if (selectedPick) {
      selectedPick.classList.remove('green');
      selectedPick.classList.add('blue');
    }
    btn.classList.remove('blue');
    btn.classList.add('green');
    selectedPick = btn;
    submitButton.disabled = false;
  }

  homeBtn.addEventListener('click', () => selectButton(homeBtn));
  awayBtn.addEventListener('click', () => selectButton(awayBtn));

  pickOptionsContainer.appendChild(homeBtn);
  pickOptionsContainer.appendChild(awayBtn);
});

export default {};
