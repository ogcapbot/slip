// wagerType.js
import { db } from '../firebaseInit.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById('sportSelect');
const wagerTypeSelect = document.getElementById('wagerTypeSelect');

sportSelect.addEventListener('change', async () => {
  const selectedSport = sportSelect.value;

  // Disable and show loading in wagerType dropdown immediately
  wagerTypeSelect.disabled = true;
  wagerTypeSelect.innerHTML = '<option>Loading wager types...</option>';

  if (!selectedSport) {
    wagerTypeSelect.innerHTML = '<option>Select a sport first</option>';
    wagerTypeSelect.disabled = true;
    return;
  }

  try {
    // Make sure Firestore collection name matches exactly, e.g. 'WagerTypes' or 'wagerType'
    const wagerTypesRef = collection(db, 'WagerTypes'); // Adjust if needed
    const q = query(wagerTypesRef, where('Sport', '==', selectedSport));
    const querySnapshot = await getDocs(q);

    const wagerTypes = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.WagerType) wagerTypes.push(data.WagerType);
    });

    if (wagerTypes.length === 0) {
      wagerTypeSelect.innerHTML = '<option>No wager types found</option>';
    } else {
      wagerTypeSelect.innerHTML = '<option value="" disabled selected>Choose wager type</option>';
      wagerTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
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
