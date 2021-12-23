const findPort = require('find-free-port-sync');
const npmRun = require('npm-run')
const appRoot = require('app-root-path').path;
const open = require('open');
const spawn = require('cross-spawn');

const pkg = require(appRoot+'/package.json');

const eleventy = {};
eleventy.config = pkg.eleventy?.config || '.eleventy.js';
eleventy.host = 'localhost';
eleventy.port = findPort({ start: 8000 });
eleventy.devserver = `http://${eleventy.host}:${eleventy.port}`;
eleventy.open = true; // open browser
eleventy.staticConfig = require(appRoot+'/'+eleventy.config)();

const bundler = {};
bundler.host = 'localhost';
bundler.port = findPort({ start: 8000 });
bundler.devserver = `http://${bundler.host}:${bundler.port}`;
bundler.entryDir = eleventy.staticConfig.jsBundleEntryDir || '';
bundler.entryFiles = eleventy.staticConfig.jsBundleEntryFiles;

const envVars = [
  `NODE_ELEVENTY_DIR_OUTPUT=${eleventy.staticConfig.dir.output}`,
  `NODE_BUNDLER_DEVSERVER=${bundler.devserver}`,
  `NODE_BUNDLER_ENTRY_DIR=${bundler.entryDir}`,
  `NODE_BUNDLER_ENTRY_FILES=${bundler.entryFiles.join(',')}`,
];

const modeName = eleventy.staticConfig.isProduction ? 'build' : 'dev';
console.log(`[${modeName}] chdir ${appRoot}`);
process.chdir(appRoot);

// enable debug: npm run dev -- --debug
if (process.argv.includes('--debug')) envVars.push('DEBUG=*');

if (eleventy.staticConfig.isProduction) {
  // build
  envVars.push('NODE_ENV=production');
  //console.dir({ envVars });
  for (const buildScript of ['build:vite', 'build:eleventy']) {
    spawn.sync(
      'cross-env', [
      ...envVars,
      'npm-run-all',
      buildScript,
      ], {
      stdio: 'inherit', // show output
      detached: false,
      windowsHide: true,
    });
  }
}
else {
  // start devserver
  console.log(`[dev] start bundler on ${bundler.devserver}`);
  //console.dir({ envVars });
  const devProcess = spawn(
    'cross-env', [
    ...envVars,
    'concurrently',
    '--prefix-colors', 'cyan,magenta',
    '--names', 'vite,11ty',
    '--kill-others', 'true',
    `npm:dev:vite -- --host ${bundler.host} --port ${bundler.port} --strictPort`,
    `npm:dev:eleventy -- --port ${eleventy.port}`,
    ], {
    stdio: 'inherit', // show output
    detached: false,
    windowsHide: true,
  });
  
  if (eleventy.open) {
    setTimeout(() => {
      console.log(`[dev] open ${eleventy.devserver}`);
      open(eleventy.devserver);
    }, 4000);
  }
}
