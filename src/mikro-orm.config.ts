import { MikroORM } from "@mikro-orm/core";
import { rds_connection } from "./secretInfo";
import path from "path";
import { Channel } from "./entities/Channel";
import { User } from "./entities/User";
import { Message } from "./entities/Message";
import { Server } from "./entities/Server";
import { Emote } from "./entities/Emote";
import { Invite } from "./entities/Invite";

export default {
  entities: [User, Message, Channel, Server, Emote, Invite],
  dbName: "simplechat",
  type: "postgresql",
  user: rds_connection.user,
  password: rds_connection.password,
  host: rds_connection.endpoint,
  port: rds_connection.port,
  debug: true,
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
} as Parameters<typeof MikroORM.init>[0];
