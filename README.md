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

## Alternative designs

[Vite has a programmatic JavaScript API](https://vitejs.dev/guide/api-javascript.html). In principle, you could use that API to run it inside of your Eleventy script. I am not a big fan of that approach. Both Eleventy and Vite are designed as long-running processes in development mode. These processes like being in charge of watching, and running them separately allows for the fast refresh cycles. Your mileage may vary!

## More things to do

If you are using plugins that output to the HTML, you must do the wiring yourself.

For example, [the Vite docs describe how to set up the React Refresh plugin in this context](vite-react-refresh).

Another example is the [plugin-legacy]() which builds and outputs scripts compatible with browsers that do not suppport `script[type="module"]`.

### Styles and CSS pre-processing

I have left these out from this example. It should be possible to inject those with the information from Vite's `manifest.json`, but I haven't gotten to it yet.

## References

 - [Vite docs on Backend Integration](https://vitejs.dev/guide/backend-integration.html)
