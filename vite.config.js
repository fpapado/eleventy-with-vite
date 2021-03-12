import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [legacy],
  build: {
    // This is important: Generate directly to _site and then assetsDir.
    // You could opt to build in an intermediate directory,
    // and have Eleventy copy the flies instead.
    outDir: "_site",
    // This is the default assetsDir. If you are using assets
    // for anything else, consider renaming assetsDir.
    // This can help you set cache headers for hashed output more easily.
    // assetsDir: "assets",
    // Sourcemaps are nice, but not critical for this to work
    sourcemap: true,
    // This is critical: generate manifest.json in outDir
    manifest: true,
    rollupOptions: {
      // This is critical: overwrite default .html entry
      input: "/src/client/main.js",
    },
  },
});
