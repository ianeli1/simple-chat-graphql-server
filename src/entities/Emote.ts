import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { Server } from "./Server";
import { User } from "./User";

@ObjectType()
@Entity()
export class Emote {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field(() => Date)
  @Property({ type: "date" })
  createdAt = new Date();

  @Field(() => Date)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  /**The name of the emote */
  @Field()
  @Property()
  name!: string;

  /**The URL of this emote's image */
  @Field()
  @Property()
  image!: string;

  /**The server this emote is part from */
  @Field(() => Server)
  @ManyToOne(() => Server)
  owner!: Server;

  /**The user who created this emote */
  @Field(() => User)
  @ManyToOne(() => User)
  author!: User;
}
