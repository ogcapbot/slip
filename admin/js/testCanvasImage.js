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

      canvas.width = watermarkImg.width;
      canvas.height = watermarkImg.height;

      ctx.drawImage(watermarkImg, 0, 0);

      ctx.fillStyle = '#000';
      ctx.font = '18px Oswald, sans-serif';
      ctx.textBaseline = 'top';

      textLines.forEach((line, i) => {
        ctx.fillText(line, padding, padding + i * lineHeight);
      });

      resolve(canvas);
    };

    watermarkImg.onerror = () => {
      reject(new Error('Failed to load watermark image'));
    };
  });
}

function openImageModal(canvas) {
  // Remove existing modal if present
  const existingModal = document.getElementById('imageModal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'imageModal';
  Object.assign(modal.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '100000',
    padding: '20px',
    boxSizing: 'border-box',
  });

  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.style.maxWidth = '90vw';
  img.style.maxHeight = '70vh';
  img.style.border = '2px solid white';
  img.style.marginBottom = '20px';
  modal.appendChild(img);

  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.gap = '15px';

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy Image';
  copyBtn.style.padding = '10px 20px';

  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download Image';
  downloadBtn.style.padding = '10px 20px';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.padding = '10px 20px';

  btnContainer.appendChild(copyBtn);
  btnContainer.appendChild(downloadBtn);
  btnContainer.appendChild(closeBtn);
  modal.appendChild(btnContainer);

  document.body.appendChild(modal);

  copyBtn.onclick = async () => {
    try {
      // Convert canvas to blob and write to clipboard
      canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        alert('Image copied to clipboard!');
      });
    } catch (err) {
      alert('Failed to copy image: ' + err.message);
    }
  };

  downloadBtn.onclick = () => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'official-stats.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  closeBtn.onclick = () => {
    modal.remove();
  };
}

async function testImageModal() {
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

  try {
    const canvas = await generateImageWithWatermarkAndText(watermarkUrl, exampleLines);
    openImageModal(canvas);
  } catch (err) {
    alert('Error generating image: ' + err.message);
  }
}

// Run test
testImageModal();
