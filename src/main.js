import "./style.css";
import "./gallery.js";

// Main entry point for the Three.js Sketch Gallery
console.log("Three.js Sketch Gallery - Loading...");

// Handle any global errors
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// Log when everything is loaded
window.addEventListener("load", () => {
  console.log("Three.js Sketch Gallery - Ready");
});

// Enable debug mode if URL contains ?debug=true
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("debug") === "true") {
  window.DEBUG = true;
  console.log("Debug mode enabled");
}
