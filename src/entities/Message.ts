import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { Channel } from "./Channel";
import { Emote } from "./Emote";
import { User } from "./User";

@ObjectType()
@Entity()
export class Message {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property({ type: "date" })
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  /**
   * The message content, a string
   */
  @Field()
  @Property()
  content!: string;

  /**Emotes to be displayed */
  @Field(() => [Emote])
  @Property()
  emotes?: Emote[];

  /**The channel this message was sent in */
  @Field(() => Channel)
  @ManyToOne(() => Channel)
  channel!: Channel;

  /**The user who created the message */
  @Field(() => User)
  @ManyToOne(() => User)
  author!: User;
}
