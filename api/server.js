// api/server.js
const app = require("../server.js");

// Vercel serverless handler
module.exports = (req, res) => {
  app(req, res);
};
