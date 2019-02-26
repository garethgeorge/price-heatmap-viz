const process = require('process');
const config = require('../../config');
const spotprices = require('../model/spotprices');

(async () => {
  const results = await spotprices.updateCache();
  console.log("DONE.");

  process.exit(0);
})();
