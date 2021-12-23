const npmRun = require('npm-run')
const appRoot = require('app-root-path').path;
const spawn = require('cross-spawn');

// open browser: pnpm run serve -- --open
let port = null;
let doOpen = false;
if (process.argv.includes('--open')) {
  port = require('find-free-port-sync')({ start: 8000 });
  console.log(`[serve] use port ${port}`);
  doOpen = true;
}

const pkg = require(appRoot+'/package.json');

const eleventy = {};
eleventy.config = pkg.eleventy?.config || '.eleventy.js';
eleventy.staticConfig = require(appRoot+'/'+eleventy.config)();

const args = [
  eleventy.staticConfig.dir.output,
  '--no-clear', // dont clear terminal history
  //'--maxage', '0', // cache busting
];

if (doOpen) args.push('--port', ''+port);

spawn(
  'sirv', args, {
  stdio: 'inherit', // show output
  detached: false,
  windowsHide: true,
});

if (doOpen) {
  const url = `http://localhost:${port}`;
  console.log(`[serve] open ${url}`);
  require('open')(url);
}
