import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const unitsSelect = document.getElementById('unitsSelect');

if (unitsSelect) {
  unitsSelect.style.display = 'none';
}

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

// Container for the summary text and update button
let unitSummaryContainer = document.getElementById('unitSummaryContainer');
if (!unitSummaryContainer) {
  unitSummaryContainer = document.createElement('div');
  unitSummaryContainer.id = 'unitSummaryContainer';
  unitSummaryContainer.style.marginTop = '10px';
  unitSummaryContainer.style.display = 'flex';
  unitSummaryContainer.style.justifyContent = 'space-between';
  unitSummaryContainer.style.alignItems = 'center';
  unitSummaryContainer.style.display = 'none'; // Hidden initially

  // Insert before buttons container for layout
  unitButtonsContainer.parentNode.insertBefore(unitSummaryContainer, unitButtonsContainer);
}

let unitSummaryText = document.createElement('div');
unitSummaryText.style.fontWeight = 'bold';
unitSummaryText.style.fontSize = '14px';
unitSummaryText.style.color = '#000';
unitSummaryContainer.appendChild(unitSummaryText);

let updateUnitBtn = document.createElement('button');
updateUnitBtn.type = 'button';
updateUnitBtn.textContent = 'Update';
updateUnitBtn.className = 'pick-btn blue';

// Styling the button as requested
updateUnitBtn.style.minWidth = '78px'; // about 65% of 120px
updateUnitBtn.style.width = 'auto';
updateUnitBtn.style.padding = '2px 8px';
updateUnitBtn.style.fontSize = '14px';
updateUnitBtn.style.lineHeight = '18px';
updateUnitBtn.style.boxSizing = 'border-box';
updateUnitBtn.style.cursor = 'pointer';

unitSummaryContainer.appendChild(updateUnitBtn);

let selectedUnit = null;
let allUnitsCache = [];

// Dynamic explanatory text container - your existing element with explanatory text
const explanatoryTextContainer = document.getElementById('explanatoryTextContainer');

unitButtonsContainer.style.display = 'none'; // Hide unit buttons initially

async function loadUnits(showAll = true) {
  if (!unitButtonsContainer || !unitsSelect) {
    console.error('Required elements missing.');
    return;
  }

  unitButtonsContainer.innerHTML = '';
  selectedUnit = null;

  unitsSelect.innerHTML = '<option value="" disabled selected>Select a unit</option>';
  unitsSelect.disabled = true;

  unitButtonsContainer.textContent = 'Loading units...';

  try {
    if (allUnitsCache.length === 0) {
      const unitsSnapshot = await getDocs(collection(db, 'Units'));
      allUnitsCache = [];

      unitsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data && data.display_unit !== undefined && data.Rank !== undefined) {
          allUnitsCache.push(data);
        }
      });

      allUnitsCache.sort((a, b) => a.Rank - b.Rank);
    }

    if (allUnitsCache.length === 0) {
      unitButtonsContainer.textContent = 'No units found';
      unitsSelect.innerHTML = '<option>No units found</option>';
      unitsSelect.disabled = true;
      return;
    }

    unitButtonsContainer.textContent = '';

    if (showAll) {
      // Show all unit buttons
      unitButtonsContainer.style.display = 'grid';
      unitButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
      unitButtonsContainer.style.gridAutoRows = 'min-content';
      unitButtonsContainer.style.gap = '4px 6px';
      unitButtonsContainer.style.marginTop = '8px';
      unitButtonsContainer.style.alignItems = 'start';

      allUnitsCache.forEach(unit => {
        const btn = createUnitButton(unit.display_unit);
        unitButtonsContainer.appendChild(btn);
      });

      unitsSelect.disabled = false;
    } else {
      // Show only summary, hide buttons
      unitButtonsContainer.style.display = 'none';

      // Default selected unit: 1 Unit or first in list
      const oneUnitData = allUnitsCache.find(u => u.display_unit === '1 Unit') || allUnitsCache[0];
      if (oneUnitData) {
        selectedUnit = oneUnitData.display_unit;
      } else {
        selectedUnit = null;
      }

      unitsSelect.disabled = false;

      unitsSelect.innerHTML = '';
      if (selectedUnit) {
        const option = document.createElement('option');
        option.value = selectedUnit;
        option.selected = true;
        unitsSelect.appendChild(option);
      }
    }

    updateUnitSummaryText();
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
  btn.className = 'pick-btn blue';

  const match = unitName.match(/^(.+?)\s*(\(.+\))?$/);
  if (match) {
    btn.innerHTML = match[1].trim();
    if (match[2]) {
      const span = document.createElement('span');
      span.textContent = match[2];
      span.style.display = 'block';
      btn.appendChild(span);
    }
  } else {
    btn.textContent = unitName;
  }

  btn.style.paddingTop = '6px';
  btn.style.paddingBottom = '6px';
  btn.style.marginTop = '2px';
  btn.style.marginBottom = '2px';

  btn.style.width = '100%';
  btn.style.minWidth = '0';
  btn.style.boxSizing = 'border-box';
  btn.style.whiteSpace = 'normal';

  btn.addEventListener('click', () => selectUnit(unitName));

  return btn;
}

function selectUnit(unitName) {
  if (selectedUnit === unitName) return;
  selectedUnit = unitName;

  // Hide buttons container after selection
  unitButtonsContainer.style.display = 'none';

  unitsSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = unitName;
  option.selected = true;
  unitsSelect.appendChild(option);
  unitsSelect.disabled = false;
  unitsSelect.dispatchEvent(new Event('change'));

  updateUnitSummaryText();
}

// Update the summary text with dynamic explanatory text
function updateUnitSummaryText() {
  let dynamicExplanation = '';
  if (explanatoryTextContainer) {
    dynamicExplanation = explanatoryTextContainer.textContent.trim();
  }
  if (selectedUnit) {
    unitSummaryText.textContent = `Unit Selected: ${selectedUnit} - ${dynamicExplanation}`;
  } else {
    unitSummaryText.textContent = '';
  }
}

// Show unit section (summary + buttons hidden initially)
function showUnitSection() {
  unitSummaryContainer.style.display = 'flex';
  unitButtonsContainer.style.display = 'none';
}

// Hide entire unit section
function hideUnitSection() {
  unitSummaryContainer.style.display = 'none';
  unitButtonsContainer.style.display = 'none';
}

// When Update button clicked, show all unit buttons to select from
updateUnitBtn.addEventListener('click', () => {
  unitButtonsContainer.style.display = 'grid';
  unitButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  unitButtonsContainer.style.gridAutoRows = 'min-content';
  unitButtonsContainer.style.gap = '4px 6px';
  unitButtonsContainer.style.marginTop = '8px';
  unitButtonsContainer.style.alignItems = 'start';

  unitButtonsContainer.innerHTML = ''; // clear current buttons
  allUnitsCache.forEach(unit => {
    const btn = createUnitButton(unit.display_unit);
    unitButtonsContainer.appendChild(btn);
  });
});

// Initial load with summary only (no buttons shown)
loadUnits(false);

// Export the toggle functions for your external use
export { loadUnits, showUnitSection, hideUnitSection };
