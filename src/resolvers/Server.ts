import { Server } from "../entities/Server";
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
import { APIError, Confirmation, ErrorCode, notLoggedIn } from "./types";

@ObjectType()
class ServerResponse {
  @Field(() => Server, { nullable: true })
  server?: Server;

  @Field(() => APIError, { nullable: true })
  error?: APIError;

  constructor(server: Server);
  constructor(error: APIError);
  constructor(value: Server | APIError) {
    if (value instanceof Server) {
      this.server = value;
    } else {
      this.error = value;
    }
  }
}

@ObjectType()
class ServerListResponse {
  @Field(() => [Server], { nullable: true })
  servers?: Server[];

  @Field(() => APIError, { nullable: true })
  error?: APIError;

  constructor(servers: Server[]);
  constructor(error: APIError);
  constructor(value: Server[] | APIError) {
    if (value instanceof APIError) {
      this.error = value;
    } else {
      this.servers = value;
    }
  }
}

@InputType()
@Resolver()
export class ServerResolver {
  @Query(() => [Server], { deprecationReason: "debug" })
  servers(@Ctx() { em }: Context) {
    return em.find(Server, {});
  }

  @Query(() => ServerResponse)
  async server(
    @Arg("serverId") serverId: number,
    @Ctx() { em, req }: Context
  ): Promise<ServerResponse> {
    if (!req.session.uid) {
      return new ServerResponse(notLoggedIn());
    }
    const user = em.getReference(User, req.session.uid);
    const server = await em.findOne(
      Server,
      { id: serverId },
      { populate: true }
    );
    if (!server) {
      return new ServerResponse(new APIError(ErrorCode.SERVER_DOESNT_EXIST));
    }
    if (!server.members.contains(user)) {
      return new ServerResponse(new APIError(ErrorCode.NOT_SERVER_MEMBER));
    } else {
      return new ServerResponse(server);
    }
  }

  @Mutation(() => Confirmation)
  async kickMember(
    @Arg("serverId") serverId: number,
    @Arg("userId") userId: string,
    @Ctx() { em, req }: Context
  ): Promise<Confirmation> {
    if (!req.session.uid) {
      return new Confirmation(notLoggedIn());
    }
    const owner = em.getReference(User, req.session.uid);
    const user = em.getReference(User, userId);
    const server = await em.findOne(
      Server,
      { id: serverId },
      { populate: ["members", "author"] }
    );
    if (!server) {
      return new Confirmation(new APIError(ErrorCode.SERVER_DOESNT_EXIST));
    }
    if (server.author !== owner) {
      return new Confirmation(new APIError(ErrorCode.NOT_SERVER_ADMIN));
    }
    if (!server.members.contains(user)) {
      return new Confirmation(new APIError(ErrorCode.NOT_SERVER_MEMBER));
    } else {
      server.members.remove(user);
      await em.persistAndFlush(server);
      return new Confirmation(true);
    }
  }

  @Query(() => ServerListResponse, {
    deprecationReason:
      "doesn't populate all values, deemed unnecessary, use the query me{}",
  })
  async myServers(@Ctx() { req, em }: Context): Promise<ServerListResponse> {
    if (!req.session.uid) {
      return new ServerListResponse(notLoggedIn());
    }
    const user = await em.findOne(
      User,
      { id: req.session.uid },
      { populate: ["servers"] }
    );
    if (!user) {
      return new ServerListResponse(new APIError(ErrorCode.USER_DOESNT_EXIST));
    } else {
      return new ServerListResponse(user.servers.getItems());
    }
  }

  @Mutation(() => Confirmation)
  async createServer(
    @Arg("name") name: string,
    @Ctx() { em, req }: Context
  ): Promise<Confirmation> {
    if (!req.session.uid) {
      return new Confirmation(notLoggedIn());
    }
    const user = em.getReference(User, req.session.uid);
    if (!user) {
      return new Confirmation(new APIError(ErrorCode.USER_DOESNT_EXIST));
    } else {
      const server = em.create(Server, { name, author: user, members: [user] });
      await em.persistAndFlush(server);
      return new Confirmation(true);
    }
  }

  @Mutation(() => Confirmation)
  async changeServerIcon(
    @Arg("image") image: string,
    @Arg("serverId") serverId: number,
    @Ctx() { em, req }: Context
  ): Promise<Confirmation> {
    if (!req.session.uid) {
      return new Confirmation(notLoggedIn());
    }
    if (!/https?:\/\/(www\.)?[a-zA-Z0-9.]+\.[a-zA-Z]+\//.test(image)) {
      return new Confirmation(
        new APIError(ErrorCode.OTHER, "Invalid image URL")
      );
    }
    const server = await em.findOne(Server, { id: serverId });
    const user = em.getReference(User, req.session.uid);
    if (!server) {
      return new Confirmation(new APIError(ErrorCode.SERVER_DOESNT_EXIST));
    }
    if (server.author !== user) {
      return new Confirmation(new APIError(ErrorCode.NOT_SERVER_ADMIN));
    } else {
      server.icon = image;
      await em.persistAndFlush(server);
      return new Confirmation(true);
    }
  }
}
