import express from "express";
import { MikroORM } from "@mikro-orm/core";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import "reflect-metadata";
import mikroOrmConfig from "./mikro-orm.config";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { EmoteResolver } from "./resolvers/Emote";
import { UserResolver } from "./resolvers/User";
import * as admin from "firebase-admin";
import * as firebase from "firebase";
import { Context, pgCredentials } from "./types";
import { MessageResolver } from "./resolvers/Message";
import { ChannelResolver } from "./resolvers/Channel";
import { ServerResolver } from "./resolvers/Server";
import { MiscResolver } from "./resolvers/Misc";
import { InviteResolver } from "./resolvers/Invite";
import { RelationResolver } from "./resolvers/UserRelations";
import { alertDiscord } from "./utilities";
import { config } from "dotenv";

config();
console.log("Starting server...");

async function main() {
  const {
    PG_USER,
    PG_PASSWORD,
    PG_ENDPOINT,
    PG_PORT,
    SECRET,
    FIREBASE_CONFIG,
    FIREBASE_ADMIN_CRED,
  } = process.env;
  console.log(process.env.FIREBASE_ADMIN_CRED?.slice(163));
  if (!PG_USER && !PG_PASSWORD && !PG_ENDPOINT && !PG_PORT) {
    throw new Error("PostreSQL credentials missing");
  }

  if (!FIREBASE_CONFIG && !FIREBASE_ADMIN_CRED) {
    throw new Error("Firebase config missing");
  }

  const pgCred: pgCredentials = {
    user: PG_USER!,
    password: PG_PASSWORD!,
    host: PG_ENDPOINT!,
    port: +PG_PORT!,
  };

  try {
    console.log("Connecting to Firebase...");
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(FIREBASE_ADMIN_CRED!) as admin.ServiceAccount
      ),
      databaseURL: "https://simple-chat-a9f14.firebaseio.com",
    });
    firebase.initializeApp(JSON.parse(FIREBASE_CONFIG!));
    const auth = admin.auth();
    const clientAuth = firebase.auth();
    console.log("Connected to Firebase!");
    console.log("Connecting to Postgre...");
    const orm = await MikroORM.init({ ...mikroOrmConfig, ...pgCred });
    await orm.getMigrator().up();
    console.log("Connected to Postgre!");
    const app = express();
    app.use(
      cors({
        origin: [
          /localhost/,
          process.env.ORIGIN!, //where requests are gonna be coming from
        ],
        credentials: true,
      })
    );
    app.use(express.json());

    const pgStore = connectPg(session);

    app.use(
      session({
        name: "sid",
        saveUninitialized: false,
        store: new pgStore({
          conObject: {
            ...pgCred,
            database: "simplechatsession",
          },
        }),
        secret: SECRET ?? "afnsagjbasjkbgkasbgkjabgkjbgskjbg",
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
          RelationResolver,
        ],
        validate: false,
        emitSchemaFile: true,
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

    const server = app.listen(4000, () => {
      //alertDiscord("⚡⚡Server started!");
      console.log(`Server started on port ${4000}!`);
    });

    apolloServer.installSubscriptionHandlers(server);
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
