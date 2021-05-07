import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

// defined in .eleventy.js
const eleventyDirOutput = process.env.NODE_ELEVENTY_DIR_OUTPUT;
const bundlerEntryFiles = process.env.NODE_BUNDLER_ENTRY_FILES?.split(',');

if (!eleventyDirOutput) throw new Error('error: empty NODE_ELEVENTY_DIR_OUTPUT');
if (!bundlerEntryFiles || bundlerEntryFiles.length == 0) throw new Error('error: empty NODE_BUNDLER_ENTRY_FILES');

// https://vitejs.dev/config/
export default defineConfig({
  // This is not critical, but I include it because there are more HTML transforms via plugins, that templates must handle
  // TODO: For legacy() to work without a hitch, we set a known @babel/standalone version in package.json
  // Remove that once https://github.com/vitejs/vite/issues/2442 is fixed
  plugins: [legacy()],
  build: {
    // This is important: Generate directly to _site and then assetsDir.
    // You could opt to build in an intermediate directory,
    // and have Eleventy copy the flies instead.
    outDir: eleventyDirOutput,
    // This is the default assetsDir. If you are using assets
    // for anything else, consider renaming assetsDir.
    // This can help you set cache headers for hashed output more easily.
    // assetsDir: "assets",
    // Sourcemaps are nice, but not critical for this to work
    sourcemap: true,
    // This is critical: generate manifest.json in outDir
    manifest: true,
    rollupOptions: bundlerEntryFiles.map(entryFile => ({
      // This is critical: overwrite default .html entry
      input: entryFile,
    })),
  },
});
