import "./style.css";
import { App } from "./App.js";

// Wait for DOM to be ready
window.addEventListener("DOMContentLoaded", async () => {
  console.clear();
  console.log("🚀 Initializing KBLLR Graphics Portfolio...");

  try {
    // Get canvas element
    const canvas = document.querySelector("canvas.webgl");
    if (!canvas) {
      throw new Error("Canvas element not found");
    }

    // Create and initialize app
    const app = new App(canvas);
    await app.init();

    // Start rendering
    app.start();

    // Expose app to window for debugging (optional)
    if (import.meta.env.DEV) {
      window.app = app;
      console.log("✅ App initialized successfully");
      console.log("🔧 Debug: window.app available");
    }
  } catch (error) {
    console.error("❌ Failed to initialize app:", error);

    // Show error message to user
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.1);
      border: 2px solid #ff0000;
      color: #ff0000;
      padding: 20px;
      border-radius: 10px;
      font-family: monospace;
      z-index: 9999;
    `;
    errorDiv.innerHTML = `
      <h3>Failed to Initialize</h3>
      <p>${error.message}</p>
      <p>Check console for details</p>
    `;
    document.body.appendChild(errorDiv);
  }
});

// Handle page unload
window.addEventListener("beforeunload", () => {
  if (window.app) {
    window.app.dispose();
  }
});
