async function generateImageWithWatermarkAndText(watermarkUrl, textLines) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const watermarkImg = new Image();
    watermarkImg.crossOrigin = 'anonymous';
    watermarkImg.src = watermarkUrl;

    watermarkImg.onload = () => {
      const padding = 20; // padding inside watermark for text
      const lineHeight = 24;

      // Use watermark's natural width/height exactly (no extra bottom padding)
      canvas.width = watermarkImg.width;
      canvas.height = watermarkImg.height;

      // Draw watermark image at top-left corner
      ctx.drawImage(watermarkImg, 0, 0);

      // Text style: solid black, no background fill
      ctx.fillStyle = '#000'; // black text, change if needed
      ctx.font = '18px Oswald, sans-serif';
      ctx.textBaseline = 'top';

      // Draw each line of text starting near top-left + padding
      textLines.forEach((line, i) => {
        ctx.fillText(line, padding, padding + i * lineHeight);
      });

      // Export PNG Data URL
      const pngDataUrl = canvas.toDataURL('image/png');
      resolve(pngDataUrl);
    };

    watermarkImg.onerror = () => {
      reject(new Error('Failed to load watermark image'));
    };
  });
}

// Example usage and UI:
const watermarkUrl = 'http://capper.ogcapperbets.com/admin/images/blankWatermark.png';

const exampleLines = [
  "═══════════════════════",
  "######## OFFICIAL STATS",
  "═══════════════════════",
  "Date: Friday, July 4, 2025",
  "∑ - Official Picks Total: 11",
  "✅ - Official Pick Winners: 5 - 45.5%",
  "❌ - Official Picks Lost: 3 - 27.3%",
  "🟦 - Official Picks Pushed: 1 - 9.1%",
  "⚙️ - Official Picks Pending : 2"
];

// Button to open image in new tab
const btnOpenImage = document.createElement('button');
btnOpenImage.textContent = 'Open Stats Image in New Tab';
btnOpenImage.style.padding = '12px 20px';
btnOpenImage.style.fontSize = '16px';
btnOpenImage.style.marginTop = '20px';
btnOpenImage.style.cursor = 'pointer';

btnOpenImage.addEventListener('click', async () => {
  try {
    const pngDataUrl = await generateImageWithWatermarkAndText(watermarkUrl, exampleLines);
    // Open image in new tab/window
    const imageWindow = window.open();
    if (imageWindow) {
      imageWindow.document.write(`<title>Stats Image</title><img src="${pngDataUrl}" style="max-width: 100%; height: auto;">`);
      imageWindow.document.close();
    } else {
      alert('Please allow popups for this site to open the image.');
    }
  } catch (err) {
    alert('Error generating image: ' + err.message);
  }
});

document.body.appendChild(btnOpenImage);
