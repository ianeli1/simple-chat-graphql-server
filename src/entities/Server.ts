import {
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { Channel } from "./Channel";
import { Emote } from "./Emote";
import { Invite } from "./Invite";
import { User } from "./User";

//TODO: choose between Firebase auth/another service

@ObjectType()
@Entity()
export class Server {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property({ type: "date" })
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  /**The name of the server */
  @Field()
  @Property()
  name!: string;

  /**Who created the server */
  @Field(() => User)
  @ManyToOne(() => User)
  author!: User;

  /**The list of emotes of this server */
  @Field(() => [Emote])
  @OneToMany(() => Emote, (emote) => emote.owner)
  emotes = new Collection<Emote>(this);

  /**The list of channels this server owns */
  @Field(() => [Channel])
  @OneToMany(() => Channel, (channel) => channel.owner)
  channels = new Collection<Channel>(this);

  /**The list of users in this server */
  @Field(() => [User])
  @ManyToMany(() => User, (user) => user.servers, { owner: true })
  members = new Collection<User>(this);

  /**The list of invites for this server */
  @Field(() => [Invite])
  @OneToMany(() => Invite, (invite) => invite.owner)
  invites = new Collection<Invite>(this);
}
