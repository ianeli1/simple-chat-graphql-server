import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { Server } from "./Server";
import { User } from "./User";

@ObjectType()
@Entity()
export class Invite {
  @Field()
  @PrimaryKey({})
  id!: number;

  @Field(() => Date)
  @Property({ type: "date" })
  createdAt = new Date();

  @Field(() => Date)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  /**The user that created this invite */
  @Field(() => User)
  @ManyToOne(() => User)
  author!: User;

  /**The server that owns this invite */
  @Field(() => Server)
  @ManyToOne(() => Server)
  owner!: Server;

  /**The expiry date of this invite */
  @Field(() => Date, { nullable: true })
  @Property({ type: "date", nullable: true })
  expire?: Date;
}
