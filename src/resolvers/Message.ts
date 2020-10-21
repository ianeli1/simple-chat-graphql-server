import { User } from "../entities/User";
import { Context } from "../types";
import { Arg, Ctx, InputType, Mutation, Query, Resolver } from "type-graphql";
import { Message } from "../entities/Message";
import { Channel } from "../entities/Channel";
import { MessageData } from "./types";

@InputType()
@Resolver()
export class MessageResolver {
  @Query(() => [Message])
  async allMessages(@Ctx() { em }: Context) {
    return await em.find(Message, {});
  }

  @Query(() => [Message], { nullable: true })
  async messages(@Arg("channelId") channelId: number, @Ctx() { em }: Context) {
    const channel = await em.findOne(
      Channel,
      { id: channelId },
      { populate: true }
    );
    return channel?.messages.getItems() ?? null;
  }

  @Mutation(() => Message, { nullable: true })
  async createMessage(
    @Arg("channelId") channelId: number,
    @Arg("message") messageData: MessageData,
    @Ctx() { em, req }: Context
  ) {
    if (!req.session.uid) {
      return null;
    }

    const author = await em.findOne(
      User,
      { id: req.session.uid },
      { populate: ["servers.channels"] }
    );
    const channel = await em.findOne(Channel, { id: channelId });
    if (author && channel) {
      const message = em.create(Message, {
        content: messageData.content,
        channel,
        author,
      });
      em.persistAndFlush(message);
      return message;
    } else {
      return null;
    }
  }
}
