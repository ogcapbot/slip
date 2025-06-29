import { db } from '../firebaseInit.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');
const leagueSelect = document.getElementById('leagueSelect');
const gameSelect = document.getElementById('gameSelect');

async function loadGames(sport, league) {
  if (!gameSelect) return;

  gameSelect.innerHTML = '';
  
  if (!sport) {
    gameSelect.innerHTML = '<option>Select a sport first</option>';
    gameSelect.disabled = true;
    return;
  }

  if (!league) {
    gameSelect.innerHTML = '<option>Select a league first</option>';
    gameSelect.disabled = true;
    return;
  }

  gameSelect.disabled = true;
  gameSelect.innerHTML = '<option>Loading games...</option>';

  try {
    // Query games filtered by sport and league
    const gamesQuery = query(collection(db, 'GameCache'), where('Sport', '==', sport), where('League', '==', league));
    const gamesSnapshot = await getDocs(gamesQuery);

    if (gamesSnapshot.empty) {
      gameSelect.innerHTML = '<option>No games found</option>';
      gameSelect.disabled = true;
      return;
    }

    gameSelect.innerHTML = '';

    // Sort games by StartTimeUTC if available, else by id
    const gamesArray = [];
    gamesSnapshot.forEach(doc => {
      const data = doc.data();
      gamesArray.push({ id: doc.id, ...data });
    });
    gamesArray.sort((a, b) => {
      if (a.StartTimeUTC && b.StartTimeUTC) {
        return a.StartTimeUTC.seconds - b.StartTimeUTC.seconds;
      }
      return a.id.localeCompare(b.id);
    });

    gamesArray.forEach(game => {
      const option = document.createElement('option');
      option.value = game.id;
      option.textContent = `${game.HomeTeam || 'Home'} vs ${game.AwayTeam || 'Away'}`;
      gameSelect.appendChild(option);
    });

    gameSelect.disabled = false;
  } catch (error) {
    console.error('Error loading games:', error);
    gameSelect.innerHTML = '<option>Error loading games</option>';
    gameSelect.disabled = true;
  }
}

// Bind event to leagueSelect changes to load games accordingly
if (leagueSelect) {
  leagueSelect.addEventListener('change', () => {
    const sport = sportSelect?.value || '';
    const league = leagueSelect.value;
    loadGames(sport, league);
  });
}

// Export for external calls if needed
export { loadGames };
