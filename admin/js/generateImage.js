// generateImage.js

export async function generateSlidePreview(containerId, data, svgUrl) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found.`);
    return;
  }

  try {
    const response = await fetch(svgUrl);
    if (!response.ok) throw new Error('Failed to load SVG template');

    let svgText = await response.text();

    // Replace placeholders [[KEY]] with data values
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`\\[\\[${key}\\]\\]`, 'g');
      svgText = svgText.replace(regex, value || '');
    });

    container.innerHTML = svgText;

  } catch (error) {
    console.error('Error loading or rendering SVG:', error);
  }
}
