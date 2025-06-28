import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');
const leagueSelect = document.getElementById('leagueSelect');
const gameSelect = document.getElementById('gameSelect');
const pickInput = document.getElementById('pickInput');
const submitButton = document.querySelector('form#pickForm button[type="submit"]');

leagueSelect.addEventListener('change', async () => {
  const selectedSport = sportSelect.value;
  const selectedLeague = leagueSelect.value;

  // Reset game select and pick input
  gameSelect.innerHTML = '<option>Loading...</option>';
  gameSelect.disabled = true;

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
        gameSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading games:', error);
    gameSelect.innerHTML = '<option>Error loading games</option>';
    gameSelect.disabled = true;
  }
});

// Enable pick input and submit button only when game is selected
gameSelect.addEventListener('change', () => {
  if (gameSelect.value) {
    pickInput.disabled = false;
    submitButton.disabled = false;
  } else {
    pickInput.value = '';
    pickInput.disabled = true;
    submitButton.disabled = true;
  }
});

export default {};
