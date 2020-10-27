import {
  Collection,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { Server } from "./Server";

//TODO: choose between Firebase auth/another service

@ObjectType()
@Entity()
export class User {
  /**The UID from Firebase */
  @Field()
  @PrimaryKey()
  id!: string;

  @Field(() => Date)
  @Property({ type: "date" })
  createdAt = new Date();

  @Field(() => Date)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  @Field()
  @Property()
  name!: string;

  @Field()
  @Property()
  email!: string;

  @Field(() => Date, { nullable: true })
  @Property({ type: "date", nullable: true })
  birthday?: Date;

  /**The user's profile picture */
  @Field({ nullable: true })
  @Property({ nullable: true })
  icon?: string;

  /**The list of servers the user has joined */
  @Field(() => [Server])
  @ManyToMany(() => Server, (server) => server.members)
  servers = new Collection<Server>(this);

  /**The list of servers this user owns */
  @Field(() => [Server])
  @OneToMany(() => Server, (server) => server.author)
  serversOwned = new Collection<Server>(this);

  @Field(() => [User])
  @ManyToMany(() => User)
  friends = new Collection<User>(this);

  /**Collection of users that have sent this user a friend request */
  @Field(() => [User])
  @ManyToMany(() => User)
  friendRequests = new Collection<User>(this);
}
