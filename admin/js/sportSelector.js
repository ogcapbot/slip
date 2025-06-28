import { db } from "../firebaseInit.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById("sportSelect");

export async function loadSports() {
  sportSelect.innerHTML = "<option>Loading...</option>";

  try {
    const querySnapshot = await getDocs(collection(db, "GameCache"));

    const sportsSet = new Set();
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.Sport) {
        sportsSet.add(data.Sport);
      }
    });

    if (sportsSet.size === 0) {
      sportSelect.innerHTML = "<option>No sports found</option>";
      return;
    }

    // Clear dropdown and add default option
    sportSelect.innerHTML = `<option value="" disabled selected>Choose Sport</option>`;

    // Add unique sports as options
    sportsSet.forEach(sport => {
      const option = document.createElement("option");
      option.value = sport;
      option.textContent = sport;
      sportSelect.appendChild(option);
    });
  } catch (error) {
    sportSelect.innerHTML = "<option>Error loading sports</option>";
    console.error("Error loading sports:", error);
  }
}

// Call loadSports immediately to populate on page load
loadSports();
