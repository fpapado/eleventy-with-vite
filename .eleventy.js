const fs = require("fs");
const path = require("path");
const markdownIt = require("markdown-it");



const staticConfig = {

  jsBundleEntryDir: "src/client/",
  jsBundleEntryFiles: [ "main.js" ],
  jsBundleDevserver: null, // will be set on runtime
  isProduction: (process.env.NODE_ENV == 'production'),

  pathPrefix: "/", // This will change both Eleventy's pathPrefix, and the one output by the
  // vite-related shortcodes below. Double-check if you change this, as this is only a demo :)



  templateFormats: ["md", "njk", "html"],

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



module.exports = function (eleventyConfig) {

  if (!eleventyConfig) return staticConfig;



  staticConfig.jsBundleDevserver = process.env.NODE_BUNDLER_DEVSERVER;
  if (staticConfig.jsBundleDevserver) {
    console.log(`use bundler on ${staticConfig.jsBundleDevserver}`)
  }
  // config is also called by `eleventy --help` -> ignore missing bundler
  new JsBundle(staticConfig).addNunjucksShortcodes(eleventyConfig);



  // Disable whitespace-as-code-indicator, which breaks a lot of markup
  const configuredMdLibrary = markdownIt({ html: true }).disable("code");
  eleventyConfig.setLibrary("md", configuredMdLibrary);

  return staticConfig;
};



class JsBundle {

  constructor(staticConfig) {
    this.staticConfig = staticConfig;
    this.manifest = this.staticConfig.isProduction && JSON.parse(
      fs.readFileSync(this.staticConfig.dir.output + "/manifest.json"));
    // default entrypoint for the bundler. in practice you might have multiple entrypoints
    // then in the template, use
    // {% jsBundleHead "src/client/some-entrypoint.js" %}
    // {% jsBundleFoot "src/client/some-entrypoint.js" %}

    this.defaultFile = this.staticConfig.jsBundleEntryFiles[0];
  }

  chunk(file) {
    if (!file) throw new Error("file is empty");
    // file can be relative to project root, or relative to jsBundleEntryDir
    const chunk = this.manifest[file] || this.manifest[this.staticConfig.jsBundleEntryDir + file];
    if (chunk) return chunk;
    const possibleEntries = JSON.stringify(Object.values(this.manifest).filter(chunk => chunk.isEntry).map(chunk => chunk.src));
    throw new Error(`No entry for ${file} found in ${this.staticConfig.dir.output}/manifest.json. Valid entries in manifest: ${possibleEntries}`);
  }

  moduleScriptTag(file, attr) {
    if (!file) file = this.defaultFile;
    const chunk = this.chunk(file);
    return `<script ${attr} src="${this.staticConfig.pathPrefix}${chunk.file}"></script>`;
  }

  moduleTag(file) { return this.moduleScriptTag(file, 'type="module"'); }

  scriptTag(file) { return this.moduleScriptTag(file, 'nomodule'); }

  styleTag(file) {
    if (!file) file = this.defaultFile;
    const chunk = this.chunk(file);
    if (!chunk.css || chunk.css.length === 0) {
      console.warn(`No css found for ${file} entry. Is that correct?`);
      return "";
    }
    /* There can be multiple CSS files per entry, so assume many by default */
    return chunk.css.map(cssFile => `<link rel="stylesheet" href="${this.staticConfig.pathPrefix}${cssFile}"></link>`).join("\n");
  }

  preloadTag(file = "src/client/main.js") {
    console.log(`JsBundle.preloadTag: file = ${file}`)
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

  headTags(file) {
    if (!file) file = this.defaultFile;
    if (this.staticConfig.isProduction) {
      return [
        this.styleTag(file),
        this.preloadTag(file)
      ].join('\n');
    } else return `<!-- JsBundle.headTags: no head includes in dev mode -->`;
  }

  footTags(file) {
    if (!file) file = this.defaultFile;
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
        `<!-- JsBundle.footTags: file = ${file} -->`,
        `<script type="module" src="${this.staticConfig.jsBundleDevserver}/@vite/client"></script>`,
        `<script type="module" src="${this.staticConfig.jsBundleDevserver}/${file}"></script>`,
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
