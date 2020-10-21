import { Channel } from "../entities/Channel";
import { Arg, Ctx, InputType, Mutation, Query, Resolver } from "type-graphql";
import { Context } from "../types";
import { Server } from "../entities/Server";
import { User } from "../entities/User";

@InputType()
@Resolver()
export class ChannelResolver {
  @Query(() => [Channel])
  allChannels(@Ctx() { em }: Context) {
    return em.find(Channel, {}, { populate: true });
  }

  @Query(() => [Channel], { nullable: true })
  async channels(
    @Arg("serverId") serverId: number,
    @Ctx() { em }: Context
  ): Promise<Channel[] | null> {
    //TODO: check if server owns the current user
    const server = await em.findOne(
      Server,
      { id: serverId },
      { populate: true }
    );
    if (server) {
      return server.channels.getItems();
    } else {
      return null;
    }
  }

  @Query(() => Channel, { nullable: true })
  async channel(@Arg("channelId") id: number, @Ctx() { em }: Context) {
    return await em.findOne(Channel, { id });
  }

  @Mutation(() => Channel, { nullable: true })
  async createChannel(
    @Arg("name") name: string,
    @Arg("serverId") serverId: number,
    @Ctx() { req, em }: Context
  ) {
    if (!req.session.uid) {
      return null;
    }
    const user = await em.findOne(User, { id: req.session.uid });
    const server = await em.findOne(Server, { id: serverId });
    if (user && server) {
      const channel = em.create(Channel, {
        author: user,
        name,
        owner: server,
      });
      await em.persistAndFlush(channel);
      return channel;
    } else {
      return null;
    }
  }
}
