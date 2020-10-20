import express from "express";
import { MikroORM } from "@mikro-orm/core";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import "reflect-metadata";
import config from "./mikro-orm.config";
import { alertDiscord } from "secretInfo";

console.log("Starting server...");

async function main() {
  try {
    console.log("Connecting to RDS...");
    const orm = await MikroORM.init(config);
    await orm.getMigrator().up();
    console.log("Connected to RDS!");

    const app = express();
    app.use(cors());
    app.use(express.json());

    const apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [],
        validate: false,
      }),
      context: () => ({
        em: orm.em,
      }),
    });

    apolloServer.applyMiddleware({
      app,
      cors: false,
    });

    app.listen(4000, () => {
      alertDiscord("⚡⚡Server started!");
      console.log(`Server started on port ${4000}!`);
    });
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
