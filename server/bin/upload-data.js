const stream = require("stream");
const fs = require("fs");
const {createGunzip} = require('gunzip-stream');
const process = require("process");
const through2 = require('through2'); // https://www.npmjs.com/package/through2
const axios = require('axios')
const csv = require('csv-parser');
const queue = require('queue');

const config = require('../../config');

const filename = process.argv[2];

let readstream = fs.createReadStream(filename)

if (filename.endsWith(".gz")) {
  readstream = readstream.pipe(createGunzip());
}

let batch = [];

async function process_batch() {
  const request_payload = batch.map((row) => {
    row = Object.values(row).join("\t")
    return row;
  }).join("\n");

  try {
    console.log("Running job for file: " + filename);
    const res = await axios.post("http://127.0.0.1" + "/api/admin/new_data?secret=" + config.admin_secret, request_payload)
    console.log(res.data);
    console.log("Posted " + batch.length + " lines to api server\n");
  } catch (e) {
    console.log("ENCOUNTERED ERROR: " + e.toString());
  } finally {
    batch = [];
  }
}

readstream
  .pipe(csv({
    separator: '\t',
    headers: false,
  }))
  .pipe(through2.obj((chunk, enc, callback) => {
    if (batch.length < 10000) {
      batch.push(chunk);
      callback();
    } else {
      process_batch()
        .then(callback)
        .catch((err) => {
          console.log("encountered error: " + err);
          callback();
        });
    }
  }))
  .on('end', () => {
    process_batch()
      .then(() => {
        console.log("Done.");
      })
      .catch((err) => {
        console.log("encountered error: " + err);
        callback();
      });
  })

