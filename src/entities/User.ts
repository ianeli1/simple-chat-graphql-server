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
  @Field()
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property({ type: "date" })
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  @Field()
  @Property()
  name!: string;

  @Field()
  @Property()
  email!: string;

  @Property()
  password: string;

  @Field(() => Date)
  @Property({ type: "date", nullable: true })
  birthday: Date;

  /**The list of servers the user has joined */
  @Field(() => [Server])
  @ManyToMany(() => Server, (server) => server.members)
  servers = new Collection<Server>(this);

  /**The list of servers this user owns */
  @Field(() => [Server])
  @OneToMany(() => Server, (server) => server.author)
  serversOwned = new Collection<Server>(this);
}
