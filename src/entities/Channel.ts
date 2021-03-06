import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { Message } from "./Message";
import { Server } from "./Server";
import { User } from "./User";

@ObjectType()
@Entity()
export class Channel {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field(() => Date)
  @Property({ type: "date" })
  createdAt = new Date();

  @Field(() => Date)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  /**The name of the channel */
  @Field()
  @Property()
  name!: string;

  /**The user who created the channel */
  @Field(() => User)
  @ManyToOne(() => User)
  author!: User;

  /**The server that owns this channel */
  @Field(() => Server)
  @ManyToOne(() => Server)
  owner!: Server;

  /**The messages that have been sent in this channel */
  @Field(() => [Message])
  @OneToMany(() => Message, (message) => message.channel)
  messages = new Collection<Message>(this);
}
