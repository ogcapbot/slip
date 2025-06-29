// admin/js/units.js
import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const unitsSelect = document.getElementById('unitsSelect');

// Hide the original select for units but keep for form compatibility
if (unitsSelect) {
  unitsSelect.style.display = 'none';
}

// Create or reuse container for unit buttons, insert after label or select
let unitButtonsContainer = document.getElementById('unitButtonsContainer');
if (!unitButtonsContainer) {
  unitButtonsContainer = document.createElement('div');
  unitButtonsContainer.id = 'unitButtonsContainer';

  const unitsLabel = document.querySelector('label[for="unitsSelect"]');
  if (unitsLabel) {
    unitsLabel.parentNode.insertBefore(unitButtonsContainer, unitsLabel.nextSibling);
  } else if (unitsSelect && unitsSelect.parentNode) {
    unitsSelect.parentNode.insertBefore(unitButtonsContainer, unitsSelect.nextSibling);
  } else {
    document.body.appendChild(unitButtonsContainer);
  }
}

let selectedUnit = null;
let changeUnitBtn = null;

async function loadUnits() {
  console.log('loadUnits called');

  if (!unitButtonsContainer || !unitsSelect) {
    console.error('Required elements missing.');
    return;
  }

  // Clear previous buttons and reset state
  unitButtonsContainer.innerHTML = '';
  selectedUnit = null;

  if (changeUnitBtn) {
    changeUnitBtn.remove();
    changeUnitBtn = null;
  }

  unitsSelect.innerHTML = '<option value="" disabled selected>Select a unit</option>';
  unitsSelect.disabled = true;

  unitButtonsContainer.textContent = 'Loading units...';

  try {
    const unitsSnapshot = await getDocs(collection(db, 'Units'));
    const units = [];

    unitsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.display_unit !== undefined && data.Rank !== undefined) {
        units.push(data);
      }
    });

    console.log('units fetched:', units.length);

    if (units.length === 0) {
      unitButtonsContainer.textContent = 'No units found';
      unitsSelect.innerHTML = '<option>No units found</option>';
      unitsSelect.disabled = true;
      return;
    }

    // Sort units by Rank ascending
    units.sort((a, b) => a.Rank - b.Rank);

    // Clear loading text before rendering buttons
    unitButtonsContainer.textContent = '';

    // Setup grid styling for buttons
    unitButtonsContainer.style.display = 'grid';
    unitButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    unitButtonsContainer.style.gridAutoRows = 'min-content';
    unitButtonsContainer.style.gap = '4px 6px';
    unitButtonsContainer.style.marginTop = '8px';
    unitButtonsContainer.style.alignItems = 'start';

    // Append buttons
    units.forEach(unit => {
      const btn = createUnitButton(unit.display_unit);
      unitButtonsContainer.appendChild(btn);
    });

    unitsSelect.disabled = false;
  } catch (error) {
    console.error('Error loading units:', error);
    unitButtonsContainer.textContent = 'Error loading units';
    unitsSelect.innerHTML = '<option>Error loading units</option>';
    unitsSelect.disabled = true;
  }
}

function createUnitButton(unitName) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = unitName;
  btn.className = 'pick-btn blue';

  btn.style.paddingTop = '6px';
  btn.style.paddingBottom = '6px';
  btn.style.marginTop = '2px';
  btn.style.marginBottom = '2px';

  btn.style.width = '100%';
  btn.style.minWidth = '0';
  btn.style.boxSizing = 'border-box';

  btn.addEventListener('click', () => selectUnit(unitName));

  return btn;
}

function selectUnit(unitName) {
  if (selectedUnit === unitName) return;
  selectedUnit = unitName;

  if (!unitButtonsContainer) return;

  // Clear and reset container with selected unit + change button
  unitButtonsContainer.innerHTML = '';

  unitButtonsContainer.style.display = 'grid';
  unitButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  unitButtonsContainer.style.gridAutoRows = 'min-content';
  unitButtonsContainer.style.gap = '4px 6px';
  unitButtonsContainer.style.marginTop = '8px';
  unitButtonsContainer.style.alignItems = 'start';

  // Selected unit button green
  const selectedBtn = createUnitButton(unitName);
  selectedBtn.classList.remove('blue');
  selectedBtn.classList.add('green');
  unitButtonsContainer.appendChild(selectedBtn);

  // Placeholder for spacing in middle column
  const placeholderBtn = createUnitButton('');
  placeholderBtn.style.visibility = 'hidden';
  placeholderBtn.style.pointerEvents = 'none';
  placeholderBtn.style.margin = '0';
  placeholderBtn.style.padding = '0';
  placeholderBtn.style.height = selectedBtn.offsetHeight ? selectedBtn.offsetHeight + 'px' : '36px';
  unitButtonsContainer.appendChild(placeholderBtn);

  // Change Unit button
  if (!changeUnitBtn) {
    changeUnitBtn = document.createElement('button');
    changeUnitBtn.type = 'button';
    changeUnitBtn.textContent = 'Change Unit';
    changeUnitBtn.className = 'pick-btn blue';
    changeUnitBtn.style.minWidth = '120px';
    changeUnitBtn.style.width = '100%';
    changeUnitBtn.style.boxSizing = 'border-box';
    changeUnitBtn.style.alignSelf = 'flex-start';
    changeUnitBtn.style.marginTop = '0';

    changeUnitBtn.addEventListener('click', resetUnitSelection);
  }
  unitButtonsContainer.appendChild(changeUnitBtn);

  // Sync hidden select for submission
  unitsSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = unitName;
  option.selected = true;
  unitsSelect.appendChild(option);
  unitsSelect.disabled = false;
  unitsSelect.dispatchEvent(new Event('change'));
}

function resetUnitSelection() {
  selectedUnit = null;

  if (!unitButtonsContainer || !unitsSelect) return;

  if (changeUnitBtn) {
    changeUnitBtn.remove();
    changeUnitBtn = null;
  }

  unitsSelect.innerHTML = '<option value="" disabled selected>Select a unit</option>';
  unitsSelect.disabled = true;
  unitsSelect.dispatchEvent(new Event('change'));

  unitButtonsContainer.innerHTML = '';
  unitButtonsContainer.style.display = ''; // Reset display style

  // Reload units so buttons re-appear after reset
  loadUnits();
}

// INITIAL CALL to load units on script load
loadUnits();

export { loadUnits };
