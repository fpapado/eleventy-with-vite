const fs = require("fs");
const path = require("path");
const markdownIt = require("markdown-it");

const staticConfig = {

  isProduction: (process.env.NODE_ENV == 'production'),

  jsBundleDevServer: 'http://localhost:3000', // TODO get from vite

  templateFormats: ["md", "njk", "html"],

  pathPrefix: "/", // This will change both Eleventy's pathPrefix, and the one output by the
  // vite-related shortcodes below. Double-check if you change this, as this is only a demo :)

  markdownTemplateEngine: "njk",
  htmlTemplateEngine: "njk",
  dataTemplateEngine: "njk",
  passthroughFileCopy: true,
  dir: {
    input: "src",
    output: "_site",
    // NOTE: These two paths are relative to dir.input
    // @see https://github.com/11ty/eleventy/issues/232
    includes: "_includes",
    data: "_data",
  },
};

class JsBundle {

  staticConfig = {}
  manifest = false
  constructor(staticConfig) {
    this.staticConfig = staticConfig;
    // TODO wait until vite has generated the manifest.json
    this.manifest = this.staticConfig.isProduction && JSON.parse(
      fs.readFileSync(this.staticConfig.dir.output + "/manifest.json"));
    //this.defaultFile = "src/client/main.js"; // TODO
  }

  chunk(file) {
    // We want an file, because in practice you might have multiple entrypoints
    // This is similar to how you specify an entry in development mode
    if (!file) throw new Error("file is empty");
    const chunk = this.manifest[file];
    if (chunk) return chunk;
    const possibleEntries = JSON.stringify(Object.values(this.manifest).filter(chunk => chunk.isEntry).map(chunk => chunk.src));
    throw new Error(`No entry for ${file} found in ${this.staticConfig.dir.output}/manifest.json. Valid entries in manifest: ${possibleEntries}`);
  }

  moduleScriptTag(file, attr) {
    const chunk = this.chunk(file);
    return `<script ${attr} src="${this.staticConfig.pathPrefix}${chunk.file}"></script>`;
  }

  moduleTag(file = "src/client/main.js") { return this.moduleScriptTag(file, 'type="module"'); }

  scriptTag(file = "src/client/main.js") { return this.moduleScriptTag(file, 'nomodule'); }

  styleTag(file = "src/client/main.js") {
    const chunk = this.chunk(file);
    if (!chunk.css || chunk.css.length === 0) {
      console.warn(`No css found for ${file} entry. Is that correct?`);
      return "";
    }
    /* There can be multiple CSS files per entry, so assume many by default */
    return chunk.css.map(cssFile => `<link rel="stylesheet" href="${this.staticConfig.pathPrefix}${cssFile}"></link>`).join("\n");
  }

  preloadTag(file = "src/client/main.js") {
    /* Generate link[rel=modulepreload] tags for a script's imports */
    /* TODO(fpapado): Consider link[rel=prefetch] for dynamic imports, or some other signifier */
    const chunk = this.chunk(file);
    if (!chunk.imports || chunk.imports.length === 0) {
      console.log(`The script for ${file} has no imports. Nothing to preload.`);
      return "";
    }
    /* There can be multiple import files per entry, so assume many by default */
    /* Each entry in .imports is a filename referring to a chunk in the manifest; we must resolve it to get the output path on disk.
    */
    return (chunk.imports.map((importfile) => {
      const chunk = this.chunk(importfile);
      return `<link rel="modulepreload" href="${this.staticConfig.pathPrefix}${chunk.file}"></link>`;
    })).join("\n");
  }

  headTags(file = "src/client/main.js") {
    if (this.staticConfig.isProduction) {
      return [
        this.styleTag(file),
        this.preloadTag(file)
      ].join('\n');
    } else return '';
  }

  footTags(file = "src/client/main.js") {
    // We must split development  and production scripts
    // In development, vite runs a server to resolve and reload scripts
    // In production, the scripts are statically replaced at build-time 
    //
    // The build.env variable is assigned in src/_data/build.js
    // @see https://vitejs.dev/guide/backend-integration.html#backend-integration
    // @see https://www.11ty.dev/docs/data-js/#example-exposing-environment-variables
    if (this.staticConfig.isProduction) {
      return [
        this.moduleTag(file),
        this.scriptTag("vite/legacy-polyfills"),
        this.scriptTag(file.replace(/\.js$/, '-legacy.js'))
      ].join('\n');
    } else {
      return [
        `<script type="module" src="${this.staticConfig.jsBundleDevServer}/@vite/client"></script>`,
        `<script type="module" src="${this.staticConfig.jsBundleDevServer}/${file}"></script>`,
      ].join('\n');
    }
  }

  addNunjucksShortcodes(eleventyConfig, shortcode) {
    const shortcodeDefault = {
      //module: 'jsBundleModule', script: 'jsBundleScript',
      //style: 'jsBundleStyle', preload: 'jsBundlePreload',
      head: 'jsBundleHead', foot: 'jsBundleFoot',
    };
    shortcode = Object.assign({}, shortcodeDefault, shortcode || {});
    //eleventyConfig.addNunjucksShortcode(shortcode.module, (...a) => this.moduleTag(...a));
    //eleventyConfig.addNunjucksShortcode(shortcode.script, (...a) => this.scriptTag(...a));
    //eleventyConfig.addNunjucksShortcode(shortcode.style, (...a) => this.styleTag(...a));
    //eleventyConfig.addNunjucksShortcode(shortcode.preload, (...a) => this.preloadTag(...a));
    eleventyConfig.addNunjucksShortcode(shortcode.head, (...a) => this.headTags(...a));
    eleventyConfig.addNunjucksShortcode(shortcode.foot, (...a) => this.footTags(...a));
    return this; // chainable
  }
}

module.exports = function (eleventyConfig) {
  // Disable whitespace-as-code-indicator, which breaks a lot of markup
  const configuredMdLibrary = markdownIt({ html: true }).disable("code");
  eleventyConfig.setLibrary("md", configuredMdLibrary);

  new JsBundle(staticConfig).addNunjucksShortcodes(eleventyConfig);

  return staticConfig;
};
