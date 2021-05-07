import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

// defined in .eleventy.js
const eleventyDirOutput = process.env.NODE_ELEVENTY_DIR_OUTPUT;
const bundlerEntryDir = process.env.NODE_BUNDLER_ENTRY_DIR || '';
const bundlerEntryFiles = process.env.NODE_BUNDLER_ENTRY_FILES?.split(',');

if (!eleventyDirOutput) throw new Error('error: empty NODE_ELEVENTY_DIR_OUTPUT');
if (!bundlerEntryFiles || bundlerEntryFiles.length == 0) throw new Error('error: empty NODE_BUNDLER_ENTRY_FILES');

// This is critical: overwrite default index.html entry
// https://vitejs.dev/guide/build.html#multi-page-app
const assetPath = path => path.replace(/\.[^./]+$/, '');
const rollupOptions = {
  input: Object.fromEntries(bundlerEntryFiles.map(entryFile => (
    [assetPath(entryFile), (bundlerEntryDir + entryFile)]
  ))),
};
// note on file locations:
//   dev server -> ${path}
//   prod build -> ${outDir}/assets/${key}.<hash>.js (see ${outDir}/manifest.json)
//   ${key} can be a path, for example 'lib/some-lib/main'
// debug
Object.entries(rollupOptions.input).forEach(([key, path]) => {
  console.log(`build.rollupOptions.input[${JSON.stringify(key)}]: ${path}`);
});
console.log(`build.outDir: ${eleventyDirOutput}`);

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
    
    // https://vitejs.dev/guide/build.html#multi-page-app
    rollupOptions,
  },
});
