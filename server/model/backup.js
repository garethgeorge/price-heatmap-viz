const {setup} = require("./spotprices");

const pg = require('pg')
const format = require('pg-format');


module.exports = {
  synchronize: async (dbfrom_config, dbto_config) => {
    console.log("creating connection pools");
    const dbfrom = new pg.Pool({
      host: dbfrom_config.host,
      user: dbfrom_config.user,
      database: dbfrom_config.database,
      password: dbfrom_config.password,
      port: dbfrom_config.port,
      max: 4,
      ssl: false, 
    });

    const dbto = new pg.Pool({
      host: dbto_config.host,
      user: dbto_config.user,
      database: dbto_config.database,
      password: dbto_config.password,
      port: dbfrom_config.port,
      max: 4,
      ssl: false,
    });

    // first make sure the database on the other server is setup
    await setup(dbto);

    let clifrom, clito;
    try {
      clifrom = await dbfrom.connect();
      clito = await dbto.connect();


      // fetch the configurations
      const configurations = (await clifrom.query("SELECT * FROM configurations")).rows;
      console.log("configurations: ");
      console.log(configurations);

      // insert the configurations into the dbto 
      console.log("inserting configurations into dbto");
      await clito.query(format('INSERT INTO configurations (id, az, insttype, os) VALUES %L ON CONFLICT DO NOTHING', configurations.map((value) => {
        return [value.id, value.az, value.insttype, value.os];
      })));

      // fetching new records and committing them for each configuration
      console.log("fetching the timestamp of the last record in clito, we will synchronize everything past this point");
      for (const conf of configurations) {
        let records;
        do {
          const query = format("SELECT MAX(timestamp) AS ts FROM spotprices WHERE config_id = %L", parseInt(conf.id));
          let timestamp = (await clito.query(query)).rows[0].ts;
          if (!timestamp)
            timestamp = 0;
          records = (await clifrom.query(
            format("SELECT * FROM spotprices WHERE config_id = %L AND timestamp > %L  ORDER BY timestamp LIMIT 10000", conf.id, timestamp)
          )).rows;
          console.log(`host: ${dbto_config.host} config: ${conf.az.trim()} - ${conf.insttype.trim()} latest timestamp on backup: ${timestamp}, found ${records.length} newer records`);
          if (records.length > 0) {
            console.log("\tinserting them into dbto");
            await clito.query(format('INSERT INTO spotprices VALUES %L ON CONFLICT DO NOTHING', records.map((value) => {
              return [conf.id, value.price, value.timestamp];
            })));
          }
        } while (records.length > 0);
      }


      console.log("done synchronization with backup");
    } finally {
      if (clifrom) 
        clifrom.release();
      if (clito) 
        clito.release();
    }
  }
}