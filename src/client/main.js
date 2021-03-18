import "vite/dynamic-import-polyfill";

function init() {
  // A demo: add an element to the document, then announce it
  const alertNode = document.createElement("div");
  const mainNode = document.querySelector("main");

  alertNode.setAttribute("role", "status");
  alertNode.setAttribute("aria-live", "polite");
  mainNode.appendChild(alertNode);

  // Wait some arbitrary time, then populate it
  setTimeout(() => {
    const successNode = document.createElement("p");
    // Let's verify that Vite is injecting environment variables
    // @see https://vitejs.dev/guide/env-and-mode.html#env-variables
    if (import.meta.env.DEV === true) {
      successNode.innerText = "Vite is serving the script correctly!";
    }
    if (import.meta.env.PROD === true) {
      successNode.innerText =
        "Vite has built the files statically and Eleventy injected the correct script tag!";
    }
    alertNode.appendChild(successNode);
  }, 400);
}

init();
