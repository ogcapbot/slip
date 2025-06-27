// Helper: create container with label and image, supports long tap to copy URL
function createImageContainer(labelText, slideNum) {
  const container = document.createElement("div");
  container.style.border = "1px solid #ccc";
  container.style.borderRadius = "6px";
  container.style.padding = "12px";
  container.style.marginBottom = "20px";
  container.style.maxWidth = "420px";
  container.style.position = "relative";

  const label = document.createElement("div");
  label.textContent = labelText;
  label.style.fontFamily = "'Oswald', sans-serif";
  label.style.fontWeight = "bold";
  label.style.color = "#666666";
  label.style.marginBottom = "10px";

  const imageUrl = `${BASE_URL}?json=${encodedPayload}&slideNum=${slideNum}`;

  const img = document.createElement("img");
  img.src = imageUrl;
  img.style.width = "100%";
  img.style.height = "auto";
  img.style.borderRadius = "4px";
  img.style.userSelect = "none"; // prevent accidental text selection

  // Store image URL as a property on the image element
  img.imageUrl = imageUrl;

  // Long press detection variables
  let pressTimer = null;

  // Helper function to copy URL to clipboard
  function copyImageUrl() {
    navigator.clipboard.writeText(img.imageUrl).then(() => {
      alert(`${labelText} URL copied to clipboard!`);
    }).catch(() => {
      alert(`Failed to copy ${labelText} URL.`);
    });
  }

  // Touch events for long press
  img.addEventListener("touchstart", (e) => {
    pressTimer = setTimeout(() => {
      copyImageUrl();
    }, 600); // 600ms long press threshold
  });

  img.addEventListener("touchend", (e) => {
    if (pressTimer) clearTimeout(pressTimer);
  });
  img.addEventListener("touchcancel", (e) => {
    if (pressTimer) clearTimeout(pressTimer);
  });

  // For desktop, allow right click or long click simulation by context menu or normal click
  img.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    copyImageUrl();
  });

  // Optional: also allow normal click for convenience on desktop
  img.addEventListener("click", () => {
    copyImageUrl();
  });

  container.appendChild(label);
  container.appendChild(img);

  return container;
}

container.appendChild(createImageContainer("Standard Version Image", 1));
container.appendChild(createImageContainer("Paid Version Image", 2));
