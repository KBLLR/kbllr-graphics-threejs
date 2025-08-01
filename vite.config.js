import { defineConfig } from "vite";
import path from "path";

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
        treeshake: false,
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules/three")) {
              return "three";
            }
            if (id.includes("node_modules/gsap")) {
              return "gsap";
            }
            if (id.includes("node_modules/@theatre")) {
              return "theatre";
            }
            if (id.includes("node_modules/")) {
              return "vendor";
            }
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
      include: [
        "three",
        "gsap",
        "tweakpane",
        "@theatre/core",
        "@theatre/studio",
      ],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@core": path.resolve(__dirname, "./src/core"),
        "@debug": path.resolve(__dirname, "./src/debug"),
        "@materials": path.resolve(__dirname, "./src/materials"),
        "@sketches": path.resolve(__dirname, "./src/sketches"),
        "@systems": path.resolve(__dirname, "./src/systems"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@theatre": path.resolve(__dirname, "./node_modules/@theatre"),
      },
    },
  };
});
