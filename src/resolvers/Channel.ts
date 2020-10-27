import { Channel } from "../entities/Channel";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { Context } from "../types";
import { Server } from "../entities/Server";
import { User } from "../entities/User";
import { APIError, Confirmation, ErrorCode, notLoggedIn } from "./types";

@ObjectType()
class ChannelResponse {
  @Field(() => Channel, { nullable: true })
  channel?: Channel;

  @Field(() => APIError, { nullable: true })
  error?: APIError;

  constructor(error: APIError);
  constructor(channel: Channel);
  constructor(value: APIError | Channel) {
    if (value instanceof APIError) {
      this.error = value;
    } else {
      this.channel = value;
    }
  }
}

@InputType()
@Resolver()
export class ChannelResolver {
  @Query(() => [Channel], { deprecationReason: "debug" })
  allChannels(@Ctx() { em }: Context) {
    return em.find(Channel, {}, { populate: true });
  }

  @Query(() => [Channel], { nullable: true, deprecationReason: "useless" })
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

  @Query(() => ChannelResponse)
  async channel(
    @Arg("channelId") id: number,
    @Ctx() { em, req }: Context
  ): Promise<ChannelResponse> {
    if (!req.session.uid) {
      return new ChannelResponse(notLoggedIn());
    }
    const channel = await em.findOne(Channel, { id }, { populate: true });
    const user = em.getReference(User, req.session.uid);
    if (!channel) {
      return new ChannelResponse(new APIError(ErrorCode.CHANNEL_DOESNT_EXIST));
    }
    if (!channel.owner.members.contains(user)) {
      return new ChannelResponse(new APIError(ErrorCode.NOT_SERVER_MEMBER));
    } else {
      return new ChannelResponse(channel);
    }
  }

  @Mutation(() => Confirmation)
  async createChannel(
    @Arg("name") name: string,
    @Arg("serverId") serverId: number,
    @Ctx() { req, em }: Context
  ): Promise<Confirmation> {
    if (!req.session.uid) {
      return new Confirmation(notLoggedIn());
    }
    const user = await em.findOne(User, { id: req.session.uid });
    const server = await em.findOne(Server, { id: serverId });
    if (!user) {
      return new Confirmation(new APIError(ErrorCode.USER_DOESNT_EXIST));
    }
    if (!server) {
      return new Confirmation(new APIError(ErrorCode.SERVER_DOESNT_EXIST));
    } else {
      const channel = em.create(Channel, {
        author: user,
        name,
        owner: server,
      });
      await em.persistAndFlush(channel);
      return new Confirmation(true);
    }
  }

  @Mutation(() => Confirmation)
  async removeChannel(
    @Arg("channelId") channelId: number,
    @Ctx() { em, req }: Context
  ): Promise<Confirmation> {
    if (!req.session.uid) {
      return new Confirmation(notLoggedIn());
    }
    const user = em.getReference(User, req.session.uid);
    const channel = await em.findOne(
      Channel,
      { id: channelId },
      { populate: true }
    );
    if (!channel) {
      return new Confirmation(new APIError(ErrorCode.CHANNEL_DOESNT_EXIST));
    }
    if (channel.owner.author !== user) {
      return new Confirmation(new APIError(ErrorCode.NOT_SERVER_ADMIN));
    } else {
      await em.removeAndFlush(channel);
      return new Confirmation(true);
    }
  }
}
