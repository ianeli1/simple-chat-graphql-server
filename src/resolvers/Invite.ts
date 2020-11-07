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
import { Invite } from "../entities/Invite";
import { Server } from "../entities/Server";
import { User } from "../entities/User";
import { Context } from "../types";
import {
  APIError,
  Confirmation,
  ErrorCode,
  notLoggedIn,
  ProtoServer,
} from "./types";
import { ProtoUser } from "./User";

@ObjectType()
export class ProtoInvite {
  @Field()
  id: number;

  @Field()
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  expire?: Date;

  @Field(() => ProtoUser)
  author: ProtoUser;

  @Field(() => ProtoServer)
  owner: ProtoServer;
}

@ObjectType()
class InviteResponse {
  @Field(() => ProtoInvite, { nullable: true })
  invite?: ProtoInvite;

  @Field(() => APIError, { nullable: true })
  error?: APIError;

  constructor(error: APIError);
  constructor(invite: ProtoInvite);
  constructor(value: APIError | ProtoInvite) {
    if (value instanceof APIError) {
      this.error = value;
    } else {
      this.invite = value;
    }
  }
}

@ObjectType()
class InviteListResponse {
  @Field(() => [ProtoInvite], { nullable: true })
  invites?: ProtoInvite[];

  @Field(() => APIError, { nullable: true })
  error?: APIError;

  constructor(error: APIError);
  constructor(invites: ProtoInvite[]);
  constructor(value: APIError | ProtoInvite[]) {
    if (value instanceof APIError) {
      this.error = value;
    } else {
      this.invites = value;
    }
  }
}

@InputType()
@Resolver()
export class InviteResolver {
  @Query(() => InviteListResponse)
  async allInvites(@Ctx() { em }: Context): Promise<InviteListResponse> {
    const invites = await em.find(Invite, {}, { populate: true });
    return new InviteListResponse(invites);
  }

  @Query(() => InviteListResponse)
  async invites(
    @Arg("serverId") serverId: number,
    @Ctx() { em, req }: Context
  ): Promise<InviteListResponse> {
    if (!req.session.uid) {
      return new InviteListResponse(notLoggedIn());
    }
    const server = await em.findOne(
      Server,
      { id: serverId },
      { populate: true }
    );
    if (!server) {
      return new InviteListResponse(
        new APIError(ErrorCode.SERVER_DOESNT_EXIST)
      );
    } else {
      return new InviteListResponse(server.invites.getItems());
    }
  }

  @Query(() => InviteResponse)
  async invite(
    @Arg("inviteId") inviteId: number,
    @Ctx() { em, req }: Context
  ): Promise<InviteResponse> {
    if (!req.session.uid) {
      return new InviteResponse(notLoggedIn());
    }
    const invite = await em.findOne(
      Invite,
      { id: inviteId },
      { populate: true }
    );
    if (!invite) {
      return new InviteResponse(new APIError(ErrorCode.INVITE_DOESNT_EXIST));
    } else {
      return new InviteResponse(invite);
    }
  }

  @Mutation(() => InviteResponse)
  async createInvite(
    @Arg("serverId") serverId: number,
    @Arg("expire", () => Date, { nullable: true }) expire: Date | null,
    @Ctx() { em, req }: Context
  ): Promise<InviteResponse> {
    if (!req.session.uid) {
      return new InviteResponse(notLoggedIn());
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
    if (!user) {
      return new InviteResponse(new APIError(ErrorCode.USER_DOESNT_EXIST));
    }
    if (!server) {
      return new InviteResponse(new APIError(ErrorCode.SERVER_DOESNT_EXIST));
    } else {
      const invite = em.create(Invite, { author: user, owner: server, expire });
      await em.persistAndFlush(invite);
      return new InviteResponse(invite);
    }
  }

  @Mutation(() => Confirmation)
  async removeInvite(
    @Arg("inviteId") inviteId: number,
    @Ctx() { em, req }: Context
  ): Promise<Confirmation> {
    if (!req.session.uid) {
      return new Confirmation(notLoggedIn());
    }
    const user = em.getReference(User, req.session.uid);
    const invite = await em.findOne(
      Invite,
      { id: inviteId },
      { populate: ["owner"] }
    );
    if (!invite) {
      return new Confirmation(new APIError(ErrorCode.INVITE_DOESNT_EXIST));
    }
    if (invite.owner.author !== user) {
      return new Confirmation(new APIError(ErrorCode.NOT_SERVER_ADMIN));
    } else {
      await em.removeAndFlush(invite);
      return new Confirmation(true);
    }
  }

  @Mutation(() => Confirmation)
  async useInvite(
    @Arg("inviteId") inviteId: number,
    @Ctx() { em, req }: Context
  ): Promise<Confirmation> {
    if (!req.session.uid) {
      return new Confirmation(notLoggedIn());
    }

    const user = await em.findOne(User, { id: req.session.uid });
    const invite = await em.findOne(
      Invite,
      { id: inviteId },
      { populate: ["owner"] }
    );
    if (!user) {
      return new Confirmation(new APIError(ErrorCode.USER_DOESNT_EXIST));
    }
    if (!invite) {
      return new Confirmation(new APIError(ErrorCode.INVITE_DOESNT_EXIST));
    } else {
      const server = invite.owner;
      server.members.add(user);
      await em.persistAndFlush(server);
      return new Confirmation(true);
    }
  }
}
