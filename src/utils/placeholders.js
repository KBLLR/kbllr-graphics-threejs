const placeholderCache = new Map();

const categoryColors = {
  animation: "#4a9eff",
  shaders: "#ff4a4a",
  particles: "#4aff4a",
  geometry: "#ff4aff",
  lighting: "#ffff4a",
  interaction: "#4affff",
  default: "#aaaaaa",
};

/**
 * Generates a data URL for a placeholder image with a specific category's color and text.
 * Caches the generated URL to avoid recreating the canvas for the same category.
 * @param {string} [category="default"] - The category to generate a placeholder for.
 * @returns {string} The data URL of the placeholder image.
 */
export function getPlaceholderUrl(category = "default") {
  if (placeholderCache.has(category)) {
    return placeholderCache.get(category);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");

  // Draw background
  const color = categoryColors[category] || categoryColors.default;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 300, 200);

  // Draw text
  ctx.fillStyle = "white";
  ctx.font = "bold 24px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(category.toUpperCase(), 150, 100);

  // Convert to data URL and cache it
  const dataUrl = canvas.toDataURL("image/jpeg");
  placeholderCache.set(category, dataUrl);

  return dataUrl;
}