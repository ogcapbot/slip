import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');

export async function loadSports() {
  sportSelect.innerHTML = '<option>Loading...</option>';
  sportSelect.disabled = true;

  try {
    const snapshot = await getDocs(collection(db, 'GameCache'));
    const sports = new Set();
    snapshot.forEach(doc => {
      const sport = doc.data().Sport;
      if (sport) sports.add(sport);
    });

    if (sports.size === 0) {
      sportSelect.innerHTML = '<option>No sports found</option>';
    } else {
      sportSelect.innerHTML = '<option value="">Select a sport</option>';
      sports.forEach(sport => {
        const option = document.createElement('option');
        option.value = sport;
        option.textContent = sport;
        sportSelect.appendChild(option);
      });
      sportSelect.disabled = false;
    }
  } catch (error) {
    console.error('Error loading sports:', error);
    sportSelect.innerHTML = '<option>Error loading sports</option>';
  }
}
