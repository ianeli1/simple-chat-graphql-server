import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { Channel } from "./Channel";
import { Emote } from "./Emote";
import { Invite } from "./Invite";
import { User } from "./User";

@ObjectType()
@Entity()
export class Message {
  @Field()
  @PrimaryKey({ serializedPrimaryKey: true })
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
  @Field(() => [Emote], { nullable: true })
  @Property({ nullable: true })
  emotes?: Emote[];

  /**The image attached to this message */
  @Field(() => String, { nullable: true })
  @Property({ nullable: true })
  image?: string;

  @Field(() => Invite, { nullable: true })
  @Property({ nullable: true })
  invite?: Invite;

  /**The channel this message was sent in */
  @Field(() => Channel)
  @ManyToOne(() => Channel)
  channel!: Channel;

  /**The user who created the message */
  @Field(() => User)
  @ManyToOne(() => User)
  author!: User;
}
