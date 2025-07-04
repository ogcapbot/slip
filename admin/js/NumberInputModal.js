// NumberInputModal.js

export class NumberInputModal {
  constructor(parentContainer = document.body) {
    this.parent = parentContainer;

    // Create modal overlay
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      visibility: 'hidden',
    });

    // Create modal box
    this.modalBox = document.createElement('div');
    Object.assign(this.modalBox.style, {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '320px',
      boxSizing: 'border-box',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      textAlign: 'center',
      fontFamily: "'Oswald', sans-serif",
    });

    // Instruction text
    this.instruction = document.createElement('p');
    this.instruction.textContent = 'Please enter the required number (multiples of 0.5)';
    this.instruction.style.marginBottom = '12px';
    this.modalBox.appendChild(this.instruction);

    // Number input
    this.input = document.createElement('input');
    this.input.type = 'number';
    this.input.step = '0.5';
    this.input.min = '0.5';
    this.input.placeholder = 'e.g., 1, 1.5, 2, 2.5';
    Object.assign(this.input.style, {
      width: '100%',
      fontSize: '1.2em',
      padding: '8px',
      boxSizing: 'border-box',
      marginBottom: '12px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      textAlign: 'center',
    });
    this.modalBox.appendChild(this.input);

    // Error message
    this.errorMsg = document.createElement('div');
    this.errorMsg.style.color = 'red';
    this.errorMsg.style.minHeight = '18px';
    this.errorMsg.style.marginBottom = '12px';
    this.modalBox.appendChild(this.errorMsg);

    // Submit button
    this.submitBtn = document.createElement('button');
    this.submitBtn.textContent = 'Submit';
    this.submitBtn.classList.add('admin-button');
    this.submitBtn.style.width = '100%';
    this.submitBtn.style.padding = '10px';
    this.submitBtn.style.fontSize = '1.1em';
    this.modalBox.appendChild(this.submitBtn);

    this.overlay.appendChild(this.modalBox);
    this.parent.appendChild(this.overlay);

    this.submitBtn.addEventListener('click', () => this.validateAndSubmit());

    // Bindings for promise resolve/reject
    this._resolve = null;
    this._reject = null;
  }

  show() {
    this.errorMsg.textContent = '';
    this.input.value = '';
    this.overlay.style.visibility = 'visible';
    this.input.focus();

    // Return a promise that resolves with the valid number input
    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  hide() {
    this.overlay.style.visibility = 'hidden';
  }

  validateAndSubmit() {
    const val = this.input.value.trim();
    if (!val) {
      this.errorMsg.textContent = 'Input cannot be empty.';
      return;
    }
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      this.errorMsg.textContent = 'Please enter a positive number.';
      return;
    }
    // Check if multiple of 0.5: (num * 2) should be integer
    if (!Number.isInteger(num * 2)) {
      this.errorMsg.textContent = 'Number must be in increments of 0.5.';
      return;
    }

    // Valid input: resolve promise and hide modal
    this.errorMsg.textContent = '';
    this.hide();
    if (this._resolve) this._resolve(num);
  }
}
