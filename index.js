window.onload = function() {
  const btn = document.getElementById('generateImageBtn');
  const imgContainer = document.getElementById('generatedImageContainer');

  btn.addEventListener('click', () => {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) {
      alert('Stats container not found!');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Generating...';

    html2canvas(statsContainer).then(canvas => {
      const imgDataUrl = canvas.toDataURL('image/png');

      // Clear previous image if any
      imgContainer.innerHTML = '';

      // Create image element
      const img = document.createElement('img');
      img.src = imgDataUrl;
      img.alt = 'Generated Stats Image';

      // Append image and instructions
      imgContainer.appendChild(img);

      const instructions = document.createElement('div');
      instructions.id = 'instructions';
      instructions.textContent = 'Long press the image above and select "Copy" to paste inline in Patreon.';
      imgContainer.appendChild(instructions);

      imgContainer.style.display = 'block';

      btn.textContent = 'Generate Image to Copy';
      btn.disabled = false;
    }).catch(err => {
      console.error('Error generating image:', err);
      alert('Failed to generate image.');
      btn.textContent = 'Generate Image to Copy';
      btn.disabled = false;
    });
  });
};
