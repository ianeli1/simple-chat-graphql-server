import { Server } from "../entities/Server";
import { User } from "../entities/User";
import { Context } from "../types";
import { Arg, Ctx, InputType, Mutation, Query, Resolver } from "type-graphql";

@InputType()
@Resolver()
export class ServerResolver {
  @Query(() => [Server])
  servers(@Ctx() { em }: Context) {
    return em.find(Server, {});
  }

  @Query(() => [Server], { nullable: true })
  async myServers(@Ctx() { req, em }: Context) {
    if (!req.session.uid) {
      return null;
    }
    const user = await em.findOne(
      User,
      { id: req.session.uid },
      { populate: ["servers"] }
    );
    if (user) {
      return user.servers.getItems();
    } else {
      return null;
    }
  }

  @Mutation(() => Server, { nullable: true })
  async createServer(@Arg("name") name: string, @Ctx() { em, req }: Context) {
    if (!req.session.uid) {
      return null;
    }
    const user = await em.findOne(
      User,
      { id: req.session.uid },
      { populate: false }
    );
    if (user) {
      const server = em.create(Server, { name, author: user, members: [user] });
      await em.persistAndFlush(server);
      return server;
    } else {
      return null;
    }
  }
}
