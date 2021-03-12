import "vite/dynamic-import-polyfill";

function init() {
  // A demo: add an element to the document, then announce it
  const alertNode = document.createElement("div");
  alertNode.setAttribute("role", "status");
  alertNode.setAttribute("aria-live", "polite");
  document.body.appendChild(alertNode);

  // Wait some arbitrary time, then populate it
  setTimeout(() => {
    const successNode = document.createElement("p");
    successNode.innerText = "Vite is serving the script correctly!";
    alertNode.appendChild(successNode);
  }, 400);
}

init();
