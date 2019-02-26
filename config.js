module.exports = {
  admin_secret: 'YighFcnsQD742KmWMNa8gqgEUywpKZycNoEkmYNdKUGDEEHkGbzCuqRi%NxLMsUJ',
  pg: {
    host: 'db',
    user: 'postgres',
    database: 'postgres',
    password: 'sNoRjCyoKmPxh8pgk3M>zJ4cgBoeU8be',
    port: 5432
  },
  backup_databases: [
    {
      host: '169.231.235.190', // Spot Price Data for Kyle instance
      user: 'postgres',
      database: 'postgres',
      password: 'kXaVBEyzcPg8PZTdafwt',
      port: 5432
    },
    {
      host: 'db_backup',
      user: 'postgres',
      database: 'postgres',
      password: 'sNoRjCyoKmPxh8pgk3M>zJ4cgBoeU8be',
      port: 5433
    }
  ],
  
  // rich's zone_id to az mapping (rich being the data source, this is the mapping one would use...)
  zoneid_az_mapping: {
    "eun1-az1": "eu-north-1a",
    "eun1-az2": "eu-north-1b",
    "eun1-az3": "eu-north-1c",
    "aps1-az1": "ap-south-1a",
    "aps1-az3": "ap-south-1b",
    "euw3-az1": "eu-west-3a",
    "euw3-az2": "eu-west-3b",
    "euw3-az3": "eu-west-3c",
    "euw2-az2": "eu-west-2a",
    "euw2-az3": "eu-west-2b",
    "euw2-az1": "eu-west-2c",
    "euw1-az3": "eu-west-1a",
    "euw1-az1": "eu-west-1b",
    "euw1-az2": "eu-west-1c",
    "apne2-az1": "ap-northeast-2a",
    "apne2-az3": "ap-northeast-2c",
    "apne1-az4": "ap-northeast-1a",
    "apne1-az1": "ap-northeast-1c",
    "apne1-az2": "ap-northeast-1d",
    "sae1-az1": "sa-east-1a",
    "sae1-az2": "sa-east-1b",
    "sae1-az3": "sa-east-1c",
    "cac1-az1": "ca-central-1a",
    "cac1-az2": "ca-central-1b",
    "apse1-az1": "ap-southeast-1a",
    "apse1-az2": "ap-southeast-1b",
    "apse1-az3": "ap-southeast-1c",
    "apse2-az3": "ap-southeast-2a",
    "apse2-az1": "ap-southeast-2b",
    "apse2-az2": "ap-southeast-2c",
    "euc1-az2": "eu-central-1a",
    "euc1-az3": "eu-central-1b",
    "euc1-az1": "eu-central-1c",
    "use1-az1": "us-east-1a",
    "use1-az2": "us-east-1b",
    "use1-az4": "us-east-1c",
    "use1-az6": "us-east-1d",
    "use1-az3": "us-east-1e",
    "use1-az5": "us-east-1f",
    "use2-az1": "us-east-2a",
    "use2-az2": "us-east-2b",
    "use2-az3": "us-east-2c",
    "usw1-az3": "us-west-1a",
    "usw1-az1": "us-west-1b",
    "usw2-az1": "us-west-2a",
    "usw2-az2": "us-west-2b",
    "usw2-az3": "us-west-2c",
    "usw2-az4": "us-west-2d",
  }
}