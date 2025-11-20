// backend/knexfile.js
export default {
  development: {
    client: "mysql2",
    connection: {
      host:
        process.env.MYSQL_HOST ||
        "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
      port: Number(process.env.MYSQL_PORT || 4000),
      user: process.env.MYSQL_USER || "4MfksbhhXKxyiow.root",
      password: process.env.MYSQL_PASSWORD || "gVeTgmpTS9Z7cpje",
      database: process.env.MYSQL_DATABASE || "appdb",
      ssl: {
        rejectUnauthorized: false,
      },
    },
    migrations: {
      directory: "./migrations",
      tableName: "knex_migrations",
    },
  },
};