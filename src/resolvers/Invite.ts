import { Arg, Ctx, InputType, Query, Resolver } from "type-graphql";
import { Invite } from "../entities/Invite";
import { Server } from "../entities/Server";
import { User } from "../entities/User";
import { Context } from "../types";

@InputType()
@Resolver()
export class InviteResolver {
  @Query(() => [Invite])
  async allInvites(@Ctx() { em }: Context) {
    return await em.find(Invite, {}, { populate: true });
  }

  async invites(@Arg("serverId") serverId: number, @Ctx() { em }: Context) {
    const server = await em.findOne(
      Server,
      { id: serverId },
      { populate: true }
    );
    if (server) {
      return server.invites.getItems();
    } else {
      return null;
    }
  }

  async invite(@Arg("inviteId") inviteId: number, @Ctx() { em }: Context) {
    const invite = await em.findOne(
      Invite,
      { id: inviteId },
      { populate: true }
    );
    return invite;
  }

  async createInvite(
    @Arg("serverId") serverId: number,
    @Arg("expire", () => Date, { nullable: true }) expire: Date | null,
    @Ctx() { em, req }: Context
  ) {
    if (!req.session.uid) {
      return null;
    }

    const server = await em.findOne(
      Server,
      { id: serverId },
      { populate: true }
    );
    const user = await em.findOne(
      User,
      { id: req.session.uid },
      { populate: true }
    );
    if (user && server) {
      const invite = em.create(Invite, { author: user, owner: server, expire });
      await em.persistAndFlush(invite);
      return invite;
    } else {
      return null;
    }
  }

  async useInvite(
    @Arg("inviteId") inviteId: number,
    @Ctx() { em, req }: Context
  ) {
    if (!req.session.uid) {
      return null;
    }

    const user = await em.findOne(
      User,
      { id: req.session.uid },
      { populate: true }
    );
    const invite = await this.invite(inviteId, { em } as Context);
    if (user && invite) {
      const server = invite.owner;
      server.members.add(user);
      await em.persistAndFlush(server);
      return server;
    } else {
      return null;
    }
  }
}
