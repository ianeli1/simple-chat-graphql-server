import { User } from "../entities/User";
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
import {
  APIError,
  Confirmation,
  ErrorCode,
  notLoggedIn,
  UserData,
} from "./types";
import { Server } from "../entities/Server";
import { alertDiscord } from "../secretInfo";

@ObjectType()
export class ProtoUser {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  icon?: string;

  @Field()
  createdAt!: Date;

  @Field({ nullable: true })
  birthday?: Date;

  /**True if the logged in user is friends with the requested user */
  @Field({ nullable: true })
  isFriend?: boolean;

  /**True if the logged in user has sent a friend request to this user */
  @Field({ nullable: true })
  sentFriendRequest?: boolean;
}

@ObjectType()
export class UserResponse {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => APIError, { nullable: true })
  error?: APIError;
}

@ObjectType()
export class ProtoUserResponse {
  @Field(() => ProtoUser, { nullable: true })
  user?: ProtoUser;

  @Field(() => APIError, { nullable: true })
  error?: APIError;
}

@InputType()
@Resolver()
export class UserResolver {
  @Query(() => [User], { deprecationReason: "only for debug use" })
  users(@Ctx() { em }: Context): Promise<User[]> {
    return em.find(User, {}, { populate: true });
  }

  @Query(() => ProtoUserResponse)
  async user(
    @Arg("id") id: string,
    @Ctx() { em, req }: Context
  ): Promise<ProtoUserResponse> {
    if (!req.session.uid) {
      return { error: notLoggedIn() };
    }
    const loggedInUser = em.getReference(User, req.session.uid);
    const user = await em.findOne(
      User,
      { id },
      { populate: ["friends", "friendRequests"] }
    );
    if (user) {
      return {
        user: {
          ...user,
          isFriend: user?.friends.contains(loggedInUser) ?? false,
          sentFriendRequest:
            user?.friendRequests.contains(loggedInUser) ?? false,
        },
      };
    } else {
      return {
        error: new APIError(
          ErrorCode.USER_DOESNT_EXIST,
          `The user ${id} doesn't exist`
        ),
      };
    }
  }

  @Query(() => UserResponse)
  async me(@Ctx() { em, req }: Context): Promise<UserResponse> {
    if (!req.session.uid) {
      return { error: notLoggedIn() };
    }
    const user = await em.findOne(
      User,
      { id: req.session.uid },
      { populate: true }
    );
    if (user) {
      return { user };
    } else {
      alertDiscord(
        `FATAL ERROR: Logged in user doesn't exist, id=${req.session.uid}`
      );
      return {
        error: new APIError(
          ErrorCode.USER_DOESNT_EXIST,
          "FATAL ERROR: logged in user, this action was reported."
        ),
      };
    }
  }

  @Mutation(() => UserResponse)
  async createUser(
    @Arg("userData") userData: UserData,
    @Arg("token") token: string,
    @Ctx() { em, auth }: Context
  ): Promise<UserResponse> {
    try {
      const decoded = await auth.verifyIdToken(token);
      const user = em.create(User, {
        id: decoded.uid,
        name: userData.name,
        birthday: userData.birthday,
        email: userData.email,
      });
      await em.persistAndFlush(user);
      return { user };
    } catch (e) {
      alertDiscord(
        `An unknown error just ocurred trying to verify the token=${token} or creating the user=${
          userData.name
        }, error=${JSON.stringify(e, null, 2)}`
      );
      return {
        error: new APIError(
          ErrorCode.UNKNOWN,
          "An unknown server-side error ocurred. Please try again later."
        ),
      };
    }
  }

  @Query(() => User, { nullable: true })
  async login(
    @Arg("token") token: string,
    @Ctx() { auth, em, req }: Context
  ): Promise<UserResponse | null> {
    try {
      const decoded = await auth.verifyIdToken(token);
      const user = await em.findOne(
        User,
        { id: decoded.uid },
        { populate: true }
      );
      if (user) {
        console.log("User logged in:", user.id);
        req.session.uid = user.id;
        return { user };
      } else {
        return { error: new APIError(ErrorCode.USER_DOESNT_EXIST) };
      }
    } catch (e) {
      alertDiscord(
        `An unknown error just ocurred trying to verify the token=${token}, error=${JSON.stringify(
          e,
          null,
          2
        )}`
      );
      console.error(e);
      return {
        error: new APIError(
          ErrorCode.UNKNOWN,
          "An unknown server-side error ocurred. Please try again later."
        ),
      };
    }
  }

  @Mutation(() => Confirmation)
  async leaveServer(
    @Arg("serverId") serverId: number,
    @Ctx() { em, req }: Context
  ): Promise<Confirmation> {
    if (!req.session.uid) {
      return new Confirmation(notLoggedIn());
    }

    const user = await em.findOne(
      User,
      { id: req.session.uid },
      { populate: true }
    );
    const server = em.getReference(Server, serverId);
    if (!user) {
      return new Confirmation(new APIError(ErrorCode.USER_DOESNT_EXIST));
    } else if (user.servers.contains(server)) {
      user.servers.remove(server);
      await em.persistAndFlush(user);
      return new Confirmation(true);
    } else {
      return new Confirmation(new APIError(ErrorCode.NOT_SERVER_MEMBER));
    }
  }

  @Mutation(() => Confirmation)
  async changeAvatar(
    @Arg("image", { description: "URL of the new avatar" }) image: string,
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
    const user = await em.findOne(User, { id: req.session.uid });
    if (user) {
      user.icon = image;
      await em.persistAndFlush(user);
      return new Confirmation(true);
    } else {
      return new Confirmation(new APIError(ErrorCode.USER_DOESNT_EXIST));
    }
  }
}
