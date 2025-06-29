// sportSelector.js
import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');

export async function loadSports() {
  try {
    console.log('loadSports() started');
    sportSelect.innerHTML = '<option>Loading...</option>';
    sportSelect.disabled = true;

    const snapshot = await getDocs(collection(db, 'GameCache'));
    console.log('Firestore GameCache docs fetched:', snapshot.size);

    const sports = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.Sport) {
        sports.add(data.Sport);
      }
    });

    console.log('Unique sports found:', Array.from(sports));

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
      console.log('Sports dropdown enabled and populated');
    }
  } catch (error) {
    console.error('Error loading sports:', error);
    sportSelect.innerHTML = '<option>Error loading sports</option>';
  }
}
