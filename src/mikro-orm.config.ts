import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { Channel } from "./entities/Channel";
import { User } from "./entities/User";
import { Message } from "./entities/Message";
import { Server } from "./entities/Server";
import { Emote } from "./entities/Emote";
import { Invite } from "./entities/Invite";
import { config } from "dotenv";

config();
export default {
  entities: [User, Message, Channel, Server, Emote, Invite],
  dbName: "simplechat",
  type: "postgresql",
  debug: true,
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_ENDPOINT,
  port: process.env.PG_PORT,
} as Parameters<typeof MikroORM.init>[0];
