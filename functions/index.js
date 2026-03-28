const { onRequest } = require("firebase-functions/v2/https");
const { default: next } = require("next");
const path = require("path");

const nextApp = next({
  dev: false,
  dir: path.resolve(__dirname, ".."),
  conf: {
    distDir: ".next",
  },
});

const handle = nextApp.getRequestHandler();

exports.nextjsServer = onRequest(
  { memory: "1GiB", timeoutSeconds: 300, maxInstances: 10 },
  (req, res) => {
    return nextApp.prepare().then(() => handle(req, res));
  }
);
