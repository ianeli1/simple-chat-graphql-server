import { User } from "../entities/User";
import { Context } from "../types";
import { Arg, Ctx, InputType, Mutation, Publisher, PubSub, Query, Resolver, Root, Subscription } from "type-graphql";
import { Message } from "../entities/Message";
import { Channel } from "../entities/Channel";
import { MessageData } from "./types";

@InputType()
@Resolver()
export class MessageResolver {
  @Query(() => [Message])
  async allMessages(@Ctx() { em }: Context) {
    return await em.find(Message, {}, { populate: true });
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

  @Subscription(() => Message, {
    topics: "NEW_MESSAGE",
    filter: ({args, payload}: {payload: Message, args: {channelId: number}}) => args.channelId === payload.channel.id
  })
  async newMessage(@Arg("channelId") _channelId: number, @Root() message: Message){
    return message
  }

  @Mutation(() => Message, { nullable: true })
  async createMessage(
    @Arg("channelId") channelId: number,
    @Arg("message") messageData: MessageData,
    @Ctx() { em, req }: Context,
    @PubSub("NEW_MESSAGE") publish: Publisher<Message>
  ) {
    if (!req.session.uid) {
      return null;
    }

    const author = await em.findOne(
      User,
      { id: req.session.uid },
      { populate: true }
    );
    const channel = await em.findOne(Channel, { id: channelId });
    if (author && channel) {
      const message = em.create(Message, {
        content: messageData.content,
        channel,
        author,
      });
      await em.persistAndFlush(message);
      publish(message)
      return message;
    } else {
      return null;
    }
  }
}
