
(async () => {
  const config = require('../../config');
  const backup = require('../model/backup');

  for (const dbconfig of config.backup_databases) {
    console.log(`synchronizing with ${dbconfig.host}:${dbconfig.port} -U ${dbconfig.user}`)
    backup.synchronize(config.pg, dbconfig);
  }
})();