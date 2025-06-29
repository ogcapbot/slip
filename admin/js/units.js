// units.js
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
      if (data && data.display_unit !== undefined && data.Rank !== undefined) {
        units.push(data); // push entire data object
      }
    });

    if (units.length === 0) {
      unitsSelect.innerHTML = '<option>No units found</option>';
      unitsSelect.disabled = true;
    } else {
      // Sort units by Rank ascending
      units.sort((a, b) => a.Rank - b.Rank);

      unitsSelect.innerHTML = '<option value="" disabled selected>Select a unit</option>';
      units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.display_unit;
        option.textContent = unit.display_unit;
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
