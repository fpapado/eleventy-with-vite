# Eleventy with Vite

This is a template (or demo) for integrating [Vite](https://vitejs.dev) with Eleventy. This allows you to use Vite for its very fast bundling of JS and assets for client-side scripts, while building the static pages (and anything related) with Eleventy.

This main branch uses plain JS, as well as the Vite plugin for legacy scripts. To check out other possibilities (react, react with typescript), check out the branches of this repository.

## Pre-requisites

You will need [Node](https://nodejs.org/en/download/) and npm installed. npm typically comes installed with node. I recommend [using a version manager, such as nvm, to manage your node installation](https://github.com/nvm-sh/nvm)

## How to build

In a terminal, such as iTerm on MacOS, gnome terminal on Linux, or Windows Subsystem for Linux (WSL) on Windows, type:

If you have nvm installed, make sure the node versions match up

```shell
nvm use
```

```shell
# Install dependencies
npm ci
```

If the above command fails, try

```shell
npm install
```

Once the command completes, you are ready to build or develop!

To develop:

```shell
npm run dev
```

This will start the Eleventy development server at http://localhost:8080.

To build:

```shell
npm run build
```

This will build and output the final site under the `_site` directory. You can inspect the contents from there!

## How it works

The basic steps (summarised):
- By default, Vite is in control of the HTML. By integrating it into Eleventy, that responsibility is now on our Eleventy pipeline
- Eleventy and Vite run separately
- The Eleventy base template (or templates) must scaffold the HTML such that the correct scripts and styles are loaded
- Vite is responsible for serving the scripts dynamically (in development), or building statically and outputing a manifest of assets (in production)
- Eleventy ignores (via `.eleventyignore`) scripts in `src/client`, because Vite is in charge of those, including reloading

Development:
- Eleventy and Vite run in parallel
- Eleventy points to the address that Vite runs at (localhost:3000, by default), and then to the main script entry point, as well as the Vite development client
- When the browser makes the request for the script, Vite knows what to, injecting scripts via the client

Production:
- The core idea is that Vite no longer runs a development server, so we must get the information about the scripts and assets up-front
- Eleventy and Vite run in sequence (Vite first)
- Vite takes the entry point (`src/client/main.js`, specified in `vite.config.js`), and builds the app from there. It outputs it under `_site/assets`, as specified in `vite.config.js`
- Vite outputs a manifest (a JSON file mapping scripts to their output, and auxiliary information) to `_site/manifest.json`
- Eleventy runs
- As Eleventy processes each page with the base template, a custom Eleventy shortcode (`viteScriptTag`) reads `_site/manifest.json`, finds the entry point specified, and injects its output script as script[type="module"]
- Once done, things should work!

You can test this out shortly with `npm run prod`, to simulate a production-parity build and run.

## Styles and CSS pre-processing

I have left these out from this example. It should be possible to inject those with the information from Vite's `manifest.json`, but I haven't gotten to it yet.

## More things to do

If you are using plugins that modify the HTML, you must do the wiring yourself. This can range from slightly manual and annoying, to incredibly annoying :)

For example, [the Vite docs describe how to set up the React Refresh plugin in this context](https://vitejs.dev/guide/backend-integration.html#backend-integration).

Another example is the [plugin-legacy](https://vitejs.dev/plugins/#vitejs-plugin-legacy) which builds and outputs scripts compatible with browsers that do not suppport `script[type="module"]`. It also outputs inline scripts to detect a buggy version of Safari, which did not respect the `nomodule` attribute on scripts. This template integrates the basics of plugin-legacy.

Vite's plugin API allows plugins to express HTML transforms as tags to be added to the head of the document (or elsewhere). If that were exposed in a manifest, it would be possible to integrate it!

## Alternative designs

The design taken here is not perfect. It requires manual templating of the scripts, and requires potentially significant work to integrate HTML transformations beyond that. Many plugins like having the ability to output HTML, and currently the plugin API does not expose that information.

### SSR API

Vite has a Server-Side Rendering API, aiming to provide SSR support for React, Vue and so on. However, it is also possible to use that API just to do the HTML transformations.

In that case, a sketch pipeline would look like this:
- Do the setup for Vite SSR
- Run Eleventy to generate HTML files
- After an HTML file is built, use an [Eleventy transform](https://www.11ty.dev/docs/config/#transforms) to pass it to the `transformIndexHtml` function that Vite exposes
- Serve / leave in output directory

The upside of this approach is that you can use something closer to the "regular" Vite HTML entry, without having to worry about creating the script tags yourself. While adding script tags is not a huge hassle, the realy upside is when you have plugins that transform HTML. In those cases, you would need to duplicate a lot of their logic, to inject things into HTML correctly. Being able to leverage a single pipeline is appealing, and as I'm typing this I'm becoming more convinced of it :)

The downside is that I'm not sure how watching works (refer to the next section's Programmatic API considerations). Would changing a page cause Vite to refresh? Would changing scripts cause Eleventy to refresh? Neither? What are the false positives or negatives, if any?

**Update**: I tried this approach, and it did not seem to work. It is OK in development (though you have to do the work to keep only one Vite dev server running), but it doesn't work in production. The Vite dev server's `transformIndexHtml` does not apply the production transforms. I guess that makes, sense, it is a dev server after all :D In other words, for production in SSR, Vite wants you to build the template HTML once at the start, and then template into that. If we were using an index.html entry as the base for Eleventy, that would work, but we want to use Nunjucks.

### Programmatic API

[Vite has a programmatic JavaScript API](https://vitejs.dev/guide/api-javascript.html). In principle, you could use that API to run it inside of your Eleventy script. I am not a big fan of that approach. Both Eleventy and Vite are designed as long-running processes in development mode. These processes like being in charge of watching, and running them separately allows for the fast refresh cycles. Your mileage may vary!

## References

 - [Vite docs on Backend Integration](https://vitejs.dev/guide/backend-integration.html)
