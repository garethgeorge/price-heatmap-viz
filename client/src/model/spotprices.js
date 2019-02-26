const axios = require('axios');

const querystring = require('querystring');
const debug = require('debug')('model:spotprices');

async function getHeatMapData(startDate, stopDate) {
  debug("fetching data from the server! start date: %o, stop date: %o", startDate, stopDate);
  const heatmapResponse = await axios.get('/api/client/get_heatmap?' + querystring.stringify({
    start: startDate.toISOString(),
    stop: stopDate.toISOString(),
  }));
  
  if (heatmapResponse.data.error) {
    throw new Error(heatmapResponse.data.error);
  }

  const data = heatmapResponse.data.prices.filter((data) => {
    return data.os === "Linux/UNIX";
  })

  // create the arrays of zone_ids and insttypes
  const lookup = {};
  const zone_ids = []; // xLabels
  const insttypes = []; // yLabels
  for (const datapoint of data) {
    datapoint.key = datapoint.zone_id + "\0" + datapoint.insttype;
    lookup[datapoint.key] = datapoint;

    if (!zone_ids.includes(datapoint.zone_id)) { // linear time is plenty fast for the data size
      zone_ids.push(datapoint.zone_id);
    } 
    if (!insttypes.includes(datapoint.insttype)) {
      insttypes.push(datapoint.insttype);
    }
  }

  zone_ids.sort();
  insttypes.sort();

  // okay, great, now we need to build out a datastructure for that
  const heatmap = insttypes
    .map((insttype) => {
      return zone_ids.map((zone_id) => {
        const datapoint = lookup[zone_id + "\0" + insttype];

        if (!datapoint) {
          debug("%o %o -- no datapoint", zone_id, insttype);
          return null;
        } else {
          debug("%o %o -- delta: %o", datapoint.zone_id, datapoint.insttype, datapoint.delta);
        }
        return datapoint;
      });
    });
  
  // constructed a matrix of the data
  debug("constructed heatmap %o", heatmap);
  
  // constructs a heat map
  return {
    xLabels: zone_ids,
    yLabels: insttypes,
    heatmap: heatmap,
    lookup: lookup,
  }
}

export {getHeatMapData};

/*
  {
    "config_id": "1",
    "az": "us-west-2c",
    "insttype": "x1.32xlarge",
    "os": "Linux/UNIX",
    "price": 3.0986,
    "timestamp": "2017-07-15T04:17:46.000Z"
  }
*/