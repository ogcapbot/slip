showNumberInputModal(wagerLabel) {
  if (this.numberModal) {
    this.numberModal.remove();
  }

  this.numberModal = document.createElement('div');
  this.numberModal.style.position = 'fixed';
  this.numberModal.style.top = '0';
  this.numberModal.style.left = '0';
  this.numberModal.style.width = '100vw';
  this.numberModal.style.height = '100vh';
  this.numberModal.style.backgroundColor = 'rgba(0,0,0,0.7)';
  this.numberModal.style.display = 'flex';
  this.numberModal.style.justifyContent = 'center';
  this.numberModal.style.alignItems = 'center';
  this.numberModal.style.zIndex = '1000';

  const modalContent = document.createElement('div');
  modalContent.style.background = '#fff';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.width = '90%';
  modalContent.style.maxWidth = '320px';
  modalContent.style.textAlign = 'center';
  modalContent.style.fontFamily = "'Oswald', sans-serif";

  // Fix spaces before PLUS, MINUS, OVER, UNDER in title
  let cleanLabel = wagerLabel.replace(/\[\[NUM\]\]/g, '').trim();
  cleanLabel = cleanLabel.replace(/(PLUS|MINUS|OVER|UNDER)/g, ' $1');

  const modalTitle = document.createElement('h3');
  modalTitle.textContent = `Enter Number for: ${cleanLabel}`;
  modalContent.appendChild(modalTitle);

  const input = document.createElement('input');
  input.type = 'number';
  input.step = '0.5';
  input.min = '0.5';
  input.style.fontSize = '1em';   // smaller font
  input.style.padding = '6px';    // smaller padding
  input.style.width = '70%';      // smaller width
  input.style.margin = '10px 0';
  input.placeholder = 'Enter whole or half number (e.g. 1, 1.5, 2)';
  modalContent.appendChild(input);

  const errorMsg = document.createElement('div');
  errorMsg.style.color = 'red';
  errorMsg.style.marginBottom = '10px';
  errorMsg.style.height = '1.2em';
  modalContent.appendChild(errorMsg);

  const submitBtn = document.createElement('button');
  submitBtn.textContent = 'Submit';
  submitBtn.classList.add('admin-button');
  submitBtn.style.width = '100%';
  submitBtn.style.fontSize = '1.1em';
  modalContent.appendChild(submitBtn);

  submitBtn.addEventListener('click', () => {
    const val = input.value.trim();

    if (!val || isNaN(val)) {
      errorMsg.textContent = 'Please enter a valid number.';
      return;
    }

    const numVal = parseFloat(val);
    if (numVal < 0.5) {
      errorMsg.textContent = 'Number must be at least 0.5.';
      return;
    }

    if ((numVal * 2) % 1 !== 0) {
      errorMsg.textContent = 'Number must be in 0.5 increments.';
      return;
    }

    this.wagerNumberValue = numVal;
    this.numberModal.remove();
    this.numberModal = null;
    this.loadUnits();
  });

  this.numberModal.appendChild(modalContent);
  document.body.appendChild(this.numberModal);

  input.focus();
}
