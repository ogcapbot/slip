import { db } from '../firebaseInit.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');
const gameSelect = document.getElementById('gameSelect');
const wagerTypeSelect = document.getElementById('wagerTypeSelect');

wagerTypeSelect.disabled = true; // Initially disabled

gameSelect.addEventListener('change', async () => {
  const selectedGame = gameSelect.value;
  const selectedSport = sportSelect.value;

  wagerTypeSelect.disabled = true;
  wagerTypeSelect.innerHTML = '<option>Loading wager types...</option>';

  if (!selectedGame) {
    wagerTypeSelect.innerHTML = '<option>Select a game first</option>';
    wagerTypeSelect.disabled = true;
    return;
  }

  try {
    const wagerTypesRef = collection(db, 'WagerTypes');

    // Query wagers with Sport == "All"
    const allQuery = query(wagerTypesRef, where('Sport', '==', 'All'), orderBy('id'));

    // Query wagers with Sport == selectedSport
    const sportQuery = query(wagerTypesRef, where('Sport', '==', selectedSport), orderBy('id'));

    const [allSnapshot, sportSnapshot] = await Promise.all([
      getDocs(allQuery),
      getDocs(sportQuery)
    ]);

    // Collect all wagers from both queries
    const wagerTypes = [];

    allSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.wager_label_template) {
        wagerTypes.push({ id: data.id, label: data.wager_label_template });
      }
    });

    sportSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.wager_label_template) {
        wagerTypes.push({ id: data.id, label: data.wager_label_template });
      }
    });

    // Sort combined wagers by id ascending
    wagerTypes.sort((a, b) => a.id - b.id);

    if (wagerTypes.length === 0) {
      wagerTypeSelect.innerHTML = '<option>No wager types found</option>';
    } else {
      wagerTypeSelect.innerHTML = '<option value="" disabled selected>Choose wager type</option>';
      wagerTypes.forEach(({ id, label }) => {
        const option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        wagerTypeSelect.appendChild(option);
      });
      wagerTypeSelect.disabled = false;
    }
  } catch (error) {
    console.error('Error loading wager types:', error);
    wagerTypeSelect.innerHTML = '<option>Error loading wager types</option>';
    wagerTypeSelect.disabled = true;
  }
});
