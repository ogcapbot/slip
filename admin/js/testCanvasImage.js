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

// Example usage:
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

generateImageWithWatermarkAndText(watermarkUrl, exampleLines)
  .then(pngDataUrl => {
    const imgPreview = document.createElement('img');
    imgPreview.src = pngDataUrl;
    imgPreview.style.border = '1px solid #ccc';
    imgPreview.style.marginTop = '12px';
    imgPreview.style.maxWidth = '100%';

    document.body.appendChild(imgPreview);
  })
  .catch(console.error);
