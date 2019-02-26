const express = require('express');
const rateLimit = require("express-rate-limit");
const router = express.Router();

const spotprices = require('../model/spotprices');

// rate limit requests to prevent attacks
router.use(rateLimit({
  windowMs: 60 * 1000, 
  max: 120 
}));

router.get('/prices_for_date', (req, res) => {
  (async () => {
    if (req.query['date'] == undefined) {
      res.end('expected ?date=<desired date> to be provided');
    }
    
    try {
      const date = new Date(req.query['date']);
      const prices = await spotprices.getPricesForDate(date);
      res.end(JSON.stringify({
        "date": date.toISOString(), 
        "prices": prices,
      }));
    } catch (e) {
      res.end(JSON.stringify({
        "error": e.toString(),
      }));
    }
  })();
});


router.get('/get_heatmap', (req, res) => {
  (async () => {
    if (req.query['start'] == undefined) {
      res.end('expected ?start=<desired date> to be provided');
    }

    if (req.query['stop'] == undefined) {
      res.end('expected ?stop=<desired date> to be provided');
    }
    
    try {
      const start = new Date(req.query['start']);
      const stop = new Date(req.query['stop']);
      const prices = await spotprices.getHeatMapForDates(start, stop);
      res.end(JSON.stringify({
        "start": start.toISOString(), 
        "stop": start.toISOString(), 
        "prices": prices,
      }));
    } catch (e) {
      res.end(JSON.stringify({
        "error": e.toString(),
      }));
    }
  })();
});

module.exports = router;