
const config = require('../../config');

const pg = require('pg')
const format = require('pg-format');

const pool = new pg.Pool({
  host: config.pg.host,
  user: config.pg.user,
  database: config.pg.database,
  password: config.pg.password,
  port: config.pg.port,
  max: 16,
  ssl: false
});

const azname_to_zoneid = {};
for (const zoneid in config.zoneid_az_mapping) {
  azname_to_zoneid[config.zoneid_az_mapping[zoneid]] = zoneid;
}

module.exports = {
  setup: async (db=pool) => {
    const client = await db.connect();
    
    try {
      console.log("created table configurations (if not exists)");
      await client.query(`
        CREATE TABLE IF NOT EXISTS configurations (
          id BIGSERIAL NOT NULL,
          az CHAR(30) NOT NULL,
          insttype CHAR(30) NOT NULL,
          os CHAR(30) NOT NULL,
          PRIMARY KEY (id),
          UNIQUE (az, insttype, os)
        )
      `)

      console.log("created table spotprices (if not exists)");
      await client.query(`
        CREATE TABLE IF NOT EXISTS spotprices (
          config_id BIGINT NOT NULL,
          price FLOAT(8) NOT NULL,
          timestamp BIGINT NOT NULL,
          PRIMARY KEY (config_id, timestamp),
          FOREIGN KEY (config_id) REFERENCES configurations(id) ON DELETE CASCADE
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS dailyprices (
          config_id BIGINT NOT NULL,
          timestamp BIGINT NOT NULL, 
          price FLOAT(8) NOT NULL,
          PRIMARY KEY (config_id, timestamp),
          FOREIGN KEY (config_id) REFERENCES configurations(id) ON DELETE CASCADE
        )
      `);

    } catch (e) {
      console.log("ERROR IN SETUP: " + e);
    }

    client.release();
  },

  updateCache: async () => {
    const client = await pool.connect();

    try {
      let result;
      result = await client.query(`
        SELECT *, 
          (SELECT MAX(spotprices.timestamp) FROM spotprices WHERE spotprices.config_id = configurations.id) AS maxts, 
          (SELECT MIN(spotprices.timestamp) FROM spotprices WHERE spotprices.config_id = configurations.id) AS mints,
          (SELECT MAX(dailyprices.timestamp) FROM dailyprices WHERE dailyprices.config_id = configurations.id) AS maxdayts,
          (SELECT MIN(dailyprices.timestamp) FROM dailyprices WHERE dailyprices.config_id = configurations.id) AS mindayts
        FROM configurations 
        WHERE configurations.os = 'Linux/UNIX'`
      );
      const configurations = result.rows;

      for (const config of configurations) {
        console.log(`updating ${config.az} : ${config.insttype}`);
        console.log(config);

        let startTs = config.mints;
        let stopTs = config.maxts;

        if (config.maxdayts && config.maxdayts > startTs) {
          // minus a few days for margin of error or what have you...
          // generally, should work just fine :)
          console.log("updated startTs to be maxdayts - 2 days, accelerating query");
          startTs = config.maxdayts - 2 * 24 * 3600 * 1000;
        }

        // TODO: check if the maxdayts and mindayts reflect the start and stop ts such that no update is necessary


        /*
              SELECT COUNT(off)
              FROM generate_series(0, 24 * 60 * 60 * 1000 / (15 * 60 * 1000)) AS offsets(off)
        */

        const query = format(`
          WITH
            days AS (
              SELECT days * (3600 * 24 * 1000) AS day 
              FROM generate_series(CAST(%L AS BIGINT), CAST(%L AS BIGINT)) AS days 
            ),
            offsets AS (
              SELECT off * (5 * 60 * 1000) AS off
              FROM generate_series(0, 24 * 60 * 60 * 1000 / (5 * 60 * 1000)) AS offsets(off)
            ),
            data AS (
              SELECT CAST(%L AS BIGINT) AS config_id, days.day, (
                SELECT AVG(spotprices.price) AS price
                FROM spotprices CROSS JOIN offsets 
                WHERE config_id = %L AND timestamp = (
                  SELECT MAX(timestamp)
                  FROM spotprices WHERE config_id = %L AND timestamp <= days.day + (offsets.off)::BIGINT
                ) 
              )
              FROM days
            )
          INSERT INTO dailyprices SELECT * FROM data WHERE price IS NOT NULL
          ON CONFLICT ON CONSTRAINT dailyprices_pkey DO UPDATE SET price = (
            SELECT price FROM data WHERE config_id = dailyprices.config_id AND data.day = dailyprices.timestamp
          );
        `, 
          Math.ceil(startTs / (3600 * 24 * 1000)), 
          Math.floor(stopTs / (3600 * 24 * 1000)), 
          config.id, 
          config.id, 
          config.id);
        console.log(query);
        await client.query(query);
      }
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  },

  getPricesForDate: async (date) => {
    console.log('getPricesForDate(' + date.toString() + ')');
    const client = await pool.connect()
    try {
      const results = await client.query(format(`
        SELECT configurations.id, configurations.az, configurations.insttype, configurations.os, spotprices.price, spotprices.timestamp 
        FROM configurations 
        JOIN spotprices ON spotprices.config_id = configurations.id 
        WHERE spotprices.timestamp = (SELECT MAX(timestamp) FROM spotprices WHERE spotprices.config_id = configurations.id AND timestamp <= %L)
      `, date.getTime()));
      return results.rows.map((row) => {
        return {
          "config_id": row.config_id,
          "az": row.az.trim(),
          "insttype": row.insttype.trim(),
          "os": row.os.trim(),
          "price": row.price,
          "timestamp": new Date(parseInt(row.timestamp)), // row.timestamp.toISOString();
        }
      });
    } finally {
      client.release();
    }
  },

  getHeatMapForDates: async (dateStart, dateStop) => {
    console.log('getHeatMapForDates(' + dateStart.toString() + ', ' + dateStop.toString() + ')');
    const client = await pool.connect()
    try {
      // const query = format(`
      //   SELECT configurations.id, configurations.az, configurations.insttype, configurations.os, start.price AS startprice, start.timestamp AS startts, stop.price AS stopprice, stop.timestamp AS stopts, stop.price - start.price AS delta
      //   FROM configurations 
      //   JOIN spotprices start ON start.config_id = configurations.id 
      //   JOIN spotprices stop ON stop.config_id = configurations.id 
      //   WHERE 
      //     start.timestamp = (SELECT MAX(timestamp) FROM spotprices WHERE spotprices.config_id = configurations.id AND timestamp <= %L) AND
      //     stop.timestamp = (SELECT MAX(timestamp) FROM spotprices WHERE spotprices.config_id = configurations.id AND timestamp <= %L)
      // `, dateStart.getTime(), dateStop.getTime());

      const query = format(`
        SELECT id, az, insttype, os, (
          SELECT AVG(price)
          FROM dailyprices 
          WHERE config_id = configurations.id AND timestamp > %L AND timestamp < %L
        ) AS startprice, (
          SELECT AVG(price)
          FROM dailyprices 
          WHERE config_id = configurations.id AND timestamp > %L AND timestamp < %L
        ) AS stopprice
        FROM configurations 
        WHERE configurations.os = 'Linux/UNIX'
      `, 
        dateStart.getTime(), 
        Math.floor((dateStart.getTime() + dateStop.getTime()) / 2.0),
        Math.floor((dateStart.getTime() + dateStop.getTime()) / 2.0),
        dateStop.getTime());
      
      const results = await client.query(query);
      const retval = results.rows.map((row) => {
        return {
          "config_id": row.id,
          "az": row.az.trim(),
          "zone_id": azname_to_zoneid[row.az.trim()],
          "insttype": row.insttype.trim(),
          "os": row.os.trim(),
          "startprice": row.startprice,
          "stopprice": row.stopprice,
          "delta": row.stopprice - row.startprice,
        }
      }).filter((row) => {
        return row.startprice != null && row.stopprice != null;
      });

      return retval;
    } catch (e) {
      console.log(e);
      throw e;
    } finally {
      client.release();
    }
  },

  insertData: async (data) => {
    const client = await pool.connect()
    try {

      // first, find the distinct configurations we need to insert
      const configurations = {}
      for (const record of data) {
        configurations[record.az + "\0" + record.insttype + "\0" + record.os] = [record.az, record.insttype, record.os];
      }

      // insert all of the configurations
      await client.query(format('INSERT INTO configurations (az, insttype, os) VALUES %L ON CONFLICT DO NOTHING', Object.values(configurations)));

      // select all of the configurations we will need
      const result = await client.query(format('SELECT * FROM configurations WHERE (az, insttype, os) IN (%L)', 
        Object.values(configurations)
      ));

      const configMapping = {};
      for (const record of result.rows) {
        configMapping[record.az.trim() + "\0" + record.insttype.trim() + "\0" + record.os.trim()] = record.id;
      }

      // query to insert the new data 
      const q = format('INSERT INTO spotprices VALUES %L ON CONFLICT DO NOTHING', data.map((value) => {
        return [configMapping[value.az + "\0" + value.insttype + "\0" + value.os], value.price, '' + new Date(value.timestamp).getTime()];
      }));

      await client.query(q);
    } finally {
      client.release();
    }
  }
}
