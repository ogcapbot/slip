showNumberInputModal(wagerLabel) {
  return new Promise((resolve) => {
    // Create modal background
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    // Modal content container
    const content = document.createElement('div');
    content.style.backgroundColor = '#fff';
    content.style.padding = '25px';
    content.style.borderRadius = '12px';
    content.style.boxShadow = '0 2px 15px rgba(0,0,0,0.3)';
    content.style.textAlign = 'center';
    content.style.width = '90%';
    content.style.maxWidth = '280px'; // Smaller max width for mobile

    // Title
    const title = document.createElement('h3');
    title.textContent = `Enter Number for: ${wagerLabel}`;
    title.style.marginBottom = '20px';
    title.style.fontFamily = "'Oswald', sans-serif";
    title.style.fontWeight = '700';
    title.style.fontSize = '1.3rem';
    content.appendChild(title);

    // Input field
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '0.5';
    input.placeholder = 'Enter whole or half number (e.g. 1, 1.5, 2)';
    input.style.width = '140px';       // Smaller width
    input.style.fontSize = '1.1rem';   // Smaller font size
    input.style.padding = '8px';       // Reduced padding
    input.style.marginBottom = '20px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '6px';
    input.style.fontFamily = "'Oswald', sans-serif";
    content.appendChild(input);

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.style.backgroundColor = '#3a8bfd';
    submitBtn.style.color = 'white';
    submitBtn.style.border = 'none';
    submitBtn.style.padding = '12px 25px';
    submitBtn.style.borderRadius = '8px';
    submitBtn.style.cursor = 'pointer';
    submitBtn.style.fontFamily = "'Oswald', sans-serif";
    submitBtn.style.fontWeight = '700';
    submitBtn.style.fontSize = '1.1rem';
    content.appendChild(submitBtn);

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Focus input on modal show
    input.focus();

    // Validation helper
    function isValidNumber(value) {
      const num = parseFloat(value);
      return (
        !isNaN(num) &&
        num >= 0 &&
        Number.isInteger(num * 2) // ensures whole or half increments (e.g., 0.5, 1, 1.5)
      );
    }

    submitBtn.addEventListener('click', () => {
      if (isValidNumber(input.value.trim())) {
        const numValue = parseFloat(input.value.trim());
        document.body.removeChild(modal);
        resolve(numValue);
      } else {
        alert('Please enter a valid positive whole or half number (e.g., 0.5, 1, 1.5)');
        input.focus();
      }
    });
  });
}
