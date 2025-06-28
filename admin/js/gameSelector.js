import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const sportSelect = document.getElementById('sportSelect');
  const leagueSelect = document.getElementById('leagueSelect');
  const gameSelect = document.getElementById('gameSelect');
  const pickOptionsContainer = document.getElementById('pickOptionsContainer');
  const submitButton = document.querySelector('form#pickForm button[type="submit"]');

  // Reset pick buttons
  function resetPickButtons() {
    pickOptionsContainer.innerHTML = '';
    submitButton.disabled = true;
  }

  leagueSelect.addEventListener('change', async () => {
    const selectedSport = sportSelect.value;
    const selectedLeague = leagueSelect.value;

    // Reset game select and pick buttons
    gameSelect.innerHTML = '<option>Loading...</option>';
    gameSelect.disabled = true;
    resetPickButtons();

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
          option.value = doc.id; // use doc ID as value
          option.textContent = `${game.HomeTeam} vs ${game.AwayTeam} (${new Date(game.StartTimeUTC.seconds * 1000).toLocaleString()})`;
          option.dataset.homeTeam = game.HomeTeam;
          option.dataset.awayTeam = game.AwayTeam;
          gameSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading games:', error);
      gameSelect.innerHTML = '<option>Error loading games</option>';
      gameSelect.disabled = true;
      resetPickButtons();
    }
  });

  gameSelect.addEventListener('change', () => {
    resetPickButtons();

    if (!gameSelect.value) {
      submitButton.disabled = true;
      return;
    }

    // Find selected option to get teams
    const selectedOption = gameSelect.options[gameSelect.selectedIndex];
    if (!selectedOption) {
      submitButton.disabled = true;
      return;
    }

    const homeTeam = selectedOption.dataset.homeTeam || 'Home';
    const awayTeam = selectedOption.dataset.awayTeam || 'Away';

    // Create pick buttons
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

    // Track selected pick
    let selectedPick = null;

    function selectButton(btn) {
      if (selectedPick) {
        selectedPick.className = 'pick-btn blue';
      }
      btn.className = 'pick-btn green';
      selectedPick = btn;
      submitButton.disabled = false;
    }

    homeBtn.addEventListener('click', () => selectButton(homeBtn));
    awayBtn.addEventListener('click', () => selectButton(awayBtn));

    pickOptionsContainer.appendChild(homeBtn);
    pickOptionsContainer.appendChild(awayBtn);

    submitButton.disabled = true; // enable after selection
  });
});
