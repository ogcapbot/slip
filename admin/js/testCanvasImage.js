async function generateImageWithWatermarkAndText(watermarkUrl, textLines) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const watermarkImg = new Image();
    watermarkImg.crossOrigin = 'anonymous';
    watermarkImg.src = watermarkUrl;

    watermarkImg.onload = () => {
      const padding = 20;
      const lineHeight = 24;
      const textStartY = watermarkImg.height + padding;

      const maxWidth = watermarkImg.width;
      const textHeight = lineHeight * textLines.length;
      canvas.width = maxWidth;
      canvas.height = watermarkImg.height + padding + textHeight + padding;

      ctx.drawImage(watermarkImg, 0, 0);

      ctx.fillStyle = '#222';
      ctx.font = '18px Oswald, sans-serif';
      ctx.textBaseline = 'top';

      textLines.forEach((line, i) => {
        ctx.fillText(line, padding, textStartY + i * lineHeight);
      });

      const pngDataUrl = canvas.toDataURL('image/png');
      resolve(pngDataUrl);
    };

    watermarkImg.onerror = () => {
      reject(new Error('Failed to load watermark image'));
    };
  });
}

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
