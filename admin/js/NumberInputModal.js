showNumberInputModal(wagerLabel) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.id = 'numberModal';
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

    const content = document.createElement('div');
    content.style.backgroundColor = '#fff';
    content.style.padding = '20px 15px';
    content.style.borderRadius = '10px';
    content.style.boxShadow = '0 2px 15px rgba(0,0,0,0.25)';
    content.style.textAlign = 'center';
    content.style.width = '280px';
    content.style.maxWidth = '90vw';
    content.style.boxSizing = 'border-box';

    // Prevent vertical stretching inside flex container:
    content.style.alignSelf = 'center';  // center vertically explicitly
    content.style.flexShrink = '0';      // don’t shrink/stretch vertically

    // Title
    const title = document.createElement('h3');
    title.textContent = `Enter Number for: ${wagerLabel}`;
    title.style.marginBottom = '15px';
    title.style.fontFamily = "'Oswald', sans-serif";
    title.style.fontWeight = '700';
    title.style.fontSize = '1.25rem';
    title.style.wordBreak = 'break-word';
    content.appendChild(title);

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '0.5';
    input.placeholder = 'e.g. 1, 1.5, 2';
    input.style.fontSize = '1rem';
    input.style.padding = '6px 8px';
    input.style.marginBottom = '18px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '6px';
    input.style.fontFamily = "'Oswald', sans-serif";
    content.appendChild(input);

    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.style.backgroundColor = '#3a8bfd';
    submitBtn.style.color = 'white';
    submitBtn.style.border = 'none';
    submitBtn.style.padding = '10px 22px';
    submitBtn.style.borderRadius = '7px';
    submitBtn.style.cursor = 'pointer';
    submitBtn.style.fontFamily = "'Oswald', sans-serif";
    submitBtn.style.fontWeight = '700';
    submitBtn.style.fontSize = '1rem';
    content.appendChild(submitBtn);

    modal.appendChild(content);
    document.body.appendChild(modal);

    input.focus();

    function isValidNumber(value) {
      const num = parseFloat(value);
      return (
        !isNaN(num) &&
        num >= 0 &&
        Number.isInteger(num * 2)
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
