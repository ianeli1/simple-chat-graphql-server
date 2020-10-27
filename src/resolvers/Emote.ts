import { User } from "../entities/User";
import { Context } from "../types";
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
import { Emote } from "../entities/Emote";
import {
  APIError,
  Confirmation,
  EmoteData,
  EmoteObject,
  ErrorCode,
  notLoggedIn,
} from "./types";
import { Server } from "../entities/Server";

@ObjectType()
class EmoteResponse {
  @Field(() => [EmoteObject], { nullable: true })
  emotes?: EmoteObject[];

  @Field(() => APIError, { nullable: true })
  error?: APIError;

  constructor(error: APIError);
  constructor(emotes: EmoteObject[]);
  constructor(value: APIError | EmoteObject[]) {
    if (value instanceof APIError) {
      this.error = value;
    } else {
      this.emotes = value;
    }
  }
}

@InputType()
@Resolver()
export class EmoteResolver {
  @Query(() => EmoteResponse)
  async emotes(@Ctx() { em }: Context): Promise<EmoteResponse | null> {
    const emotes = await em.find(Emote, {}, { populate: ["owner"] });
    return new EmoteResponse(emotes);
  }

  @Query(() => EmoteResponse)
  async myEmotes(@Ctx() { req, em }: Context): Promise<EmoteResponse> {
    if (!req.session.uid) {
      return new EmoteResponse(notLoggedIn());
    }
    const emotes: EmoteObject[] = [];
    const user = await em.findOne(User, { id: req.session.uid }, [
      "servers.emotes.owner",
    ]);
    if (!user) {
      return new EmoteResponse(new APIError(ErrorCode.USER_DOESNT_EXIST));
    } else {
      for (const server of user.servers) {
        for (const emote of server.emotes) {
          emotes.push(emote);
        }
      }
      return new EmoteResponse(emotes);
    }
  }

  @Mutation(() => Confirmation)
  async createEmote(
    @Arg("emote", () => EmoteData) emoteData: EmoteData,
    @Arg("serverId") serverId: number,
    @Ctx() { em, req }: Context
  ): Promise<Confirmation> {
    if (!req.session.uid) {
      return new Confirmation(notLoggedIn());
    }
    const server = await em.findOne(Server, { id: serverId });
    const user = em.getReference(User, req.session.uid);
    if (!server) {
      return new Confirmation(new APIError(ErrorCode.SERVER_DOESNT_EXIST));
    }
    if (server.author !== user) {
      return new Confirmation(new APIError(ErrorCode.NOT_SERVER_ADMIN));
    } else {
      const emote = em.create(Emote, { ...emoteData, author: user });
      server.emotes.add(emote);
      em.persist(emote);
      em.persist(server);
      await em.flush();
      return new Confirmation(true);
    }
  }

  @Mutation(() => Confirmation)
  async removeEmote(
    @Arg("emoteId") emoteId: number,
    @Ctx() { em, req }: Context
  ): Promise<Confirmation> {
    if (!req.session.uid) {
      return new Confirmation(notLoggedIn());
    }
    const user = em.getReference(User, req.session.uid);
    const emote = await em.findOne(
      Emote,
      { id: emoteId },
      { populate: ["owner"] }
    );
    if (!emote) {
      return new Confirmation(new APIError(ErrorCode.EMOTE_DOESNT_EXIST));
    }
    if (emote.owner.author !== user) {
      return new Confirmation(new APIError(ErrorCode.NOT_SERVER_ADMIN));
    } else {
      await em.removeAndFlush(emote);
      return new Confirmation(true);
    }
  }
}
