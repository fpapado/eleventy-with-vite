const fs = require("fs/promises");
const path = require("path");
const markdownIt = require("markdown-it");

const INPUT_DIR = "src";
const OUTPUT_DIR = "_site";
const isProduction = process.env.NODE_ENV === "production";

module.exports = function (eleventyConfig) {
  // Disable whitespace-as-code-indicator, which breaks a lot of markup
  const configuredMdLibrary = markdownIt({ html: true }).disable("code");
  eleventyConfig.setLibrary("md", configuredMdLibrary);

  // Read Vite's manifest.json, and add script tags for the entry files
  // You could decide to do more things here, such as adding preload/prefetch tags
  // for dynamic segments
  // NOTE: There is some hard-coding going on here, with regard to the assetDir
  // and location of manifest.json
  // you could probably read vite.config.js and get that information directly
  // @see https://vitejs.dev/guide/backend-integration.html
  eleventyConfig.addNunjucksAsyncShortcode(
    "viteScriptTag",
    async function (entryFilename) {
      // We want an entryFilename, because in practice you might have multiple entrypoints
      // This is similar to how you specify an entry in development more
      if (!entryFilename) {
        throw new Error(
          "You must specify an entryFilename, so that vite-script can find the correct file."
        );
      }
      const manifest = await fs.readFile(
        path.resolve(process.cwd(), "_site", "manifest.json")
      );
      const parsed = JSON.parse(manifest);

      let entryChunk = parsed[entryFilename];
      if (!entryChunk) {
        const possibleEntries = Object.values(parsed)
          .filter((chunk) => chunk.isEntry === true)
          .map((chunk) => `"${chunk.src}"`)
          .join(`, `);
        throw new Error(
          `No entry for ${entryFilename} found in _site/manifest.json. Valid entries in manifest: ${possibleEntries}`
        );
      }
      return `<script type="module" src="${entryChunk.file}"></script>`;
    }
  );

  return {
    templateFormats: ["md", "njk", "html"],
    pathPrefix: "/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    passthroughFileCopy: true,
    dir: {
      input: INPUT_DIR,
      output: OUTPUT_DIR,
      // NOTE: These two paths are relative to dir.input
      // @see https://github.com/11ty/eleventy/issues/232
      includes: "_includes",
      data: "_data",
    },
  };
};
