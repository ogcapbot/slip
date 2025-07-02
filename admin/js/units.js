import { db } from '../firebaseInit.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const unitsSelect = document.getElementById('unitsSelect');
if (unitsSelect) {
  unitsSelect.style.display = 'none'; // hide native select
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

let unitSummaryContainer = document.getElementById('unitSummaryContainer');
if (!unitSummaryContainer) {
  unitSummaryContainer = document.createElement('div');
  unitSummaryContainer.id = 'unitSummaryContainer';
  unitSummaryContainer.style.marginTop = '10px';

  unitSummaryContainer.style.display = 'grid';
  unitSummaryContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
  unitSummaryContainer.style.alignItems = 'center';
  unitSummaryContainer.style.gap = '0 10px';
  unitSummaryContainer.style.display = 'none'; // initially hidden

  unitButtonsContainer.parentNode.insertBefore(unitSummaryContainer, unitButtonsContainer);
}

let unitSummaryText = document.createElement('div');
unitSummaryText.style.gridColumn = '1 / 2';
unitSummaryText.style.fontWeight = '600';
unitSummaryText.style.fontSize = '16px';
unitSummaryText.style.color = '#000';
unitSummaryText.style.fontFamily = 'inherit';
unitSummaryText.style.margin = '0';

unitSummaryContainer.appendChild(unitSummaryText);

let updateUnitBtn = document.createElement('button');
updateUnitBtn.type = 'button';
updateUnitBtn.textContent = 'Update';
updateUnitBtn.className = 'pick-btn blue';

updateUnitBtn.style.gridColumn = '3 / 4';
updateUnitBtn.style.minWidth = '100px';
updateUnitBtn.style.height = '32px';
updateUnitBtn.style.lineHeight = '32px';
updateUnitBtn.style.fontSize = '16px';
updateUnitBtn.style.fontFamily = 'inherit';
updateUnitBtn.style.backgroundColor = '#3a82d6';
updateUnitBtn.style.color = '#fff';
updateUnitBtn.style.border = 'none';
updateUnitBtn.style.borderRadius = '10px';
updateUnitBtn.style.padding = '0 20px';
updateUnitBtn.style.cursor = 'pointer';
updateUnitBtn.style.boxShadow = '0 3px 6px rgba(0,0,0,0.1)';
updateUnitBtn.style.whiteSpace = 'nowrap';

unitSummaryContainer.appendChild(updateUnitBtn);

let spacer = document.createElement('div');
spacer.style.gridColumn = '2 / 3';
unitSummaryContainer.insertBefore(spacer, updateUnitBtn);

let selectedUnit = null;          // The display_unit string selected by user
let selectedUnitValue = null;     // The associated Units value from DB (hidden for submission)
let allUnitsCache = [];

const explanatoryTextContainer = document.getElementById('explanatoryTextContainer');

unitButtonsContainer.style.display = 'grid';
unitButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
unitButtonsContainer.style.gridAutoRows = 'min-content';
unitButtonsContainer.style.gap = '4px 6px';
unitButtonsContainer.style.marginTop = '8px';
unitButtonsContainer.style.alignItems = 'start';

async function loadUnits() {
  if (!unitButtonsContainer || !unitsSelect) {
    console.error('Required elements missing.');
    return;
  }

  unitButtonsContainer.innerHTML = '';
  selectedUnit = null;
  selectedUnitValue = null;

  unitsSelect.innerHTML = '';
  unitsSelect.disabled = true;

  unitButtonsContainer.textContent = 'Loading units...';

  try {
    if (allUnitsCache.length === 0) {
      const unitsSnapshot = await getDocs(collection(db, 'Units'));
      allUnitsCache = [];

      unitsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data && data.display_unit !== undefined && data.Units !== undefined && data.Rank !== undefined) {
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

  // Find Units value from cache
  const selectedUnitObj = allUnitsCache.find(u => u.display_unit === unitName);
  selectedUnitValue = selectedUnitObj ? selectedUnitObj.Units : null;

  // Hide buttons after selection
  unitButtonsContainer.style.display = 'none';

  unitsSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = unitName;
  option.selected = true;
  unitsSelect.appendChild(option);
  unitsSelect.disabled = false;
  unitsSelect.dispatchEvent(new Event('change'));

  // Show summary container
  unitSummaryContainer.style.display = 'grid';

  updateUnitSummaryText();

  // Update the global running summary list (append line "Unit Selected: [unitName]")
  updatePickSummary();

  // Here you can store selectedUnit and selectedUnitValue globally or send upwards for DB submit
  // For example, window.selectedUnitData = { name: selectedUnit, value: selectedUnitValue };
}

function updateUnitSummaryText() {
  let dynamicExplanation = '';
  if (explanatoryTextContainer) {
    dynamicExplanation = explanatoryTextContainer.textContent.trim();
  }
  if (selectedUnit) {
    unitSummaryText.textContent = `Unit Selected: ${selectedUnit} ${dynamicExplanation}`;
  } else {
    unitSummaryText.textContent = '';
  }
}

updateUnitBtn.addEventListener('click', () => {
  unitButtonsContainer.style.display = 'grid';
  unitButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  unitButtonsContainer.style.gridAutoRows = 'min-content';
  unitButtonsContainer.style.gap = '4px 6px';
  unitButtonsContainer.style.marginTop = '8px';
  unitButtonsContainer.style.alignItems = 'start';

  unitButtonsContainer.innerHTML = '';
  allUnitsCache.forEach(unit => {
    const btn = createUnitButton(unit.display_unit);
    unitButtonsContainer.appendChild(btn);
  });

  unitSummaryContainer.style.display = 'none';
});

function updatePickSummary() {
  const pickSummaryContainer = document.getElementById('pickSummaryContainer');
  if (!pickSummaryContainer) return;

  let existing = Array.from(pickSummaryContainer.querySelectorAll('p')).find(p => p.dataset.label === 'Unit Selected');
  if (existing) {
    pickSummaryContainer.removeChild(existing);
  }

  if (selectedUnit) {
    const p = document.createElement('p');
    p.dataset.label = 'Unit Selected';
    p.textContent = `Unit Selected: ${selectedUnit}`;
    pickSummaryContainer.appendChild(p);
  }
}

export { loadUnits, updateUnitSummaryText, showUnitSection };

function showUnitSection() {
  unitSummaryContainer.style.display = 'grid';
  unitButtonsContainer.style.display = 'none';
}

// Initial load of all units buttons
loadUnits();
