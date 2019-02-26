const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compression = require('compression');
const app = express();
const port = process.env.PORT || 5000;

const spotprices = require('../model/spotprices');
const config = require('../../config');
const backup = require('../model/backup');

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// enable response compression due to the large size of our JSON replies
app.use(compression({filter: shouldCompress}));
function shouldCompress (req, res) {
  if (req.headers['x-no-compression']) {
    return false
  }
  return compression.filter(req, res)
}


// serve up the static web site
app.use(express.static(path.join(__dirname, '../../client/build')));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
});

// handle the rest of the API
app.use((req, res, next) => {
  // ignore origin of the request: TODO: remove this when NGINX is used for hosting
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

app.use('/api/admin/', require('../routes/admin'));
app.use('/api/client/', require('../routes/client'));

app.use((req, res, next) => {
  res.end("404 Not Found\n");
});


console.log("setup timer to update the cache every 12 hours");
setInterval(() => {
  (async () => {
    console.log("UPDATING THE CACHE");
    await spotprices.updateCache();
  })();
}, 4 * 3600 * 1000);

(async () => {
  console.log("setup spotprices model");
  await spotprices.setup();
  
  app.listen(port, () => console.log(`Listening on port ${port}`));
})();

(async () => {

  while (true) {
    
    for (const conf of config.backup_databases) {
      console.log(`synchronizing with ${conf.host}:${conf.port} -U ${conf.user}`)
      backup.synchronize(config.pg, conf);
    }

    // wait 1 hour 
    await (new Promise((resolve, rejcet) => {
      setTimeout(() => {
        resolve();
      }, 3600 * 1000);
    }));
  }

})();