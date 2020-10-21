import { User } from "../entities/User";
import { Context } from "../types";
import { Ctx, InputType, Query, Resolver } from "type-graphql";
import { Emote } from "../entities/Emote";

@InputType()
@Resolver()
export class EmoteResolver {
  @Query(() => [Emote])
  async emotes(@Ctx() { em }: Context) {
    return await em.find(Emote, {});
  }

  @Query(() => [Emote], { nullable: true })
  async myEmotes(@Ctx() { req, em }: Context) {
    if (!req.session.uid) {
      return null;
    }

    const emotes: Emote[] = [];
    const user = await em.findOne(User, { id: req.session.uid }, [
      "servers.emotes",
    ]);
    if (user) {
      for (const server of user.servers) {
        for (const emote of server.emotes) {
          emotes.push(emote);
        }
      }
      return emotes;
    } else {
      return null;
    }
  }
}
