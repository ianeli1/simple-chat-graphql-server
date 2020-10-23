import { User } from "../entities/User";
import { Arg, Ctx, InputType, Mutation, Query, Resolver } from "type-graphql";
import { Context } from "../types";
import { UserData } from "./types";
import { Server } from "../entities/Server";

@InputType()
@Resolver()
export class UserResolver {
  @Query(() => [User])
  users(@Ctx() { em }: Context): Promise<User[]> {
    return em.find(User, {}, {populate: true});
  }

  @Query(() => User, { nullable: true })
  async user(
    @Arg("id") id: string,
    @Ctx() { em }: Context
  ): Promise<User | null> {
    return await em.findOne(User, { id }, {populate: true});
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: Context) {
    return await em.findOne(User, { id: req.session.uid }, {populate: true});
  }

  @Mutation(() => User)
  async createUser(
    @Arg("userData") userData: UserData,
    @Arg("token") token: string,
    @Ctx() { em, auth }: Context
  ) {
    try {
      const decoded = await auth.verifyIdToken(token);
      const user = em.create(User, {
        id: decoded.uid,
        name: userData.name,
        birthday: userData.birthday,
        email: userData.email,
      });
      await em.persistAndFlush(user);
      return user;
    } catch (e) {
      console.log(e);
      return "An unexpected error has ocurred";
    }
  }

  @Query(() => User, { nullable: true })
  async login(
    @Arg("token") token: string,
    @Ctx() { auth, em, req }: Context
  ): Promise<User | null> {
    try {
      const decoded = await auth.verifyIdToken(token);
      const user = await em.findOne(User, { id: decoded.uid }, {populate: true});
      if (user) {
        console.log("User logged in:", user.id);
        req.session.uid = user.id;
      }
      return user;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  @Mutation(() => User, {nullable: true})
  async leaveServer(
    @Arg("serverId") serverId: number,
    @Ctx() {em, req}: Context
  ){
    if(!req.session.uid){
      return null
    }

    const user = await em.findOne(User, {id: req.session.uid}, {populate: true})
    const server = em.getReference(Server, serverId);
    if(user && user.servers.contains(server)){
      user.servers.remove(server)
      await em.persistAndFlush(user)
      return user
    }else{
      return null
    }
  }
  
}
