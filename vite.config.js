import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  // Use environment variable if available, otherwise check if we're building for GitHub Pages
  const base =
    process.env.BASE_URL ||
    (mode === "production" ? "/kbllr-graphics-threejs/" : "/");

  return {
    base,
    publicDir: "public",
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            three: ["three"],
            gsap: ["gsap"],
          },
        },
      },
    },
    server: {
      port: 3000,
      open: true,
      host: true,
    },
    optimizeDeps: {
      include: ["three", "gsap", "tweakpane"],
    },
  };
});
