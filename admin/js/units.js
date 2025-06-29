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
let allUnitsCache = [];  // cache units data for toggling

async function loadUnits(showAll = true) {
  console.log('loadUnits called with showAll =', showAll);

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
    if (allUnitsCache.length === 0) {
      // Load once and cache units
      const unitsSnapshot = await getDocs(collection(db, 'Units'));
      allUnitsCache = [];

      unitsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data && data.display_unit !== undefined && data.Rank !== undefined) {
          allUnitsCache.push(data);
        }
      });

      // Sort units by Rank ascending
      allUnitsCache.sort((a, b) => a.Rank - b.Rank);
    }

    if (allUnitsCache.length === 0) {
      unitButtonsContainer.textContent = 'No units found';
      unitsSelect.innerHTML = '<option>No units found</option>';
      unitsSelect.disabled = true;
      return;
    }

    // Clear loading text before rendering buttons
    unitButtonsContainer.textContent = '';

    // Setup grid styling for buttons
    unitButtonsContainer.style.display = 'grid';
    unitButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    unitButtonsContainer.style.gridAutoRows = 'min-content';
    unitButtonsContainer.style.gap = '4px 6px';
    unitButtonsContainer.style.marginTop = '8px';
    unitButtonsContainer.style.alignItems = 'start';

    if (showAll) {
      // Show all units as buttons
      allUnitsCache.forEach(unit => {
        const btn = createUnitButton(unit.display_unit);
        unitButtonsContainer.appendChild(btn);
      });

      unitsSelect.disabled = false;

    } else {
      // Show only "1 Unit" selected + Change Unit button

      const oneUnitData = allUnitsCache.find(u => u.display_unit === '1 Unit') || allUnitsCache[0];
      const oneUnitName = oneUnitData.display_unit;

      // Selected unit button green
      const selectedBtn = createUnitButton(oneUnitName);
      selectedBtn.classList.remove('blue');
      selectedBtn.classList.add('green');
      unitButtonsContainer.appendChild(selectedBtn);

      // Placeholder for spacing in middle column (optional)
      const placeholderBtn = createUnitButton('');
      placeholderBtn.style.visibility = 'hidden';
      placeholderBtn.style.pointerEvents = 'none';
      placeholderBtn.style.margin = '0';
      placeholderBtn.style.padding = '0';
      placeholderBtn.style.height = selectedBtn.offsetHeight ? selectedBtn.offsetHeight + 'px' : '36px';
      unitButtonsContainer.appendChild(placeholderBtn);

      unitsSelect.disabled = false;

      // Sync hidden select for submission with "1 Unit"
      unitsSelect.innerHTML = '';
      const option = document.createElement('option');
      option.value = oneUnitName;
      option.selected = true;
      unitsSelect.appendChild(option);

      // Append Change Unit button
      createAndAppendChangeUnitBtn();
    }
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

  // Append Change Unit button
  createAndAppendChangeUnitBtn();

  // Sync hidden select for submission
  unitsSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = unitName;
  option.selected = true;
  unitsSelect.appendChild(option);
  unitsSelect.disabled = false;
  unitsSelect.dispatchEvent(new Event('change'));
}

function createAndAppendChangeUnitBtn() {
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

    changeUnitBtn.addEventListener('click', () => {
      // On clicking change unit, show all units and reset selection
      loadUnits(true);
    });
  }
  unitButtonsContainer.appendChild(changeUnitBtn);
}

function resetUnitSelection() {
  selectedUnit = null;

  if (changeUnitBtn) {
    changeUnitBtn.remove();
    changeUnitBtn = null;
  }

  unitsSelect.innerHTML = '<option value="" disabled selected>Select a unit</option>';
  unitsSelect.disabled = true;
  unitsSelect.dispatchEvent(new Event('change'));

  unitButtonsContainer.innerHTML = '';
  unitButtonsContainer.style.display = ''; // Reset display style

  // Load just the "1 Unit" button selected by default
  loadUnits(false);
}

// INITIAL CALL to load units on script load, start with only "1 Unit" selected
loadUnits(false);

export { loadUnits };
