import express from "express";
import https from "https"
import fs from "fs"
import { MikroORM } from "@mikro-orm/core";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import "reflect-metadata";
import config from "./mikro-orm.config";
import { alertDiscord, rds_connection, firebaseConfig } from "./secretInfo";
//import redis from "redis";
import session from "express-session";
//import connectRedis from "connect-redis";
import connectPg from "connect-pg-simple";
import { EmoteResolver } from "./resolvers/Emote";
import { UserResolver } from "./resolvers/User";
import * as admin from "firebase-admin";
import * as firebase from "firebase";
import admin_config from "./simple-chat-a9f14-firebase-adminsdk-5dxcg-039ee4162f.json";
import { Context } from "./types";
import { MessageResolver } from "./resolvers/Message";
import { ChannelResolver } from "./resolvers/Channel";
import { ServerResolver } from "./resolvers/Server";
import { MiscResolver } from "./resolvers/Misc";
import { InviteResolver } from "./resolvers/Invite";
import { RelationResolver } from "./resolvers/UserRelations";

console.log("Starting server...");

const privateKey = fs.readFileSync("/etc/letsencrypt/live/simplechat.mywire.org/privkey.pem", "utf-8")
const certificate = fs.readFileSync("/etc/letsencrypt/live/simplechat.mywire.org/cert.pem", "utf-8")
const ca = fs.readFileSync("/etc/letsencrypt/live/simplechat.mywire.org/chain.pem", "utf-8")

const credentials = {
  key: privateKey,
  cert: certificate,
  ca
}

async function main() {
  try {
    console.log("Connecting to Firebase...");
    admin.initializeApp({
      credential: admin.credential.cert(admin_config as admin.ServiceAccount),
      databaseURL: "https://simple-chat-a9f14.firebaseio.com",
    });
    firebase.initializeApp(firebaseConfig);
    const auth = admin.auth();
    const clientAuth = firebase.auth();
    console.log("Connected to Firebase!");
    console.log("Connecting to RDS...");
    const orm = await MikroORM.init(config);
    await orm.getMigrator().up();
    console.log("Connected to RDS!");
    const app = express();
    app.use(cors());
    app.use(express.json());

    const pgStore = connectPg(session);

    app.use(
      session({
        name: "sid",
        saveUninitialized: false,
        store: new pgStore({
          conObject: {
            user: rds_connection.user,
            password: rds_connection.password,
            host: rds_connection.endpoint,
            port: rds_connection.port,
            database: "simplechatsession",
          },
        }),
        secret: "afnsagjbasjkbgkasbgkjabgkjbgskjbg",
        resave: false,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 365, //1 year
          httpOnly: true,
          secure: false,
          sameSite: "lax",
        },
      })
    );

    const apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [
          EmoteResolver,
          UserResolver,
          MessageResolver,
          ChannelResolver,
          ServerResolver,
          MiscResolver,
          InviteResolver,
          RelationResolver
        ],
        validate: false,
        emitSchemaFile: true
      }),
      context: ({ req, res }): Context => ({
        em: orm.em,
        req: req as Context["req"],
        res,
        auth,
        clientAuth,
      }),
    });

    apolloServer.applyMiddleware({
      app,
      cors: false,
    });

    const httpsServer = https.createServer(credentials, app)

    httpsServer.listen(443, () => {
      console.log("HTTPS server created")
      alertDiscord("HTTPS SERVER RUNNING!!!")
    })

    apolloServer.installSubscriptionHandlers(httpsServer)
  } catch (e) {
    //TODO: error handle lmao
    throw e;
  }
}

main().catch((e) => {
  alertDiscord(
    `An unhandled error ocurred in the main loop: ${JSON.stringify(e)}`
  );
  console.log(e);
});
