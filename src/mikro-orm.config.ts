import { MikroORM } from "@mikro-orm/core";
import { rds_connection } from "../secretInfo";
import path from "path";

export default {
  entities: [],
  dbName: "simplechat",
  type: "postgresql",
  user: rds_connection.user,
  password: rds_connection.password,
  host: rds_connection.endpoint,
  port: rds_connection.port,
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
} as Parameters<typeof MikroORM.init>[0];
