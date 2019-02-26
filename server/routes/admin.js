const express = require('express');

const csv = require('csv-parser');
const batch = require('stream-batch');
const mapstream = require('map-stream');
const config = require('../../config');
const {createGunzip} = require('gunzip-stream');

const router = express.Router();

const spotprices = require('../model/spotprices');

router.post('/new_data', (req, res) => {
  if (req.query['secret'] != config.admin_secret) {
    res.end('incorrect secret ?secret=');
  }

  console.log("received /new_data request");

  // client is expected to post the csv to the endpoint, we will then process it
  let rowCount = 0;
  let batchCount = 0;
  if (req.query["gunzip"]) {
    req = req.pipe(createGunzip);
  }

  req.pipe(csv({
      separator: '\t',
      headers: [
        'label',
        'az',
        'insttype',
        'os',
        'price',
        'timestamp',
      ]
    }))
    .pipe(batch({
      maxItems: 16000
    }))
    .pipe(mapstream((data, callback) => {
      console.log(`inserting ${data.length} rows`);
      spotprices.insertData(data)
        .then(callback.bind(null, null, data))
        .catch((e) => {
          res.end(JSON.stringify({
            error: '' + e 
          }))
        });
    }))
    .on('data', (rowBatch) => {
      batchCount++;
      rowCount += rowBatch.length;
    })
    .on('end', () => {
      res.end(JSON.stringify({
        batchCount: batchCount,
        rowsReceived: rowCount
      }))
    })
});

module.exports = router;