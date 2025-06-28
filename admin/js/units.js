import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const unitsSelect = document.getElementById('unitsSelect');

export async function loadUnits() {
  unitsSelect.disabled = true;
  unitsSelect.innerHTML = '<option>Loading units...</option>';

  try {
    const unitsSnapshot = await getDocs(collection(db, 'Units'));
    const units = [];
    unitsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.display_unit) units.push(data.display_unit);
    });

    if (units.length === 0) {
      unitsSelect.innerHTML = '<option>No units found</option>';
      unitsSelect.disabled = true;
    } else {
      unitsSelect.innerHTML = '<option value="" disabled selected>Select a unit</option>';
      units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        unitsSelect.appendChild(option);
      });
      unitsSelect.disabled = false;
    }
  } catch (error) {
    console.error('Error loading units:', error);
    unitsSelect.innerHTML = '<option>Error loading units</option>';
    unitsSelect.disabled = true;
  }
}
