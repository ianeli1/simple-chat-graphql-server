import { User } from "../entities/User";
import { Context } from "../types";
import {
  Arg,
  Ctx,
  InputType,
  Mutation,
  Publisher,
  PubSub,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import { Message } from "../entities/Message";
import { Channel } from "../entities/Channel";
import {
  APIError,
  Confirmation,
  ErrorCode,
  MessageData,
  notLoggedIn,
} from "./types";

function filterNewMessageSubscription({
  args,
  payload,
}: {
  args: { channelId: number };
  payload: Message;
}): boolean {
  return args.channelId === payload.channel.id;
}

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
    filter: filterNewMessageSubscription,
    topics: "NEW_MESSAGE",
  })
  async newMessage(
    @Arg("channelId") _channelId: number,
    @Root() message: Message
  ) {
    return message;
  }

  @Mutation(() => Confirmation)
  async createMessage(
    @Arg("channelId") channelId: number,
    @Arg("message") messageData: MessageData,
    @Ctx() { em, req }: Context,
    @PubSub("NEW_MESSAGE") publish: Publisher<Message>
  ): Promise<Confirmation> {
    if (!req.session.uid) {
      return new Confirmation(notLoggedIn());
    }

    const author = await em.findOne(
      User,
      { id: req.session.uid },
      { populate: true }
    );
    const channel = await em.findOne(Channel, { id: channelId });
    if (!author) {
      return new Confirmation(new APIError(ErrorCode.USER_DOESNT_EXIST));
    }
    if (!channel) {
      return new Confirmation(new APIError(ErrorCode.CHANNEL_DOESNT_EXIST));
    } else {
      const message = em.create(Message, {
        content: messageData.content,
        channel,
        author,
      });
      await em.persistAndFlush(message);
      publish(message);
      return new Confirmation(true);
    }
  }
}
