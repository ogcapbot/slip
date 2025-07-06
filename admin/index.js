document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('generateImageBtn');
  btn.addEventListener('click', () => {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) {
      alert('Stats container not found!');
      return;
    }

    // Trigger html2canvas directly inside the click event for user gesture compliance
    html2canvas(statsContainer).then(canvas => {
      const imgDataUrl = canvas.toDataURL('image/png');

      // Open new tab right away (important to avoid pop-up blockers)
      const newTab = window.open();
      if (!newTab) {
        alert('Pop-up blocked. Please allow pop-ups for this site.');
        return;
      }

      // Write the HTML for the new tab AFTER it opens
      newTab.document.write(`
        <html>
          <head><title>Stats Image</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#222;">
            <img src="${imgDataUrl}" style="max-width:100%;height:auto;" alt="Stats Image" />
            <p style="color:#eee;text-align:center;margin-top:10px;">Long press the image to Save or Copy it</p>
          </body>
        </html>
      `);
      newTab.document.close();
    }).catch(err => {
      console.error('Failed to generate image:', err);
      alert('Failed to generate image.');
    });
  });
});
